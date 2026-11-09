import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 201 — акаунт створено, бекенд надіслав 6-значний код на email
    const response = await api.post("/auth/register", body);
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
