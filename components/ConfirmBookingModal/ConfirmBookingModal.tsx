"use client";

import css from "./ConfirmBookingModal.module.css";
import Modal from "@/components/Modal/Modal";
import {
  formatBookingDate,
  formatPeople,
  formatSlotTime,
} from "@/lib/utils/bookingTime";
import type { BookingTable, TableSlot } from "@/types/booking";

type Props = {
  table: BookingTable;
  slot: TableSlot;
  partySize: number;
  isBooking: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Підтвердження перед бронюванням: захищає від випадкового кліку по часу
const ConfirmBookingModal = ({
  table,
  slot,
  partySize,
  isBooking,
  onConfirm,
  onClose,
}: Props) => {
  const rows = [
    { label: "Location", value: table.location.address },
    {
      label: "Table",
      value: `${table.label} · up to ${table.capacity} guests`,
    },
    { label: "Date", value: formatBookingDate(slot.starts_at) },
    { label: "Time", value: formatSlotTime(slot.starts_at) },
    { label: "Guests", value: formatPeople(partySize) },
  ];

  return (
    <Modal
      onClose={onClose}
      labelledBy="confirm-booking-title"
      className={css.modal}
    >
      <h2 id="confirm-booking-title" className={css.title}>
        Book this table?
      </h2>
      <p className={css.lead}>Please check the details of your reservation.</p>

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
          disabled={isBooking}
        >
          Cancel
        </button>
        <button
          type="button"
          className={css.confirm}
          onClick={onConfirm}
          disabled={isBooking}
        >
          {isBooking ? "Booking..." : "Book Table"}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmBookingModal;
