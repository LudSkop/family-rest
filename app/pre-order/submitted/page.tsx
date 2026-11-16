import type { Metadata } from "next";
import PreOrderSubmitted from "@/components/PreOrderSubmitted/PreOrderSubmitted";

export const metadata: Metadata = {
  title: "Pre-Order Submitted | Family Rest",
};

export default function PreOrderSubmittedPage() {
  return <PreOrderSubmitted />;
}
