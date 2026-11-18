import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

// Розмови з асистентом: остання активність першою
export async function GET(request: Request) {
  try {
    const response = await api.get("/assistant/sessions", {
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

// Нова розмова («New chat», назву дасть перше повідомлення)
export async function POST(request: Request) {
  try {
    const response = await api.post("/assistant/sessions", null, {
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
