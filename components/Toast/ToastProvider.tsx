"use client";

import css from "./Toast.module.css";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
  title?: string;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 5000;

let nextId = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Контейнер — popover: так він у «верхньому шарі» і видний навіть поверх модалки
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isOpen = container.matches(":popover-open");
    if (toasts.length > 0 && !isOpen) container.showPopover();
    if (toasts.length === 0 && isOpen) container.hidePopover();
  }, [toasts.length]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success", title?: string) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, variant, title }]);
      setTimeout(() => dismiss(id), TOAST_DURATION);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* aria-live: скрінрідер прочитає повідомлення, щойно воно з'явиться */}
      <div
        ref={containerRef}
        popover="manual"
        data-toast-root=""
        className={css.container}
        aria-live="polite"
      >
        {toasts.map(({ id, message, variant, title }) => (
          <div
            key={id}
            className={`${css.toast} ${css[variant]}`}
            role={variant === "error" ? "alert" : "status"}
          >
            <span className={css.icon} aria-hidden="true">
              {variant === "success" ? "✓" : "!"}
            </span>
            <div className={css.message}>
              <p className={css.title}>
                {title ?? (variant === "success" ? "Success" : "Error")}
              </p>
              <p>{message}</p>
            </div>
            <button
              type="button"
              className={css.close}
              aria-label="Dismiss"
              onClick={() => dismiss(id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
};
