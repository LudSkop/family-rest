import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Усе, що поточний учасник уже відправив (частини від найстаріших)
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.get(
      `/bookings/${encodeURIComponent(id)}/my-pre-order`,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
