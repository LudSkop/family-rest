import type { Metadata } from "next";
import Reservations from "@/components/Reservations/Reservations";

export const metadata: Metadata = {
  title: "My Reservations | Family Rest",
};

export default function ReservationsPage() {
  return <Reservations />;
}
