import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string; actionId: string }>;
};

// Картка підтвердження в її поточному статусі
export async function GET(request: Request, { params }: Context) {
  try {
    const { id, actionId } = await params;
    const response = await api.get(
      `/assistant/sessions/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
