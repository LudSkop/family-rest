"use client";

import css from "./PasswordField.module.css";
import { useState } from "react";
import TextField from "@/components/TextField/TextField";

type Props = Omit<React.ComponentProps<typeof TextField>, "type" | "endAdornment">;

// Поле пароля з кнопкою «показати / сховати» (око з'являється, коли є текст)
const PasswordField = (props: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={isVisible ? "text" : "password"}
      endAdornment={
        props.value ? (
          <button
            type="button"
            className={css.eyeBtn}
            aria-label={isVisible ? "Hide password" : "Show password"}
            onClick={() => setIsVisible((prev) => !prev)}
          >
            {isVisible ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              // Закрите око з віями — пароль приховано
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10c2.4 3 5.4 4.5 9 4.5s6.6-1.5 9-4.5" />
                <path d="M12 14.5V17M7 13.3 5.8 15.5M17 13.3l1.2 2.2M3.6 11 2 12.8M20.4 11l1.6 1.8" />
              </svg>
            )}
          </button>
        ) : null
      }
    />
  );
};

export default PasswordField;
