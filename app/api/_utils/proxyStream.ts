import { cookieHeaders } from "@/app/api/_utils/cookieHeaders";

// Потокова відповідь бекенда (Server-Sent Events) → браузеру без буферизації.
// axios тут не підходить: він чекає всю відповідь. Тому fetch і upstream.body як є
export const proxyStream = async (
  request: Request,
  path: string,
  body?: string,
) => {
  try {
    const headers = new Headers({ Accept: "text/event-stream" });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    const { Cookie } = cookieHeaders(request);
    if (Cookie) headers.set("Cookie", Cookie);

    const upstream = await fetch(`${process.env.API_URL}${path}`, {
      method: "POST",
      headers,
      body,
      // Браузер закрив панель чату → зупиняємо й запит до бекенда
      signal: request.signal,
    });

    // Відмова (401, 404, 422, 429, 503…) приходить звичайним JSON до потоку
    if (!upstream.ok || !upstream.body) {
      const errorHeaders = new Headers({ "Content-Type": "application/json" });
      const retryAfter = upstream.headers.get("Retry-After");
      if (retryAfter) errorHeaders.set("Retry-After", retryAfter);
      return new Response(await upstream.text(), {
        status: upstream.status,
        headers: errorHeaders,
      });
    }

    // 200: віддаємо потік як є, нічого не читаючи
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return Response.json(
      { code: "SERVER_ERROR", message: "Something went wrong" },
      { status: 500 },
    );
  }
};
