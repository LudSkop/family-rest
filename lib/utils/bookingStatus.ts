import type { Booking } from "@/types/booking";

// Бекенд віддає CONFIRMED / PENDING / REJECTED / CANCELLED;
// «In Progress» і «Completed» рахуємо за часом
export type ReservationStatus =
  | "PENDING"
  | "RESERVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export const getReservationStatus = (
  booking: Booking,
  now = Date.now(),
): ReservationStatus => {
  if (booking.status === "CANCELLED") return "CANCELLED";
  if (booking.status === "REJECTED") return "REJECTED";
  // Запит великої компанії чекає підтвердження персоналу
  if (booking.status === "PENDING") return "PENDING";
  if (now >= new Date(booking.ends_at).getTime()) return "COMPLETED";
  if (now >= new Date(booking.starts_at).getTime()) return "IN_PROGRESS";
  return "RESERVED";
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "Awaiting confirmation",
  RESERVED: "Reserved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected by restaurant",
};
