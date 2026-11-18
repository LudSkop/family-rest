import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Одна розмова з повідомленнями (від найстаріших) і їхніми картками
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.get(
      `/assistant/sessions/${encodeURIComponent(id)}`,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
