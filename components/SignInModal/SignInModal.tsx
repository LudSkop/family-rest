"use client";

import css from "@/components/AuthForm/AuthForm.module.css";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import TextField from "@/components/TextField/TextField";
import PasswordField from "@/components/PasswordField/PasswordField";
import GoogleButton from "@/components/GoogleButton/GoogleButton";
import { getApiError, getApiStatus, login } from "@/lib/api/clientApi";

type Props = {
  onClose: () => void;
};

type FieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (email: string, password: string): FieldErrors => {
  const errors: FieldErrors = {};

  if (!email)
    errors.email =
      "Email address is required. Please enter your email to continue.";
  else if (!EMAIL_PATTERN.test(email))
    errors.email = "Please enter a valid email address.";

  if (!password)
    errors.password =
      "Password is required. Please enter your password to continue.";

  return errors;
};

const SignInModal = ({ onClose }: Props) => {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      onClose();
    },
    onError: (error) => {
      const apiError = getApiError(error);
      const status = getApiStatus(error);

      // 423 — акаунт тимчасово заблоковано після кількох невдалих спроб
      if (status === 423) {
        const minutes = apiError?.retry_after
          ? Math.ceil(apiError.retry_after / 60)
          : null;
        setLockedMessage(
          minutes
            ? `Your account is temporarily locked due to multiple failed login attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`
            : "Your account is temporarily locked due to multiple failed login attempts. Please try again later.",
        );
        return;
      }

      if (apiError?.code === "INVALID_CREDENTIALS") {
        setErrors({
          password: "Incorrect email or password. Try again or create an account.",
        });
        return;
      }

      setErrors({
        password: apiError?.message ?? "Something went wrong. Please try again.",
      });
    },
  });

  // Як у Figma: зелена лише коли обидва поля заповнені й немає помилок
  const hasErrors = Boolean(errors.email || errors.password || lockedMessage);
  const isActive = email.trim() !== "" && password !== "" && !hasErrors;

  // Після редагування поля його помилка зникає
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPassword(event.target.value);
    setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const validationErrors = validate(trimmedEmail, password);
    setErrors(validationErrors);
    setLockedMessage(null);

    if (Object.keys(validationErrors).length > 0) return;

    mutate({ email: trimmedEmail, password });
  };

  return (
    <Modal onClose={onClose} labelledBy="sign-in-title">
      <h2 id="sign-in-title" className={css.title}>
        Sign In to Your Account
      </h2>

      {lockedMessage && (
        <p className={css.banner} role="alert">
          {lockedMessage}
        </p>
      )}

      <form className={css.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="e.g. username@domain.com"
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
        />

        <div className={css.passwordBlock}>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
          />

          <Link
            href="?auth=forgot-password"
            scroll={false}
            className={css.link}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className={`${css.submit} ${isActive ? css.submitActive : ""}`}
          disabled={isPending}
        >
          {isPending ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <p className={css.divider}>or</p>
      <GoogleButton>Sign in with Google</GoogleButton>

      <p className={css.footer}>
        Don&apos;t have an account?{" "}
        <Link href="?auth=sign-up" scroll={false} className={css.link}>
          Create an Account
        </Link>
      </p>
    </Modal>
  );
};

export default SignInModal;
