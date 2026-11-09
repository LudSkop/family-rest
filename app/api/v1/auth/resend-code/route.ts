import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // status 202 = новий код надіслано — передаємо його клієнту як є
    const response = await api.post("/auth/resend-code", body);
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
