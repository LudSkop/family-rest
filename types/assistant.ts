// Чат з AI-асистентом (/assistant/*). Контракт: assistant-frontend-task.md бекенда

export interface AssistantSession {
  id: string;
  // «New chat», доки немає першого повідомлення; потім — перше питання (до 60 символів)
  title: string;
  created_at: string;
  // Змінюється з кожним повідомленням: за ним сортуємо історію
  updated_at: string;
}

export type AssistantRole = "USER" | "ASSISTANT";

export type AssistantActionStatus =
  "PENDING" | "APPLIED" | "CANCELLED" | "EXPIRED" | "FAILED";

// Картка підтвердження: асистент сам нічого не змінює, лише пропонує
export interface AssistantAction {
  id: string;
  // Поки лише "booking.create"; вигляд однаковий для всіх — з card
  kind: string;
  status: AssistantActionStatus;
  created_at: string;
  expires_at: string;
  card: {
    title: string;
    fields: { label: string; value: string }[];
    notice: string | null;
    confirm_label: string;
  };
  // Після APPLIED: { booking_id, status: "CONFIRMED" | "PENDING" }
  result: { booking_id?: string; status?: string } | null;
  // Після FAILED
  error: { code: string; message: string } | null;
}

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  // Звичайний текст без markdown — показуємо з переносами рядків
  text: string;
  created_at: string;
  action: AssistantAction | null;
}

export interface AssistantSessionDetail extends AssistantSession {
  messages: AssistantMessage[];
}

// Події потоку відповіді
export type AssistantStreamEvent =
  | { event: "thinking" }
  | { event: "chunk"; data: { text: string } }
  | { event: "action"; data: AssistantAction }
  | {
      event: "done";
      data: { message_id: string | null; created_at: string | null };
    }
  | { event: "error"; data: { code: string; message: string } };
