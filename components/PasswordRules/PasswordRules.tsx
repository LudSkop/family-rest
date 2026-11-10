import css from "./PasswordRules.module.css";
import { getStrength, PASSWORD_RULES } from "@/lib/utils/password";

// «● Strong / Medium / Weak» праворуч від лейбла поля пароля
export const PasswordStrength = ({ value }: { value: string }) => {
  if (!value) return null;

  const { label, level } = getStrength(value);

  return (
    <span className={`${css.strength} ${css[level]}`} aria-live="polite">
      {label}
    </span>
  );
};

type Props = {
  id: string;
  value: string;
  showErrors: boolean;
};

// Список правил під полем пароля
const PasswordRules = ({ id, value, showErrors }: Props) => {
  return (
    <ul id={id} className={css.rules}>
      {PASSWORD_RULES.map((rule) => {
        // Виконане правило — зелене; після невдалої спроби невиконане — червоне
        const isMet = rule.test(value);
        const isBroken = showErrors && !isMet;
        const ruleClass = isMet
          ? css.ruleMet
          : isBroken
            ? css.ruleError
            : undefined;
        return (
          <li key={rule.label} className={ruleClass}>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordRules;
