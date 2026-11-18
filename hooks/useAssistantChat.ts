"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/Toast/ToastProvider";
import {
  cancelAssistantAction,
  createAssistantSession,
  getApiError,
  getApiStatus,
  getAssistantAction,
  getAssistantSession,
  getAssistantSessions,
} from "@/lib/api/clientApi";
import {
  AssistantRequestError,
  isAbortError,
  streamAssistant,
} from "@/lib/api/assistantStream";
import type {
  AssistantAction,
  AssistantMessage,
  AssistantStreamEvent,
} from "@/types/assistant";

// Повідомлення на екрані: збережене на бекенді або ще в дорозі
export interface ChatMessage extends Omit<AssistantMessage, "id"> {
  key: string;
  // null — відповідь ще не збережена (іде потік або не вдалася)
  id: string | null;
  state: "done" | "streaming" | "failed" | "stopped";
  // Питання, на яке відповідали, — для «Ask again»
  question?: string;
}

// Повідомлення над полем вводу
export type ChatNotice =
  | { kind: "limit"; until: number | null }
  | { kind: "unavailable" }
  | { kind: "signin" }
  | { kind: "error"; text: string };

type State = {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoadingSession: boolean;
  isThinking: boolean;
};

type Action =
  | { type: "loading" }
  | { type: "load"; sessionId: string | null; messages: ChatMessage[] }
  | { type: "session"; sessionId: string }
  | { type: "add"; message: ChatMessage }
  | { type: "remove"; keys: string[] }
  | { type: "thinking"; value: boolean }
  | { type: "patch"; key: string; patch: Partial<ChatMessage> }
  | { type: "append"; key: string; text: string }
  | { type: "card"; card: AssistantAction };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "loading":
      return { ...state, isLoadingSession: true };
    case "load":
      return {
        sessionId: action.sessionId,
        messages: action.messages,
        isLoadingSession: false,
        isThinking: false,
      };
    case "session":
      return { ...state, sessionId: action.sessionId };
    case "add":
      return { ...state, messages: [...state.messages, action.message] };
    case "remove":
      return {
        ...state,
        messages: state.messages.filter((m) => !action.keys.includes(m.key)),
      };
    case "thinking":
      return { ...state, isThinking: action.value };
    case "patch":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.key === action.key ? { ...m, ...action.patch } : m,
        ),
      };
    case "append":
      return {
        ...state,
        isThinking: false,
        messages: state.messages.map((m) =>
          m.key === action.key ? { ...m, text: m.text + action.text } : m,
        ),
      };
    case "card": {
      const card = action.card;
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (!m.action) return m;
          if (m.action.id === card.id) return { ...m, action: card };
          // У розмові лише одна активна картка: нова скасовує попередню
          if (card.status === "PENDING" && m.action.status === "PENDING") {
            return { ...m, action: { ...m.action, status: "CANCELLED" } };
          }
          return m;
        }),
      };
    }
  }
};

const fromServer = (message: AssistantMessage): ChatMessage => ({
  ...message,
  key: message.id,
  state: "done",
});

let localKey = 0;
const nextKey = () => `local-${++localKey}`;

const sessionPath = (sessionId: string) =>
  `/assistant/sessions/${encodeURIComponent(sessionId)}`;

// Помилка до потоку (з axios або зі streamAssistant) → один формат
const describeError = (error: unknown) => {
  if (error instanceof AssistantRequestError) return error;
  const apiError = getApiError(error);
  return new AssistantRequestError(
    getApiStatus(error) ?? 0,
    apiError?.code ?? "SERVER_ERROR",
    apiError?.message ?? "Something went wrong. Please try again.",
    apiError?.retry_after,
  );
};

export const SESSIONS_KEY = ["assistant", "sessions"];

