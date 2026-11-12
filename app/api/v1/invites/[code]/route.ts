import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

type Context = {
  params: Promise<{ code: string }>;
};

// Попередній перегляд запрошення; 404 INVITE_NOT_FOUND, 409 INVITE_CLOSED
export async function GET(_request: Request, { params }: Context) {
  try {
    const { code } = await params;
    const response = await api.get(`/invites/${encodeURIComponent(code)}`);
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
