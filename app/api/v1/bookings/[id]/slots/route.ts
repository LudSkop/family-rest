import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Сітка дня для редагування: на які часи можна перенести бронювання
// при тривалості ?duration_minutes=
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const response = await api.get(
      `/bookings/${encodeURIComponent(id)}/slots`,
      {
        params: { duration_minutes: searchParams.get("duration_minutes") },
        headers: cookieHeaders(request),
      },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
