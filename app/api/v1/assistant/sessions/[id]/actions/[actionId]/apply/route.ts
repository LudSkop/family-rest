import { proxyStream } from "@/app/api/_utils/proxyStream";

// Без цього Vercel обірве потік раніше; бекенд обмежує відповідь 240 с
export const maxDuration = 300;

type Context = {
  params: Promise<{ id: string; actionId: string }>;
};

// Застосувати картку (напр. забронювати стіл) → потік: action, потім коментар асистента
export async function POST(request: Request, { params }: Context) {
  const { id, actionId } = await params;
  return proxyStream(
    request,
    `/assistant/sessions/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}/apply`,
  );
}
