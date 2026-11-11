import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

type Context = {
  params: Promise<{ id: string }>;
};

// Одна страва з описом і поживністю; 404 DISH_NOT_FOUND, якщо такої немає
export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const response = await api.get(`/menu/dishes/${encodeURIComponent(id)}`);
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
