"use client";

import css from "./AssistantPanel.module.css";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Modal from "@/components/Modal/Modal";
import ActionCard from "./ActionCard";
import { useAssistantChat, type ChatNotice } from "@/hooks/useAssistantChat";
import type { User } from "@/types/user";
import type { AssistantSession } from "@/types/assistant";

type Props = {
  user: User;
  onClose: () => void;
};

const MAX_LENGTH = 2000;
const COUNTER_FROM = 1800;

const SUGGESTIONS = [
  "What desserts do you have?",
  "Is there a table for four on Friday at 19:00?",
  "What are my bookings?",
  "Which location is open late?",
];

export const AssistantIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.55L3.5 21l1.45-4.6A8.5 8.5 0 1 1 20.5 12Z" />
    <path d="m12 7.5 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
  </svg>
);

// Паросток із логотипа Family Rest — «обличчя» асистента
const SproutIcon = () => (
  <svg viewBox="1 2 28 32" aria-hidden="true">
    <path
      d="M14 33V18"
      stroke="#0f7a37"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M14 21C6 21 2.5 15 3 7.5C10 7.5 14.5 13 14 21Z" fill="#0f7a37" />
    <path
      d="M14 18C14.5 9.5 20 4 27.5 4.5C27.5 12.5 22 18 14 18Z"
      fill="#3a9d5d"
    />
    <path
      d="M5.5 10C8.5 13 11.5 16.5 14 21"
      stroke="#ffffff"
      strokeWidth="0.8"
      strokeLinecap="round"
    />
    <path
      d="M25 7C21.5 10 18 13.5 14 18"
      stroke="#ffffff"
      strokeWidth="0.8"
      strokeLinecap="round"
    />
  </svg>
);

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const noticeText = (notice: ChatNotice) => {
  switch (notice.kind) {
    case "limit":
      return notice.until
        ? `The assistant is taking a short break. Chat is back at ${timeFormat.format(notice.until)}.`
        : "The assistant is taking a short break. Please try again later.";
    case "unavailable":
      return "The assistant is unavailable right now. Please try again later.";
    case "signin":
      return "Your session has expired. Please sign in again.";
    case "error":
      return notice.text;
  }
};

// Історія розмов: сьогоднішні окремо
const groupSessions = (sessions: AssistantSession[]) => {
  const today = new Date().toDateString();
  const todayList = sessions.filter(
    (session) => new Date(session.updated_at).toDateString() === today,
  );
  const earlier = sessions.filter((session) => !todayList.includes(session));
  return [
    { label: "Today", items: todayList },
    { label: "Earlier", items: earlier },
  ].filter((group) => group.items.length > 0);
};

// Користувач не підтвердив email — чат недоступний
const VerifyEmailState = ({ user }: { user: User }) => (
  <div className={css.state}>
    <span className={css.welcomeAvatar} aria-hidden="true">
      <SproutIcon />
    </span>
    <h3 className={css.stateTitle}>Verify your email to chat</h3>
    <p className={css.stateText}>
      The assistant is available to guests with a verified email.
    </p>
    <Link
      href={`/verify-email?email=${encodeURIComponent(user.email)}`}
      className={css.primary}
    >
      Verify Email
    </Link>
  </div>
);

