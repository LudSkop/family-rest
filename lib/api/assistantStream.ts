// Відповідь асистента приходить потоком Server-Sent Events на POST,
// тому EventSource не підходить: читаємо fetch → response.body частинами
import { refreshSession } from "@/lib/api/clientApi";
import type { AssistantStreamEvent } from "@/types/assistant";

// Відмова до початку потоку: звичайний JSON { code, message, retry_after? }
export class AssistantRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    // Через скільки секунд можна знову (429)
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "AssistantRequestError";
  }
}

// Розбір SSE: блоки розділені порожнім рядком, у блоці рядки «event:» і «data:».
// Частина з мережі може обірватися посеред блоку чи навіть слова —
// незавершений хвіст лишається в буфері до наступної частини
export const createSseParser = (
  onEvent: (event: AssistantStreamEvent) => void,
) => {
  let buffer = "";
  // «\r» у самому кінці частини: це може бути половина «\r\n» — чекаємо наступну
  let pendingCR = false;

  const parseBlock = (block: string) => {
    let name = "message";
    const dataLines: string[] = [];

    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) name = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }

    if (dataLines.length === 0 && name === "message") return;
    const raw = dataLines.join("\n");
    const data = raw ? JSON.parse(raw) : {};
    onEvent({ event: name, data } as AssistantStreamEvent);
  };

  return {
    push(text: string) {
      let chunk = (pendingCR ? "\r" : "") + text;
      pendingCR = chunk.endsWith("\r");
      if (pendingCR) chunk = chunk.slice(0, -1);
      buffer += chunk.replace(/\r\n?/g, "\n");
      let index;
      while ((index = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (block.trim()) parseBlock(block);
      }
    },
    // Кінець потоку: останній блок міг прийти без порожнього рядка
    end() {
      if (buffer.trim()) parseBlock(buffer);
      buffer = "";
      pendingCR = false;
    },
  };
};

const readError = async (response: Response) => {
  let body: { code?: string; message?: string; retry_after?: number } = {};
  try {
    body = await response.json();
  } catch {
    // не JSON — лишаємо загальну помилку
  }
  const header = Number(response.headers.get("Retry-After"));
  return new AssistantRequestError(
    response.status,
    body.code ?? "SERVER_ERROR",
    body.message ?? "Something went wrong. Please try again.",
    body.retry_after ??
      (Number.isFinite(header) && header > 0 ? header : undefined),
  );
};

type StreamOptions = {
  body?: unknown;
  signal?: AbortSignal;
  onEvent: (event: AssistantStreamEvent) => void;
};

// POST на потоковий маршрут і читання подій до кінця.
// 401 → одне спільне оновлення сесії (як в axios clientApi) і один повтор
export const streamAssistant = async (
  path: string,
  { body, signal, onEvent }: StreamOptions,
) => {
  const send = () =>
    fetch(`/api/v1${path}`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

  let response = await send();
  if (response.status === 401 && (await refreshSession())) {
    response = await send();
  }

  if (!response.ok || !response.body) throw await readError(response);

  const parser = createSseParser(onEvent);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
    parser.push(decoder.decode());
    parser.end();
  } finally {
    reader.releaseLock();
  }
};

// Панель закрили чи перемкнули розмову — це не помилка
export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";
