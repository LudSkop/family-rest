// Правила пароля з Figma перевіряє лише фронт (бекенд — тільки 8–128 символів)
export const PASSWORD_RULES = [
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

export const isPasswordValid = (value: string) =>
  PASSWORD_RULES.every((rule) => rule.test(value));

// Надійність: скільки з 5 вимог виконано (довжина, A-Z, a-z, цифра, символ)
export const getStrength = (value: string) => {
  const checks = [
    value.length >= 8 && value.length <= 16,
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9\s]/.test(value),
  ];
  const score = checks.filter(Boolean).length;

  if (score === checks.length) return { label: "Strong", level: "strong" } as const;
  if (score >= 3) return { label: "Medium", level: "medium" } as const;
  return { label: "Weak", level: "weak" } as const;
};
