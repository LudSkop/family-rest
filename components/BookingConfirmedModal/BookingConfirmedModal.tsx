"use client";

import css from "./BookingConfirmedModal.module.css";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import { useToast } from "@/components/Toast/ToastProvider";
import {
  toPreOrderSession,
  usePreOrder,
} from "@/components/PreOrder/PreOrderProvider";
import { getInviteCode } from "@/lib/api/clientApi";
import type { Booking } from "@/types/booking";
import {
  formatBookingDate,
  formatPeople,
  formatTimeRange,
} from "@/lib/utils/bookingTime";

type Props = {
  booking: Booking;
  onClose: () => void;
};

// «Reservation Confirmed» з Figma: підсумок, посилання-запрошення,
// «View Reservation» → /reservations, «Make Pre-Order» → /menu
const BookingConfirmedModal = ({ booking, onClose }: Props) => {
  const { showToast } = useToast();
  const { startPreOrder } = usePreOrder();

  const { data: code, isError } = useQuery({
    queryKey: ["bookings", booking.id, "invite"],
    queryFn: () => getInviteCode(booking.id),
    retry: false,
  });

  const inviteLink = code ? `${window.location.origin}/join/${code}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast("Share it with your friends.", "success", "Link copied!");
    } catch {
      showToast("Could not copy the link. Copy it manually.", "error");
    }
  };

  const rows = [
    { label: "Location", value: booking.location.address },
    { label: "Date", value: formatBookingDate(booking.starts_at) },
    {
      label: "Time",
      value: formatTimeRange(booking.starts_at, booking.ends_at),
    },
    {
      label: "Guests",
      value: formatPeople(booking.party_size),
    },
  ];

  return (
    <Modal onClose={onClose} labelledBy="confirmed-title" className={css.modal}>
      <h2 id="confirmed-title" className={css.title}>
        Reservation Confirmed
      </h2>

      <dl className={css.details}>
        {rows.map(({ label, value }) => (
          <div key={label} className={css.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={css.invite}>
        <p className={css.inviteLabel} id="invite-label">
          Invite Link
        </p>
        <div className={css.linkBox}>
          <input
            className={css.linkInput}
            value={isError ? "Could not create the link" : inviteLink || "..."}
            readOnly
            aria-labelledby="invite-label"
            onFocus={(event) => event.target.select()}
          />
          <button
            type="button"
            className={css.copyBtn}
            onClick={copyLink}
            disabled={!inviteLink}
            aria-label="Copy invite link"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V6a2 2 0 0 1 2-2h9" />
            </svg>
          </button>
        </div>
        <p className={css.hint}>
          You are able to share this link for pre-order with your group.
        </p>
      </div>

      <div className={css.actions}>
        <ButtonLink href="/reservations" variant="secondary">
          View Reservation
        </ButtonLink>
        <ButtonLink
          href="/menu"
          // Власник починає передзамовлення для щойно створеного бронювання
          onClick={() => startPreOrder(toPreOrderSession(booking))}
        >
          Make Pre-Order
        </ButtonLink>
      </div>
    </Modal>
  );
};

export default BookingConfirmedModal;
