import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Код запрошення для посилання /join/<code> (лише власнику бронювання)
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.get(
      `/bookings/${encodeURIComponent(id)}/invite`,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
