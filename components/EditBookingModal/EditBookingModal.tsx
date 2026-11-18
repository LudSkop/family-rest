"use client";

import css from "./EditBookingModal.module.css";
import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import { useToast } from "@/components/Toast/ToastProvider";
import { INSTANT_BOOKING_LIMIT } from "@/components/ConfirmBookingModal/ConfirmBookingModal";
import { editBooking, getApiError, getEditSlots } from "@/lib/api/clientApi";
import { formatBookingDate, formatSlotTime } from "@/lib/utils/bookingTime";
import type { Booking } from "@/types/booking";

type Props = {
  booking: Booking;
  onClose: () => void;
};

// Бекенд не називає межі тривалості («від стандартної до максимальної з кроком
// сітки»), тож питаємо сітку для кожного варіанту й лишаємо ті, що він приймає
const DURATION_OPTIONS = [60, 90, 120, 150, 180, 210, 240, 270, 300];

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours} h`, rest && `${rest} min`]
    .filter(Boolean)
    .join(" ");
};

const sameTime = (a: string, b: string) =>
  new Date(a).getTime() === new Date(b).getTime();

const EDIT_ERRORS: Record<string, string> = {
  SLOT_UNAVAILABLE: "This time was just taken. Please choose another one.",
  OVERLAPPING_BOOKING:
    "You already have another reservation at this time. Please choose another one.",
  PARTY_BELOW_PARTICIPANTS:
    "More people have already joined than the new number of guests.",
  ENDS_AFTER_CLOSING:
    "The visit must end before the restaurant closes. Choose an earlier time or a shorter stay.",
  SLOT_INVALID: "Please choose one of the available times.",
  DURATION_INVALID: "This length of stay isn't available.",
  TABLE_NOT_SUITABLE: "This table doesn't fit that many guests.",
  PARTY_TOO_LARGE: `Online changes are possible for up to ${INSTANT_BOOKING_LIMIT} guests. Please call the restaurant.`,
};

// Коли змінити вже не можна — закриваємо модалку з поясненням
const CLOSED_ERRORS: Record<string, string> = {
  EDIT_CLOSED:
    "It's too close to the start time to change this reservation online. Please call the restaurant.",
  BOOKING_ALREADY_CANCELLED: "This reservation has been cancelled.",
  BOOKING_REJECTED: "The restaurant has rejected this request.",
  BOOKING_PENDING:
    "This request is still awaiting the restaurant's confirmation.",
  LARGE_BOOKING_NOT_EDITABLE:
    "Large-group reservations can't be changed online — only cancelled.",
  BOOKING_NOT_FOUND: "This reservation is no longer available.",
};

// «Edit Reservation»: час, кількість гостей і тривалість. День і стіл ті самі
const EditBookingModal = ({ booking, onClose }: Props) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const currentDuration = Math.round(
    (new Date(booking.ends_at).getTime() -
      new Date(booking.starts_at).getTime()) /
      60000,
  );

  const [partySize, setPartySize] = useState(booking.party_size);
  const [duration, setDuration] = useState(currentDuration);
  const [startsAt, setStartsAt] = useState<string | null>(booking.starts_at);
  const [formError, setFormError] = useState<string | null>(null);

  // Менше, ніж уже приєдналось, бекенд не дозволить
  const minGuests = Math.max(1, booking.participants.length);
  const maxGuests = Math.min(INSTANT_BOOKING_LIMIT, booking.table.capacity);

  const durations = [...new Set([...DURATION_OPTIONS, currentDuration])].sort(
    (a, b) => a - b,
  );

  const slotQueries = useQueries({
    queries: durations.map((minutes) => ({
      queryKey: ["bookings", booking.id, "slots", minutes],
      queryFn: () => getEditSlots(booking.id, minutes),
      retry: false,
    })),
  });

  const byDuration = new Map(
    durations.map((minutes, index) => [minutes, slotQueries[index]]),
  );
  const current = byDuration.get(duration)!;

  // Бронювання вже не можна змінити (EDIT_CLOSED тощо) — однаково для всіх тривалостей
  const closedCode = slotQueries
    .map((query) => getApiError(query.error)?.code ?? "")
    .find((code) => code in CLOSED_ERRORS);

  const allowedDurations = durations.filter((minutes) => {
    const query = byDuration.get(minutes)!;
    if (minutes === currentDuration) return true;
    return query.isSuccess;
  });

  const slots = current.data ?? [];
  const isSlotFree = (time: string) =>
    slots.some((slot) => slot.available && sameTime(slot.starts_at, time));
  // Обраний час міг стати недоступним після зміни тривалості
  const selected = startsAt && isSlotFree(startsAt) ? startsAt : null;

  const hasChanges =
    partySize !== booking.party_size ||
    duration !== currentDuration ||
    (selected !== null && !sameTime(selected, booking.starts_at));

  const save = useMutation({
    mutationFn: editBooking,
    onSuccess: () => {
      showToast("", "success", "Reservation Updated!");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
    },
    onError: (error) => {
      const code = getApiError(error)?.code ?? "";

      if (code in CLOSED_ERRORS) {
        showToast(CLOSED_ERRORS[code], "error");
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        onClose();
        return;
      }

      setFormError(
        EDIT_ERRORS[code] ?? "Could not save the changes. Please try again.",
      );
      // Сітка могла змінитися, поки модалка була відкрита
      if (code === "SLOT_UNAVAILABLE" || code === "OVERLAPPING_BOOKING") {
        current.refetch();
      }
    },
  });

  const handleSave = () => {
    if (!selected) {
      setFormError("Please choose a time.");
      return;
    }
    setFormError(null);
    save.mutate({
      bookingId: booking.id,
      starts_at: selected,
      party_size: partySize,
      duration_minutes: duration,
    });
  };

  const changeDuration = (minutes: number) => {
    setDuration(minutes);
    setFormError(null);
  };

  return (
    <Modal
      onClose={() => !save.isPending && onClose()}
      labelledBy="edit-booking-title"
      className={css.modal}
    >
      <h2 id="edit-booking-title" className={css.title}>
        Edit Reservation
      </h2>
      <p className={css.meta}>
        <span>{booking.location.address}</span>
        <span>{formatBookingDate(booking.starts_at)}</span>
        <span>{booking.table.label}</span>
      </p>

      {closedCode ? (
        <>
          <p className={css.banner} role="alert">
            {CLOSED_ERRORS[closedCode]}
          </p>
          <div className={css.actions}>
            <button type="button" className={css.secondary} onClick={onClose}>
              Close
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={css.row}>
            <div className={css.field}>
              <span className={css.label} id="edit-guests-label">
                Guests
              </span>
              <div
                className={css.stepper}
                role="group"
                aria-labelledby="edit-guests-label"
              >
                <button
                  type="button"
                  className={css.stepBtn}
                  onClick={() => setPartySize((prev) => prev - 1)}
                  disabled={partySize <= minGuests}
                  aria-label="Fewer guests"
                >
                  −
                </button>
                <output className={css.count} aria-live="polite">
                  {partySize}
                </output>
                <button
                  type="button"
                  className={css.stepBtn}
                  onClick={() => setPartySize((prev) => prev + 1)}
                  disabled={partySize >= maxGuests}
                  aria-label="More guests"
                >
                  +
                </button>
              </div>
            </div>

            <label className={css.field}>
              <span className={css.label}>Length of stay</span>
              <select
                className={css.select}
                value={duration}
                onChange={(event) => changeDuration(Number(event.target.value))}
              >
                {allowedDurations.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatDuration(minutes)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {minGuests > 1 && (
            <p className={css.hint}>
              {minGuests} people have already joined, so the number of guests
              can&apos;t be lower.
            </p>
          )}

          <fieldset className={css.times}>
            <legend className={css.label}>Time</legend>

            {current.isLoading && (
              <p className={css.hint} role="status">
                Loading available times...
              </p>
            )}

            {current.isError && (
              <p className={css.hint}>
                {getApiError(current.error)?.code === "DURATION_INVALID"
                  ? "This length of stay isn't available. Please choose another one."
                  : "Could not load available times. Please try again."}
              </p>
            )}

            {current.isSuccess && (
              <ul className={css.slots}>
                {slots.map((slot) => {
                  const isSelected =
                    selected !== null && sameTime(slot.starts_at, selected);
                  return (
                    <li key={slot.starts_at}>
                      <button
                        type="button"
                        className={`${css.slot} ${
                          isSelected
                            ? css.selected
                            : slot.available
                              ? css.free
                              : css.taken
                        }`}
                        disabled={!slot.available || save.isPending}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setStartsAt(slot.starts_at);
                          setFormError(null);
                        }}
                      >
                        {formatSlotTime(slot.starts_at)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </fieldset>

          <p className={css.note}>
            To change the date or table, cancel this reservation and book a new
            one.
          </p>

          {formError && (
            <p className={css.banner} role="alert">
              {formError}
            </p>
          )}

          <div className={css.actions}>
            <button
              type="button"
              className={css.tertiary}
              onClick={onClose}
              disabled={save.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={css.primary}
              onClick={handleSave}
              disabled={!hasChanges || !selected || save.isPending}
            >
              {save.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default EditBookingModal;
