import { NextRequest } from "next/server";
import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

// Передаємо параметри як є: sort, category, limit, offset
export async function GET(request: NextRequest) {
  try {
    const response = await api.get("/menu/dishes", {
      params: request.nextUrl.searchParams,
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