const Chat = ({ user }: { user: User }) => {
  const chat = useAssistantChat();
  const [text, setText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Людина прокрутила вгору — не тягнемо вниз під час відповіді
  const stickToBottom = useRef(true);

  const isBusy = chat.isStreaming || chat.applyingId !== null;
  const lastMessage = chat.messages.at(-1);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body && stickToBottom.current) body.scrollTop = body.scrollHeight;
  }, [chat.messages, chat.isThinking, chat.notice]);

  // Курсор у поле вводу. Через кадр: <dialog> при відкритті сам ставить фокус на ×
  useEffect(() => {
    if (showHistory) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showHistory, chat.sessionId]);

  const resize = () => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  };

  const submit = async (value = text) => {
    if (!value.trim() || isBusy) return;
    stickToBottom.current = true;
    const typed = text;
    setText("");
    requestAnimationFrame(resize);
    const sent = await chat.send(value);
    // Не відправилось (ліміт, помилка) — повертаємо текст у поле
    if (!sent && value === typed) {
      setText(typed);
      requestAnimationFrame(resize);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  };

  const newChat = () => {
    setShowHistory(false);
    chat.openSession(null);
  };

  const firstName = user.first_name.trim();

  return (
    <>
      <div className={css.header}>
        <span className={css.avatar} aria-hidden="true">
          <SproutIcon />
        </span>
        <div className={css.headerText}>
          <h2 id="assistant-title" className={css.title}>
            <span className={css.titleBrand}>Family Rest </span>Assistant
          </h2>
          <p className={css.subtitle}>Menu, tables &amp; reservations</p>
        </div>
        <button
          type="button"
          className={css.iconBtn}
          aria-label={showHistory ? "Back to chat" : "Chat history"}
          aria-pressed={showHistory}
          onClick={() => setShowHistory((prev) => !prev)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v3.5h3.5M12 8v4l2.5 2" />
          </svg>
        </button>
        <button
          type="button"
          className={css.iconBtn}
          aria-label="New chat"
          onClick={newChat}
          disabled={chat.isStreaming}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {showHistory ? (
        <div className={css.body}>
          {chat.sessions.length === 0 ? (
            <p className={css.muted}>No conversations yet.</p>
          ) : (
            groupSessions(chat.sessions).map((group) => (
              <section key={group.label} className={css.historyGroup}>
                <h3 className={css.historyLabel}>{group.label}</h3>
                <ul className={css.historyList}>
                  {group.items.map((session) => (
                    <li key={session.id}>
                      <button
                        type="button"
                        className={css.historyItem}
                        aria-current={
                          session.id === chat.sessionId ? "true" : undefined
                        }
                        onClick={() => {
                          setShowHistory(false);
                          chat.openSession(session.id);
                        }}
                      >
                        {session.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      ) : (
        <div
          ref={bodyRef}
          className={css.body}
          onScroll={(event) => {
            const body = event.currentTarget;
            stickToBottom.current =
              body.scrollHeight - body.scrollTop - body.clientHeight < 48;
          }}
        >
          {chat.isLoadingSession && (
            <p className={css.muted} role="status">
              Loading conversation...
            </p>
          )}

          {!chat.isLoadingSession && chat.messages.length === 0 && (
            <div className={css.welcome}>
              <span className={css.welcomeAvatar} aria-hidden="true">
                <SproutIcon />
              </span>
              <h3 className={css.welcomeTitle}>
                Hi{firstName ? `, ${firstName}` : ""}! How can I help?
              </h3>
              <p className={css.welcomeText}>
                Ask about the menu, free tables or your reservations. I can also
                book a table for you.
              </p>
              <ul className={css.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      className={css.suggestion}
                      onClick={() => submit(suggestion)}
                      disabled={isBusy}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!chat.isLoadingSession && chat.messages.length > 0 && (
            <ol className={css.messages} aria-live="polite">
              {chat.messages.map((message) => {
                const isUser = message.role === "USER";
                const isTyping =
                  message.state === "streaming" &&
                  (message.text === "" ||
                    (chat.isThinking && message === lastMessage));

                return (
                  <li
                    key={message.key}
                    className={isUser ? css.userRow : css.assistantRow}
                  >
                    {!isUser && (
                      <span className={css.smallAvatar} aria-hidden="true">
                        <SproutIcon />
                      </span>
                    )}
                    <div className={css.messageColumn}>
                      {(message.text || isTyping) && (
                        <div
                          className={`${css.bubble} ${isUser ? css.userBubble : css.assistantBubble} ${message.state === "failed" ? css.failedBubble : ""}`}
                        >
                          {message.text && (
                            <p className={css.bubbleText}>{message.text}</p>
                          )}
                          {isTyping && (
                            <span
                              className={css.typing}
                              role="status"
                              aria-label="The assistant is thinking"
                            >
                              <span />
                              <span />
                              <span />
                            </span>
                          )}
                        </div>
                      )}

                      {message.state === "failed" && (
                        <p className={css.failedNote}>
                          The answer didn&apos;t come through.{" "}
                          {message.question && (
                            <button
                              type="button"
                              className={css.inlineLink}
                              onClick={() => submit(message.question)}
                              disabled={isBusy}
                            >
                              Ask again
                            </button>
                          )}
                        </p>
                      )}

                      {message.state === "stopped" && (
                        <p className={css.stoppedNote}>Stopped</p>
                      )}

                      {message.action && (
                        <ActionCard
                          action={message.action}
                          busyId={chat.applyingId}
                          isLocked={chat.isStreaming}
                          onApply={chat.apply}
                          onCancel={chat.cancel}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      <div className={css.footer}>
        {chat.notice && (
          <p
            className={`${css.notice} ${chat.notice.kind === "limit" ? css.noticeLimit : ""}`}
            role="alert"
          >
            {noticeText(chat.notice)}
            {chat.notice.kind === "signin" && (
              <>
                {" "}
                <Link
                  href="?auth=sign-in"
                  scroll={false}
                  className={css.inlineLink}
                >
                  Sign In
                </Link>
              </>
            )}
          </p>
        )}

        <form
          className={css.composer}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label htmlFor="assistant-input" className="visually-hidden">
            Message the assistant
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            className={css.input}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder="Ask the assistant..."
            value={text}
            aria-invalid={Boolean(chat.inputError)}
            aria-describedby={
              chat.inputError ? "assistant-input-error" : undefined
            }
            onChange={(event) => {
              setText(event.target.value);
              chat.clearInputError();
              resize();
            }}
            onKeyDown={handleKeyDown}
          />
          {chat.isStreaming ? (
            <button
              type="button"
              className={css.sendBtn}
              aria-label="Stop answering"
              onClick={chat.stop}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="7" y="7" width="10" height="10" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              className={css.sendBtn}
              aria-label="Send"
              disabled={!text.trim() || isBusy}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          )}
        </form>

        {chat.inputError && (
          <p id="assistant-input-error" className={css.inputError}>
            {chat.inputError}
          </p>
        )}

        <p className={css.footnote}>
          {text.length >= COUNTER_FROM
            ? `${text.length} / ${MAX_LENGTH}`
            : "The assistant can make mistakes. Nothing is booked until you confirm."}
        </p>
      </div>
    </>
  );
};

// Панель чату праворуч (на мобільному — на весь екран)
const AssistantPanel = ({ user, onClose }: Props) => (
  <Modal onClose={onClose} labelledBy="assistant-title" className={css.panel}>
    {user.email_verified_at ? (
      <Chat user={user} />
    ) : (
      <>
        <div className={css.header}>
          <span className={css.avatar} aria-hidden="true">
            <SproutIcon />
          </span>
          <div className={css.headerText}>
            <h2 id="assistant-title" className={css.title}>
              <span className={css.titleBrand}>Family Rest </span>Assistant
            </h2>
          </div>
        </div>
        <VerifyEmailState user={user} />
      </>
    )}
  </Modal>
);

export default AssistantPanel;
