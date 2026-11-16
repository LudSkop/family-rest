import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Відхилити запит: учасники отримують сповіщення й лист. 409 REQUEST_NOT_PENDING
export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.post(
      `/staff/booking-requests/${encodeURIComponent(id)}/reject`,
      null,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
