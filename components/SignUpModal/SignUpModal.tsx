"use client";

import css from "@/components/AuthForm/AuthForm.module.css";
import ownCss from "./SignUpModal.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import TextField from "@/components/TextField/TextField";
import PasswordField from "@/components/PasswordField/PasswordField";
import GoogleButton from "@/components/GoogleButton/GoogleButton";
import { getApiError, register } from "@/lib/api/clientApi";

type Props = {
  onClose: () => void;
};

type Values = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof Values, string>> & { form?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Правила пароля з Figma перевіряє лише фронт (бекенд — тільки 8–128 символів)
const PASSWORD_RULES = [
  {
    label: "8–16 characters",
    test: (value: string) => value.length >= 8 && value.length <= 16,
  },
  {
    label: "Includes: uppercase, lowercase, number, symbol",
    test: (value: string) =>
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value) &&
      /[^A-Za-z0-9\s]/.test(value),
  },
];

// Надійність: скільки з 5 вимог виконано (довжина, A-Z, a-z, цифра, символ)
const getStrength = (value: string) => {
  const checks = [
    value.length >= 8 && value.length <= 16,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9\s]/.test(value),
  ];
  const score = checks.filter(Boolean).length;

  if (score === checks.length) return { label: "Strong", level: "strong" };
  if (score >= 3) return { label: "Medium", level: "medium" };
  return { label: "Weak", level: "weak" };
};

const validate = (values: Values): FieldErrors => {
  const errors: FieldErrors = {};

  if (!values.firstName) errors.firstName = "First name is required.";
  if (!values.lastName) errors.lastName = "Last name is required.";

  if (!values.email)
    errors.email =
      "Email address is required. Please enter your email to continue.";
  else if (!EMAIL_PATTERN.test(values.email))
    errors.email = "Please enter a valid email address.";

  if (!values.password) errors.password = "Password is required.";
  else if (!PASSWORD_RULES.every((rule) => rule.test(values.password)))
    errors.password = "Password doesn't meet the requirements.";

  if (!values.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = "Passwords do not match.";

  return errors;
};

const INITIAL_VALUES: Values = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const SignUpModal = ({ onClose }: Props) => {
  const router = useRouter();

  const [values, setValues] = useState<Values>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});

  const { mutate, isPending } = useMutation({
    mutationFn: register,
    onSuccess: ({ email }) => {
      // Далі — введення 6-значного коду з листа (сторінка /verify-email)
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
      const apiError = getApiError(error);

      if (apiError?.code.includes("EMAIL")) {
        setErrors({ email: apiError.message });
        return;
      }

      setErrors({
        form: apiError?.message ?? "Something went wrong. Please try again.",
      });
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Після редагування поля його помилка зникає
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const isFilled = Object.values(values).every((value) => value.trim() !== "");
  const hasErrors = Object.values(errors).some(Boolean);
  const isActive = isFilled && !hasErrors;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed: Values = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
    };

    const validationErrors = validate(trimmed);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    mutate({
      first_name: trimmed.firstName,
      last_name: trimmed.lastName,
      email: trimmed.email,
      password: trimmed.password,
      password_confirmation: trimmed.confirmPassword,
    });
  };

  return (
    <Modal onClose={onClose} labelledBy="sign-up-title">
      <h2 id="sign-up-title" className={css.title}>
        Create an Account
      </h2>

      {errors.form && (
        <p className={css.banner} role="alert">
          {errors.form}
        </p>
      )}

      <form className={css.form} onSubmit={handleSubmit} noValidate>
        <div className={ownCss.nameRow}>
          <TextField
            label="First Name"
            name="firstName"
            autoComplete="given-name"
            placeholder="e.g. Jonson"
            maxLength={100}
            value={values.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <TextField
            label="Last Name"
            name="lastName"
            autoComplete="family-name"
            placeholder="e.g. Doe"
            maxLength={100}
            value={values.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
        </div>

        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="e.g. username@domain.com"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />

        <div className={ownCss.passwordBlock}>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            aria-describedby="password-rules"
            labelExtra={
              values.password && (
                <span
                  className={`${ownCss.strength} ${ownCss[getStrength(values.password).level]}`}
                  aria-live="polite"
                >
                  {getStrength(values.password).label}
                </span>
              )
            }
          />

          <ul id="password-rules" className={ownCss.rules}>
            {PASSWORD_RULES.map((rule) => {
              // Виконане правило — зелене; після невдалої спроби невиконане — червоне
              const isMet = rule.test(values.password);
              const isBroken = Boolean(errors.password) && !isMet;
              const ruleClass = isMet
                ? ownCss.ruleMet
                : isBroken
                  ? ownCss.ruleError
                  : undefined;
              return (
                <li key={rule.label} className={ruleClass}>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          className={`${css.submit} ${isActive ? css.submitActive : ""}`}
          disabled={isPending}
        >
          {isPending ? "Creating an Account..." : "Create an Account"}
        </button>
      </form>

      <p className={css.divider}>or</p>
      <GoogleButton>Sign up with Google</GoogleButton>

      <p className={css.footer}>
        Already have an account?{" "}
        <Link href="?auth=sign-in" scroll={false} className={css.link}>
          Sign In
        </Link>{" "}
        instead
      </p>
    </Modal>
  );
};

export default SignUpModal;
