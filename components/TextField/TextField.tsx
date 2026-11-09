import css from "./TextField.module.css";
import { useId } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  endAdornment?: React.ReactNode;
  labelExtra?: React.ReactNode;
};

const TextField = ({
  label,
  error,
  endAdornment,
  labelExtra,
  "aria-describedby": describedBy,
  ...inputProps
}: Props) => {
  const id = useId();
  const errorId = `${id}-error`;

  // Поле може описуватись і текстом помилки, і підказкою ззовні (напр. правила пароля)
  const ariaDescribedBy =
    [error ? errorId : null, describedBy].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={css.field}>
      <div className={css.labelRow}>
        <label htmlFor={id} className={css.label}>
          {label}
        </label>
        {labelExtra}
      </div>

      <div className={css.inputWrapper}>
        <input
          id={id}
          className={`${css.input} ${error ? css.inputError : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          {...inputProps}
        />
        {endAdornment && <div className={css.adornment}>{endAdornment}</div>}
      </div>

      {error && (
        <p id={errorId} className={css.error}>
          {error}
        </p>
      )}
    </div>
  );
};

export default TextField;