// Уся логіка чату: розмови, надсилання з потоком, картки підтвердження
export const useAssistantChat = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [state, dispatch] = useReducer(reducer, {
    sessionId: null,
    messages: [],
    isLoadingSession: true,
    isThinking: false,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<ChatNotice | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  // Поточний потік: зупиняємо при закритті панелі чи зміні розмови
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    sessionIdRef.current = state.sessionId;
  }, [state.sessionId]);

  const sessions = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: getAssistantSessions,
    retry: false,
    staleTime: 0,
  });

  // Помилки доступу: показуємо повідомлення над полем вводу
  const showFailure = useCallback((failure: AssistantRequestError) => {
    if (failure.status === 429) {
      setNotice({
        kind: "limit",
        until: failure.retryAfter
          ? Date.now() + failure.retryAfter * 1000
          : null,
      });
    } else if (failure.status === 503) {
      setNotice({ kind: "unavailable" });
    } else if (failure.status === 401 || failure.status === 403) {
      setNotice({ kind: "signin" });
    } else {
      setNotice({ kind: "error", text: failure.message });
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // Закрили панель — зупиняємо потік (без помилки)
  useEffect(() => stop, [stop]);

  const openSession = useCallback(
    async (sessionId: string | null) => {
      stop();
      setNotice(null);
      setInputError(null);
      sessionIdRef.current = sessionId;

      if (!sessionId) {
        dispatch({ type: "load", sessionId: null, messages: [] });
        return;
      }

      dispatch({ type: "loading" });
      try {
        const detail = await getAssistantSession(sessionId);
        dispatch({
          type: "load",
          sessionId,
          messages: detail.messages.map(fromServer),
        });
      } catch (error) {
        const failure = describeError(error);
        sessionIdRef.current = null;
        dispatch({ type: "load", sessionId: null, messages: [] });
        // Розмову видалили (7 днів без повідомлень) — просто нова
        if (failure.status !== 404) showFailure(failure);
        queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      }
    },
    [queryClient, showFailure, stop],
  );

  // Відкрили панель: остання розмова або порожній «New chat»
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const list = await queryClient.fetchQuery({
          queryKey: SESSIONS_KEY,
          queryFn: getAssistantSessions,
          staleTime: 0,
        });
        if (active) await openSession(list[0]?.id ?? null);
      } catch (error) {
        if (!active) return;
        dispatch({ type: "load", sessionId: null, messages: [] });
        showFailure(describeError(error));
      }
    };
    init();

    return () => {
      active = false;
    };
  }, [openSession, queryClient, showFailure]);

  const addReply = useCallback((question?: string) => {
    const key = nextKey();
    dispatch({
      type: "add",
      message: {
        key,
        id: null,
        role: "ASSISTANT",
        text: "",
        created_at: new Date().toISOString(),
        action: null,
        state: "streaming",
        question,
      },
    });
    return key;
  }, []);

  // Читаємо один потік: відповідь асистента з'являється з першою подією
  const runStream = useCallback(
    async ({
      path,
      body,
      question,
      onCard,
    }: {
      path: string;
      body?: unknown;
      question?: string;
      onCard?: (card: AssistantAction) => void;
    }) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      let replyKey: string | null = null;
      const reply = () => (replyKey ??= addReply(question));

      const onEvent = (event: AssistantStreamEvent) => {
        switch (event.event) {
          case "thinking":
            reply();
            dispatch({ type: "thinking", value: true });
            break;
          case "chunk":
            dispatch({ type: "append", key: reply(), text: event.data.text });
            break;
          case "action":
            // У відповіді на питання картка йде під цю відповідь;
            // при apply — оновлюємо картку, яка вже є
            if (replyKey) {
              dispatch({
                type: "patch",
                key: replyKey,
                patch: { action: event.data },
              });
            }
            dispatch({ type: "card", card: event.data });
            onCard?.(event.data);
            break;
          case "done":
            dispatch({ type: "thinking", value: false });
            if (replyKey) {
              dispatch({
                type: "patch",
                key: replyKey,
                patch: {
                  id: event.data.message_id,
                  state: "done",
                  ...(event.data.created_at && {
                    created_at: event.data.created_at,
                  }),
                },
              });
            }
            break;
          case "error":
            dispatch({ type: "thinking", value: false });
            dispatch({
              type: "patch",
              key: reply(),
              patch: { state: "failed" },
            });
            break;
        }
      };

      try {
        await streamAssistant(path, {
          body,
          signal: controller.signal,
          onEvent,
        });
      } catch (error) {
        // Зупинили: лишаємо те, що встигло прийти
        if (isAbortError(error) && replyKey) {
          dispatch({
            type: "patch",
            key: replyKey,
            patch: { state: "stopped" },
          });
        }
        throw Object.assign(error as object, { replyKey });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
        dispatch({ type: "thinking", value: false });
      }
    },
    [addReply],
  );

  // Надіслати питання. false — не відправлено (текст лишається в полі)
  const send = useCallback(
    async (rawText: string): Promise<boolean> => {
      const text = rawText.trim();
      if (!text || isStreaming || applyingId) return false;
      setInputError(null);
      setNotice(null);

      // Нову розмову створюємо лише з першим питанням — без порожніх
      let sessionId = sessionIdRef.current;
      try {
        if (!sessionId) {
          sessionId = (await createAssistantSession()).id;
          sessionIdRef.current = sessionId;
          dispatch({ type: "session", sessionId });
        }
      } catch (error) {
        showFailure(describeError(error));
        return false;
      }

      const questionKey = nextKey();
      dispatch({
        type: "add",
        message: {
          key: questionKey,
          id: null,
          role: "USER",
          text,
          created_at: new Date().toISOString(),
          action: null,
          state: "done",
        },
      });

      const ask = (id: string) =>
        runStream({
          path: `${sessionPath(id)}/messages`,
          body: { text },
          question: text,
        });

      try {
        try {
          await ask(sessionId);
        } catch (error) {
          // Розмову видалили на сервері — нова розмова і ще одна спроба
          if (
            error instanceof AssistantRequestError &&
            error.code === "ASSISTANT_SESSION_NOT_FOUND"
          ) {
            sessionId = (await createAssistantSession()).id;
            sessionIdRef.current = sessionId;
            dispatch({ type: "session", sessionId });
            await ask(sessionId);
          } else {
            throw error;
          }
        }
        return true;
      } catch (error) {
        if (isAbortError(error)) return true;

        // Відмова до потоку: питання не відправлене — прибираємо його
        const { replyKey } = error as { replyKey?: string | null };
        dispatch({
          type: "remove",
          keys: [questionKey, ...(replyKey ? [replyKey] : [])],
        });
        const failure = describeError(error);
        if (failure.code === "VALIDATION_ERROR") setInputError(failure.message);
        else showFailure(failure);
        return false;
      } finally {
        // Назва й час розмови змінились
        queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      }
    },
    [applyingId, isStreaming, queryClient, runStream, showFailure],
  );

  // Перечитати картку з бекенда (після 409)
  const refreshCard = useCallback(
    async (actionId: string) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      try {
        dispatch({
          type: "card",
          card: await getAssistantAction(sessionId, actionId),
        });
      } catch {
        openSession(sessionId);
      }
    },
    [openSession],
  );

  const handleCardError = useCallback(
    async (error: unknown, actionId: string) => {
      const failure = describeError(error);
      if (failure.code === "ASSISTANT_ACTION_NOT_PENDING") {
        await refreshCard(actionId);
      } else if (
        failure.code === "ASSISTANT_ACTION_NOT_FOUND" ||
        failure.code === "VALIDATION_ERROR"
      ) {
        await openSession(sessionIdRef.current);
      } else {
        showFailure(failure);
      }
    },
    [openSession, refreshCard, showFailure],
  );

  // «Book»: бронювання створюється лише тут, після натискання
  const apply = useCallback(
    async (card: AssistantAction) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || applyingId || isStreaming) return;
      setApplyingId(card.id);
      setNotice(null);

      try {
        await runStream({
          path: `${sessionPath(sessionId)}/actions/${encodeURIComponent(card.id)}/apply`,
          onCard: (outcome) => {
            if (outcome.status !== "APPLIED") return;
            // Нове бронювання — оновлюємо Reservations
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            showToast(
              "",
              "success",
              outcome.result?.status === "PENDING"
                ? "Request Sent!"
                : "Table Booked!",
            );
          },
        });
      } catch (error) {
        if (!isAbortError(error)) await handleCardError(error, card.id);
      } finally {
        setApplyingId(null);
      }
    },
    [
      applyingId,
      handleCardError,
      isStreaming,
      queryClient,
      runStream,
      showToast,
    ],
  );

  const cancel = useCallback(
    async (card: AssistantAction) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || applyingId) return;
      setApplyingId(card.id);
      try {
        dispatch({
          type: "card",
          card: await cancelAssistantAction(sessionId, card.id),
        });
      } catch (error) {
        await handleCardError(error, card.id);
      } finally {
        setApplyingId(null);
      }
    },
    [applyingId, handleCardError],
  );

  return {
    sessions: sessions.data ?? [],
    sessionId: state.sessionId,
    messages: state.messages,
    isLoadingSession: state.isLoadingSession,
    isThinking: state.isThinking,
    isStreaming,
    applyingId,
    notice,
    inputError,
    clearInputError: () => setInputError(null),
    send,
    stop,
    apply,
    cancel,
    openSession,
  };
};
