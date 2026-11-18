import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string; actionId: string }>;
};

// Відхилити картку: нічого не змінюється, статус CANCELLED
export async function POST(request: Request, { params }: Context) {
  try {
    const { id, actionId } = await params;
    const response = await api.post(
      `/assistant/sessions/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}/cancel`,
      null,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
