"use client";

import css from "@/components/ConfirmBookingModal/ConfirmBookingModal.module.css";
import Modal from "@/components/Modal/Modal";
import { formatBookingDate, formatTimeRange } from "@/lib/utils/bookingTime";
import type { Booking } from "@/types/booking";

type Props = {
  booking: Booking;
  isCancelling: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Підтвердження перед скасуванням бронювання (🗑 на картці)
const CancelBookingModal = ({
  booking,
  isCancelling,
  onConfirm,
  onClose,
}: Props) => {
  const rows = [
    { label: "Location", value: booking.location.address },
    { label: "Table", value: booking.table.label },
    { label: "Date", value: formatBookingDate(booking.starts_at) },
    {
      label: "Time",
      value: formatTimeRange(booking.starts_at, booking.ends_at),
    },
  ];

  return (
    <Modal
      onClose={onClose}
      labelledBy="cancel-booking-title"
      className={css.modal}
    >
      <h2 id="cancel-booking-title" className={css.title}>
        Cancel this reservation?
      </h2>
      <p className={css.lead}>
        The table will be released, and your guests&apos; invite link will stop
        working.
      </p>

      <dl className={css.details}>
        {rows.map(({ label, value }) => (
          <div key={label} className={css.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={css.actions}>
        <button
          type="button"
          className={css.cancel}
          onClick={onClose}
          disabled={isCancelling}
        >
          Keep It
        </button>
        <button
          type="button"
          className={css.confirm}
          onClick={onConfirm}
          disabled={isCancelling}
        >
          {isCancelling ? "Cancelling..." : "Cancel Reservation"}
        </button>
      </div>
    </Modal>
  );
};

export default CancelBookingModal;
