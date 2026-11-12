import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ code: string }>;
};

// Приєднатися до бронювання. Залогінений — під ім'ям профілю; гість —
// з { name }, і бекенд ставить cookie guest_token (toNextResponse передає її браузеру).
// Помилки: 400 GUEST_NAME_REQUIRED, 404 INVITE_NOT_FOUND, 409 INVITE_CLOSED / BOOKING_FULL
export async function POST(request: Request, { params }: Context) {
  try {
    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const response = await api.post(
      `/invites/${encodeURIComponent(code)}/join`,
      body,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
