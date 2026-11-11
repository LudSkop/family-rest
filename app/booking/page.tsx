import type { Metadata } from "next";
import { Suspense } from "react";
import Booking from "@/components/Booking/Booking";

export const metadata: Metadata = {
  title: "Book a Table | Family Rest",
  description: "Find a free table at one of the Family Rest restaurants.",
};

export default function BookingPage() {
  return (
    // useSearchParams (?location=) потребує Suspense
    <Suspense fallback={null}>
      <Booking />
    </Suspense>
  );
}
