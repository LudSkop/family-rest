import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string }>;
};

// Відправити кошик у групове передзамовлення. Частина фінальна, кошик стає порожнім.
// 409 PREORDER_CLOSED / CART_EMPTY / DISH_UNAVAILABLE
export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.post(
      `/bookings/${encodeURIComponent(id)}/cart/submit`,
      null,
      { headers: cookieHeaders(request) },
    );
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
