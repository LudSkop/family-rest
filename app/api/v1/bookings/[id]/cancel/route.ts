import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Скасувати власне бронювання. 409 BOOKING_ALREADY_CANCELLED / CANCELLATION_CLOSED
export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.post(
      `/bookings/${encodeURIComponent(id)}/cancel`,
      null,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
