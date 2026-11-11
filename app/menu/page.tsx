import type { Metadata } from "next";
import { Suspense } from "react";
import Menu from "@/components/Menu/Menu";

export const metadata: Metadata = {
  title: "Menu | Family Rest",
  description:
    "Seasonal bowls, Georgian classics and desserts — the full Family Rest menu.",
};

export default function MenuPage() {
  return (
    // useSearchParams (фільтри з адреси) потребує Suspense
    <Suspense fallback={null}>
      <Menu />
    </Suspense>
  );
}
