import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

// Бронювання користувача (свої й ті, до яких приєднався)
export async function GET(request: Request) {
  try {
    const response = await api.get("/bookings", {
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

// Забронювати стіл: { table_id, starts_at, party_size }; потрібен вхід
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await api.post("/bookings", body, {
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
