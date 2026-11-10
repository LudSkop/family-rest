import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 204 — код вірний (не витрачається); 400 CODE_INVALID / CODE_EXPIRED; 404
    const response = await api.post("/auth/password-reset/verify-code", body);
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
