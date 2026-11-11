import { NextRequest } from "next/server";
import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

// Пошук вільних столів: date, party_size, location_id, time, limit, offset.
// Вхід не потрібен
export async function GET(request: NextRequest) {
  try {
    const response = await api.get("/bookings/tables", {
      params: request.nextUrl.searchParams,
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
