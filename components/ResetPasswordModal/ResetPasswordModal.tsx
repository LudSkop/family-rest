"use client";

import css from "@/components/AuthForm/AuthForm.module.css";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import TextField from "@/components/TextField/TextField";
import PasswordField from "@/components/PasswordField/PasswordField";
import CodeField, { CODE_LENGTH } from "@/components/CodeField/CodeField";
import PasswordRules, {
  PasswordStrength,
} from "@/components/PasswordRules/PasswordRules";
import { useToast } from "@/components/Toast/ToastProvider";
import { useCountdown } from "@/hooks/useCountdown";
import {
  confirmPasswordReset,
  getApiError,
  requestPasswordReset,
  verifyPasswordResetCode,
} from "@/lib/api/clientApi";
import { getCodeErrorMessage } from "@/lib/utils/codeErrors";
import { isPasswordValid } from "@/lib/utils/password";

export type ResetStep = "email" | "code" | "password";

type Props = {
  onClose: () => void;
  // Для сторінки /reset-password (посилання з листа)
  initialStep?: ResetStep;
  initialEmail?: string;
  initialCode?: string;
  initialError?: string;
};

type Errors = {
  email?: string;
  code?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN = 60;

// Три кроки = три запити: email → код → новий пароль.
// Email і код живуть лише в стані компонента (нікуди не зберігаємо)
const ResetPasswordModal = ({
  onClose,
  initialStep = "email",
  initialEmail = "",
  initialCode = "",
  initialError,
}: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [step, setStep] = useState<ResetStep>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>(
    initialError ? { code: initialError } : {},
  );

  const { secondsLeft, restart } = useCountdown(0);

  // ===== Крок 1: запит коду (і «Resend» на кроці 2) =====
  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setStep("code");
      setCode("");
      setErrors({});
      restart(RESEND_COOLDOWN);
      showToast(`Verification code has been sent to email ${email}`);
    },
    onError: (error) => {
      const apiError = getApiError(error);

      // Код уже надсилали щойно — переходимо до введення й чекаємо retry_after
      if (apiError?.code === "RESEND_TOO_SOON") {
        setStep("code");
        restart(apiError.retry_after ?? RESEND_COOLDOWN);
        return;
      }

      const message =
        apiError?.code === "USER_NOT_FOUND"
          ? "We couldn't find an account with this email."
          : apiError?.code === "VALIDATION_ERROR"
            ? "Please enter a valid email address."
            : (apiError?.message ?? "Something went wrong. Please try again.");

      if (step === "email") setErrors({ email: message });
      else showToast(message, "error");
    },
  });

  // ===== Крок 2: перевірка коду =====
  const verifyMutation = useMutation({
    mutationFn: verifyPasswordResetCode,
    onSuccess: () => {
      setErrors({});
      setStep("password");
    },
    onError: (error) => {
      const apiError = getApiError(error);
      if (apiError?.code === "CODE_EXPIRED") restart(0);
      setErrors({ code: getCodeErrorMessage(apiError) });
    },
  });

  // ===== Крок 3: новий пароль =====
  const confirmMutation = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => {
      // Бекенд завершив усі сесії; автовходу немає — відкриваємо Sign In
      queryClient.setQueryData(["me"], null);
      router.push("/?auth=sign-in");
      showToast("Your password was changed successfully");
    },
    onError: (error) => {
      const apiError = getApiError(error);

      // Код перевіряється ще раз: якщо він уже не дійсний — назад до кроку 2
      if (apiError?.code?.startsWith("CODE_")) {
        if (apiError.code === "CODE_EXPIRED") restart(0);
        setStep("code");
        setErrors({ code: getCodeErrorMessage(apiError) });
        return;
      }

      setErrors({
        password: apiError?.message ?? "Something went wrong. Please try again.",
      });
    },
  });

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setErrors({
        email: "Email address is required. Please enter your email to continue.",
      });
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setErrors({ email: "Please enter a valid email address." });
      return;
    }

    setEmail(trimmed);
    requestMutation.mutate(trimmed);
  };

  const handleCodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (code.length !== CODE_LENGTH) {
      setErrors({ code: "Please enter the 6-digit code from the email." });
      return;
    }

    verifyMutation.mutate({ email, code });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newErrors: Errors = {};

    if (!password) newErrors.password = "Password is required.";
    else if (!isPasswordValid(password))
      newErrors.password = "Password doesn't meet the requirements.";

    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    confirmMutation.mutate({
      email,
      code,
      password,
      password_confirmation: confirmPassword,
    });
  };

  const submitClass = (isActive: boolean) =>
    `${css.submit} ${isActive ? css.submitActive : ""}`;

  // ===== Крок 1 =====
  if (step === "email") {
    return (
      <Modal onClose={onClose} labelledBy="reset-title">
        <h2 id="reset-title" className={css.title}>
          Reset Password
        </h2>
        <p className={css.text}>
          Enter your email so we can send you a code to verify your account.
        </p>

        <form className={css.form} onSubmit={handleEmailSubmit} noValidate>
          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="e.g. username@domain.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors({});
            }}
            error={errors.email}
          />

          <div className={css.buttons}>
            <Link href="?auth=sign-in" scroll={false} className={css.secondary}>
              Back
            </Link>
            <button
              type="submit"
              className={submitClass(email.trim() !== "" && !errors.email)}
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Sending..." : "Request Code"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // ===== Крок 2 =====
  if (step === "code") {
    return (
      <Modal onClose={onClose} labelledBy="reset-title">
        <h2 id="reset-title" className={css.title}>
          Enter Verification Code
        </h2>
        <p className={css.text}>
          The verification code was sent to email <strong>{email}</strong>.
        </p>

        <form className={css.form} onSubmit={handleCodeSubmit} noValidate>
          <CodeField
            value={code}
            onChange={(value) => {
              setCode(value);
              setErrors({});
            }}
            error={errors.code}
            secondsLeft={secondsLeft}
            onResend={() => requestMutation.mutate(email)}
            isResending={requestMutation.isPending}
          />

          <div className={css.buttons}>
            <button
              type="button"
              className={css.secondary}
              onClick={() => {
                setErrors({});
                setStep("email");
              }}
            >
              Back
            </button>
            <button
              type="submit"
              className={submitClass(code.length === CODE_LENGTH && !errors.code)}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Checking..." : "Confirm"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // ===== Крок 3 =====
  const isPasswordActive =
    password !== "" &&
    confirmPassword !== "" &&
    !errors.password &&
    !errors.confirmPassword;

  return (
    <Modal onClose={onClose} labelledBy="reset-title">
      <h2 id="reset-title" className={css.title}>
        Reset Password
      </h2>
      <p className={css.text}>
        Create a new password for <strong>{email}</strong>.
      </p>

      <form className={css.form} onSubmit={handlePasswordSubmit} noValidate>
        <div className={css.passwordBlock}>
          <PasswordField
            label="New Password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            aria-describedby="reset-password-rules"
            labelExtra={<PasswordStrength value={password} />}
          />
          <PasswordRules
            id="reset-password-rules"
            value={password}
            showErrors={Boolean(errors.password)}
          />
        </div>

        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
        />

        <div className={css.buttons}>
          <button
            type="button"
            className={css.secondary}
            onClick={() => {
              setErrors({});
              setStep("code");
            }}
          >
            Back
          </button>
          <button
            type="submit"
            className={submitClass(isPasswordActive)}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending ? "Saving..." : "Reset Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ResetPasswordModal;
