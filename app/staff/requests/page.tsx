import type { Metadata } from "next";
import StaffRequests from "@/components/StaffRequests/StaffRequests";

export const metadata: Metadata = {
  title: "Booking Requests | Family Rest Staff",
};

export default function StaffRequestsPage() {
  return <StaffRequests />;
}
