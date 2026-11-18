import { proxyStream } from "@/app/api/_utils/proxyStream";

// Без цього Vercel обірве потік раніше; бекенд обмежує відповідь 240 с
export const maxDuration = 300;

type Context = {
  params: Promise<{ id: string }>;
};

// Питання асистенту { text } → відповідь потоком (thinking, chunk, action, done, error)
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  return proxyStream(
    request,
    `/assistant/sessions/${encodeURIComponent(id)}/messages`,
    await request.text(),
  );
}
