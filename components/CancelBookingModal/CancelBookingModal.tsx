"use client";

import own from "./CancelBookingModal.module.css";
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
  return (
    <Modal
      onClose={onClose}
      labelledBy="cancel-booking-title"
      className={own.modal}
    >
      <h2 id="cancel-booking-title" className={own.title}>
        Cancel Reservation
      </h2>
      <p className={own.text}>
        Cancelling this reservation will remove all pre-orders.
        <br />
        You won&apos;t be able to undo this action.
      </p>
      <p className="visually-hidden">
        {booking.location.address}, {booking.table.label},{" "}
        {formatBookingDate(booking.starts_at)},{" "}
        {formatTimeRange(booking.starts_at, booking.ends_at)}
      </p>

      {/* «Keep it» — текстова кнопка, «Cancel» — червона обводка (Figma) */}
      <div className={own.actions}>
        <button
          type="button"
          className={own.keep}
          onClick={onClose}
          disabled={isCancelling}
        >
          Keep it
        </button>
        <button
          type="button"
          className={own.cancel}
          onClick={onConfirm}
          disabled={isCancelling}
        >
          {isCancelling ? "Cancelling..." : "Cancel"}
        </button>
      </div>
    </Modal>
  );
};

export default CancelBookingModal;
