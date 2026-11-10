import type { Metadata } from "next";
import { Suspense } from "react";
import Home from "@/app/page";
import VerifyEmail from "@/components/VerifyEmail/VerifyEmail";

export const metadata: Metadata = {
  title: "Verify Email | Family Rest",
};

// Модалка відкривається поверх головної сторінки, як у Figma
export default function VerifyEmailPage() {
  return (
    <>
      <Home />
      {/* useSearchParams потребує Suspense */}
      <Suspense fallback={null}>
        <VerifyEmail />
      </Suspense>
    </>
  );
}
