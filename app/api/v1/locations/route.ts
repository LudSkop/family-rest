import { api } from "@/app/api/api";
import { handleError } from "@/app/api/_utils/handleError";
import { toNextResponse } from "@/app/api/_utils/toNextResponse";

// Усі локації одним списком (без пагінації), від найстаріших
export async function GET() {
  try {
    const response = await api.get("/locations");
    return toNextResponse(response);
  } catch (error) {
    return handleError(error);
  }
}
