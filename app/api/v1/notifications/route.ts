import { NextRequest } from "next/server";
import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

// Сповіщення користувача, найновіші першими (?unread_only=&limit=&offset=)
export async function GET(request: NextRequest) {
  try {
    const response = await api.get("/notifications", {
      params: request.nextUrl.searchParams,
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
