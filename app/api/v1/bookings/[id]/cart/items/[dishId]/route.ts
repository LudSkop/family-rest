import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";
import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

type Context = {
  params: Promise<{ id: string; dishId: string }>;
};

const itemPath = async ({ params }: Context) => {
  const { id, dishId } = await params;
  return `/bookings/${encodeURIComponent(id)}/cart/items/${encodeURIComponent(dishId)}`;
};

// Встановити кількість і коментар страви: { quantity, note }.
// 409 PREORDER_CLOSED / DISH_UNAVAILABLE, 400 QUANTITY_TOO_LARGE
export async function PUT(request: Request, context: Context) {
  try {
    const body = await request.json();
    const response = await api.put(await itemPath(context), body, {
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

// Прибрати страву з кошика
export async function DELETE(request: Request, context: Context) {
  try {
    const response = await api.delete(await itemPath(context), {
      headers: cookieHeaders(request),
    });
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
