"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast/ToastProvider";

// Коли вхід через Google не вдався, API повертає на /?auth_error=<CODE>
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAUTH_CANCELLED: "Sign-in was cancelled.",
  OAUTH_EMAIL_UNVERIFIED:
    "Your Google email is not verified. Use another way to sign in.",
  OAUTH_ACCOUNT_CONFLICT: "This account is linked to another Google account.",
  OAUTH_UNAVAILABLE: "This sign-in method is not available.",
  OAUTH_FAILED: "Sign-in failed. Try again.",
};

const AuthErrorHandler = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const authError = searchParams.get("auth_error");

  // React у dev-режимі запускає ефект двічі — показуємо toast лише раз на код
  const handledErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authError || handledErrorRef.current === authError) return;
    handledErrorRef.current = authError;

    showToast(
      AUTH_ERROR_MESSAGES[authError] ?? AUTH_ERROR_MESSAGES.OAUTH_FAILED,
      "error",
    );

    // Прибираємо параметр з адреси, щоб повідомлення не з'явилось знову
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth_error");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [authError, searchParams, pathname, router, showToast]);

  return null;
};

export default AuthErrorHandler;
