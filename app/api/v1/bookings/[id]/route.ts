import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Одне бронювання для будь-якого учасника: власника, приєднаного
// користувача або гостя (за cookie guest_token); інакше 404
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.get(`/bookings/${encodeURIComponent(id)}`, {
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
