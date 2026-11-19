import { describe, it, expect } from "vitest";
import { getStrength, isPasswordValid } from "./password";

// Правила з Figma: 8–16 символів, велика й мала літера, цифра, символ
describe("isPasswordValid", () => {
  it("приймає пароль, що відповідає всім правилам", () => {
    expect(isPasswordValid("Hello123!")).toBe(true);
  });

  it("відхиляє порожній пароль", () => {
    expect(isPasswordValid("")).toBe(false);
  });

  it("відхиляє занадто короткий пароль", () => {
    expect(isPasswordValid("He1!")).toBe(false);
  });

  // Межі: рівно 8 і рівно 16 — ще можна, 17 — вже ні
  it("приймає рівно 8 символів", () => {
    expect(isPasswordValid("Hello12!")).toBe(true);
  });

  it("приймає рівно 16 символів", () => {
    expect(isPasswordValid("Hello123!Hello12")).toBe(true);
  });

  it("відхиляє 17 символів", () => {
    expect(isPasswordValid("Hello123!Hello123")).toBe(false);
  });

  it("відхиляє пароль без великої літери", () => {
    expect(isPasswordValid("hello123!")).toBe(false);
  });

  it("відхиляє пароль без малої літери", () => {
    expect(isPasswordValid("HELLO123!")).toBe(false);
  });

  it("відхиляє пароль без цифри", () => {
    expect(isPasswordValid("HelloWorld!")).toBe(false);
  });

  it("відхиляє пароль без символу", () => {
    expect(isPasswordValid("Hello1234")).toBe(false);
  });

  it("не вважає пробіл символом", () => {
    expect(isPasswordValid("Hello 1234")).toBe(false);
  });
});

describe("getStrength", () => {
  it("Weak — коли виконано мало вимог", () => {
    expect(getStrength("abc")).toEqual({ label: "Weak", level: "weak" });
  });

  it("Medium — коли виконано 3–4 вимоги", () => {
    // довжина + мала літера + цифра = 3
    expect(getStrength("abcdefgh1")).toEqual({
      label: "Medium",
      level: "medium",
    });
  });

  it("Strong — коли виконано всі 5", () => {
    expect(getStrength("Hello123!")).toEqual({
      label: "Strong",
      level: "strong",
    });
  });

  it("не Strong, якщо пароль задовгий, навіть з усіма видами символів", () => {
    expect(getStrength("Hello123!Hello123!").level).toBe("medium");
  });
});
