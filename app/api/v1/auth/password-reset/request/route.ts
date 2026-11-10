import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 202 — код надіслано; 404 USER_NOT_FOUND; 429 RESEND_TOO_SOON з retry_after
    const response = await api.post("/auth/password-reset/request", body);
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
