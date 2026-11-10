"use client";

import css from "@/components/AuthForm/AuthForm.module.css";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/Modal/Modal";
import ResetPasswordModal, {
  type ResetStep,
} from "@/components/ResetPasswordModal/ResetPasswordModal";
import { getApiError, verifyPasswordResetCode } from "@/lib/api/clientApi";
import { getCodeErrorMessage } from "@/lib/utils/codeErrors";

type Result = {
  step: ResetStep;
  error?: string;
};

// /reset-password?email=...&code=... — кнопка «Reset password» з листа.
// Перевіряємо код: 204 → крок нового пароля; 400/404 → крок коду з помилкою
const ResetPasswordLink = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Значення з адреси читаємо один раз: потім прибираємо код з URL
  const [email] = useState(searchParams.get("email") ?? "");
  const [code] = useState((searchParams.get("code") ?? "").replace(/\D/g, ""));
  const [result, setResult] = useState<Result | null>(
    email && code ? null : { step: "email" },
  );

  const closeToHome = () => router.replace("/");

  // Один запит навіть якщо React у dev запустить ефект двічі
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!email || !code || checkedRef.current) return;
    checkedRef.current = true;

    router.replace("/reset-password");

    verifyPasswordResetCode({ email, code })
      .then(() => setResult({ step: "password" }))
      .catch((error) =>
        setResult({
          step: "code",
          error: getCodeErrorMessage(getApiError(error)),
        }),
      );
  }, [email, code, router]);

  if (!result) {
    return (
      <Modal onClose={closeToHome} labelledBy="reset-link-title">
        <h2 id="reset-link-title" className={css.title}>
          Checking your code
        </h2>
        <p className={css.loading} role="status">
          Please wait a moment...
        </p>
      </Modal>
    );
  }

  return (
    <ResetPasswordModal
      onClose={closeToHome}
      initialStep={result.step}
      initialEmail={email}
      initialCode={result.step === "password" ? code : ""}
      initialError={result.error}
    />
  );
};

export default ResetPasswordLink;
