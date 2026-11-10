"use client";

import css from "@/components/AuthForm/AuthForm.module.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import CodeField, { CODE_LENGTH } from "@/components/CodeField/CodeField";
import { useToast } from "@/components/Toast/ToastProvider";
import { useCountdown } from "@/hooks/useCountdown";
import {
  getApiError,
  resendCode,
  verifyEmail,
  type VerifyEmailParams,
} from "@/lib/api/clientApi";
import { getCodeErrorMessage } from "@/lib/utils/codeErrors";

const RESEND_COOLDOWN = 60;

// /verify-email?email=...&code=...  — посилання з листа: перевіряємо одразу
// /verify-email?email=...           — після реєстрації: користувач вводить код
const VerifyEmail = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const email = searchParams.get("email") ?? "";
  const linkCode = (searchParams.get("code") ?? "").replace(/\D/g, "");

  // Запам'ятовуємо, що прийшли з листа: після прибирання коду з адреси це не зміниться
  const [isFromLink] = useState(linkCode.length === CODE_LENGTH);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Після реєстрації код щойно надіслано — Resend доступний через 60 с
  const { secondsLeft, restart } = useCountdown(
    isFromLink ? 0 : RESEND_COOLDOWN,
  );

  const closeToHome = () => router.replace("/");

  const verifyMutation = useMutation({
    mutationFn: (params: VerifyEmailParams) => verifyEmail(params),
    onSuccess: () => {
      // Бекенд після підтвердження одразу ставить cookie сесії
      queryClient.invalidateQueries({ queryKey: ["me"] });
      showToast("Your email has been verified. Welcome to Family Rest!");
      router.replace("/");
    },
    onError: (err) => {
      const apiError = getApiError(err);

      // Уже підтверджено — це теж успіх: пропонуємо увійти
      if (apiError?.code === "ALREADY_VERIFIED") {
        showToast("Your email is already verified. Please sign in.");
        router.replace("/?auth=sign-in");
        return;
      }

      if (apiError?.code === "CODE_EXPIRED") restart(0);
      setError(getCodeErrorMessage(apiError));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendCode(email),
    onSuccess: () => {
      setError(null);
      setCode("");
      restart(RESEND_COOLDOWN);
      showToast(`Verification code has been sent to email ${email}`);
    },
    onError: (err) => {
      const apiError = getApiError(err);

      if (apiError?.code === "RESEND_TOO_SOON") {
        restart(apiError.retry_after ?? RESEND_COOLDOWN);
        return;
      }

      if (apiError?.code === "ALREADY_VERIFIED") {
        showToast("Your email is already verified. Please sign in.");
        router.replace("/?auth=sign-in");
        return;
      }

      showToast(apiError?.message ?? "Could not send a new code.", "error");
    },
  });

  // Код з листа відправляємо один раз (у dev React запускає ефект двічі,
  // а кожна зайва спроба з'їдала б одну з 5) і прибираємо його з адреси
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!isFromLink || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;

    verifyMutation.mutate({ email, code: linkCode });
    router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
  }, [isFromLink, email, linkCode, verifyMutation, router]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (code.length !== CODE_LENGTH) {
      setError("Please enter the 6-digit code from the email.");
      return;
    }

    verifyMutation.mutate({ email, code });
  };

  if (!email) {
    return (
      <Modal onClose={closeToHome} labelledBy="verify-title">
        <h2 id="verify-title" className={css.title}>
          Verification link is invalid
        </h2>
        <p className={css.text}>
          The link is missing your email. Please create an account again.
        </p>
        <Link href="/?auth=sign-up" className={css.secondary}>
          Create an Account
        </Link>
      </Modal>
    );
  }

  // Код з листа перевіряється — форма не потрібна
  if (isFromLink && !error) {
    return (
      <Modal onClose={closeToHome} labelledBy="verify-title">
        <h2 id="verify-title" className={css.title}>
          Verifying your email
        </h2>
        <p className={css.loading} role="status">
          Please wait a moment...
        </p>
      </Modal>
    );
  }

  const isActive = code.length === CODE_LENGTH && !error;

  return (
    <Modal onClose={closeToHome} labelledBy="verify-title">
      <h2 id="verify-title" className={css.title}>
        Enter Verification Code
      </h2>
      <p className={css.text}>
        The verification code was sent to email <strong>{email}</strong>.
        Please enter the code from the email.
      </p>

      <form className={css.form} onSubmit={handleSubmit} noValidate>
        <CodeField
          value={code}
          onChange={handleCodeChange}
          error={error ?? undefined}
          secondsLeft={secondsLeft}
          onResend={() => resendMutation.mutate()}
          isResending={resendMutation.isPending}
        />

        <div className={css.buttons}>
          <Link href="/?auth=sign-up" className={css.secondary}>
            Back
          </Link>
          <button
            type="submit"
            className={`${css.submit} ${isActive ? css.submitActive : ""}`}
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? "Checking..." : "Confirm"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VerifyEmail;
