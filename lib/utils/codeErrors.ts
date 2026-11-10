import type { ApiError } from "@/types/api";

// Повідомлення для помилок 6-значного коду (verify-email і скидання пароля).
// Розгалужуємось за code, а не за message
export const getCodeErrorMessage = (apiError: ApiError | null) => {
  switch (apiError?.code) {
    case "CODE_INVALID":
      return "Incorrect code. After 5 wrong attempts the code stops working — please request a new one.";
    case "CODE_EXPIRED":
      return "The verification code has expired. Please request a new one.";
    case "USER_NOT_FOUND":
      return "We couldn't find an account with this email.";
    case "VALIDATION_ERROR":
      return "Please enter the 6-digit code from the email.";
    default:
      return apiError?.message ?? "Something went wrong. Please try again.";
  }
};
