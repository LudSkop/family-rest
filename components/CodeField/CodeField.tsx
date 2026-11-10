import css from "./CodeField.module.css";
import TextField from "@/components/TextField/TextField";

type Props = {
  value: string;
  onChange: (code: string) => void;
  error?: string;
  secondsLeft: number;
  onResend: () => void;
  isResending: boolean;
};

export const CODE_LENGTH = 6;

// Пробіли прибираємо, лишаємо тільки цифри (напр. вставка «123 456» → «123456»)
const sanitizeCode = (value: string) =>
  value.replace(/\D/g, "").slice(0, CODE_LENGTH);

// Поле 6-значного коду + «Didn't receive yet? Resend in 59 seconds / Resend Code»
const CodeField = ({
  value,
  onChange,
  error,
  secondsLeft,
  onResend,
  isResending,
}: Props) => {
  return (
    <div className={css.wrapper}>
      <TextField
        label="Verification Code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        value={value}
        onChange={(event) => onChange(sanitizeCode(event.target.value))}
        error={error}
      />

      <p className={css.resend} aria-live="polite">
        Didn&apos;t receive yet?{" "}
        {secondsLeft > 0 ? (
          <>
            Resend in{" "}
            <strong>
              {secondsLeft} {secondsLeft === 1 ? "second" : "seconds"}
            </strong>
          </>
        ) : (
          <button
            type="button"
            className={css.resendBtn}
            onClick={onResend}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </p>
    </div>
  );
};

export default CodeField;
