import type { Metadata } from "next";
import { Suspense } from "react";
import Home from "@/app/page";
import ResetPasswordLink from "@/components/ResetPasswordLink/ResetPasswordLink";

export const metadata: Metadata = {
  title: "Reset Password | Family Rest",
};

// Модалка відкривається поверх головної сторінки, як у Figma
export default function ResetPasswordPage() {
  return (
    <>
      <Home />
      {/* useSearchParams потребує Suspense */}
      <Suspense fallback={null}>
        <ResetPasswordLink />
      </Suspense>
    </>
  );
}
