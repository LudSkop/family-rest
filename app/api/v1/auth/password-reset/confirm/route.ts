import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 204 — пароль змінено, усі сесії завершено (автовходу немає)
    const response = await api.post("/auth/password-reset/confirm", body);
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
