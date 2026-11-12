"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/Toast/ToastProvider";
import { getApiStatus, getBooking } from "@/lib/api/clientApi";
import type { Booking, PreOrderSession } from "@/types/booking";

const STORAGE_KEY = "family-rest:pre-order";

// ===== Сховище в localStorage, на яке можна «підписатися» =====
// useSyncExternalStore: на сервері сесії немає (null), у браузері — з localStorage,
// тож HTML сервера й першого рендеру збігаються (без hydration mismatch)

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSession: PreOrderSession | null = null;

const readRaw = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // приватний режим / заблоковане сховище
  }
};

const getSnapshot = () => {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as PreOrderSession) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
};

const writeSession = (session: PreOrderSession | null) => {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // без сховища режим просто не переживе оновлення сторінки
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Зміни з інших вкладок
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

// Бронювання з бекенда → сесія передзамовлення
export const toPreOrderSession = (booking: Booking): PreOrderSession => ({
  bookingId: booking.id,
  role: booking.role,
  ownerName:
    booking.participants.find((participant) => participant.role === "OWNER")
      ?.name ?? "",
  starts_at: booking.starts_at,
  ends_at: booking.ends_at,
  party_size: booking.party_size,
  table: booking.table,
  location: booking.location,
});

// ===== Контекст =====

type PreOrderContextValue = {
  session: PreOrderSession | null;
  startPreOrder: (session: PreOrderSession) => void;
  endPreOrder: () => void;
};

const PreOrderContext = createContext<PreOrderContextValue | null>(null);

export const PreOrderProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { showToast } = useToast();
  const session = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const startPreOrder = useCallback(
    (next: PreOrderSession) => writeSession(next),
    [],
  );
  const endPreOrder = useCallback(() => writeSession(null), []);

  // Перевіряємо, що бронювання ще актуальне: не скасоване, не минуло
  // і користувач досі його учасник (гість — за cookie, власник — за сесією)
  const bookingId = session?.bookingId;
  const { data: booking, error } = useQuery({
    queryKey: ["bookings", bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: Boolean(bookingId),
    retry: false,
  });

  useEffect(() => {
    if (!session) return;

    const status = error ? getApiStatus(error) : undefined;
    const isGone = status === 401 || status === 404;
    const isCancelled = booking?.status === "CANCELLED";
    const isOver = new Date(session.ends_at).getTime() <= Date.now();

    if (isGone || isCancelled || isOver) {
      writeSession(null);
      showToast(
        isCancelled
          ? "This reservation was cancelled, so pre-order is closed."
          : "This reservation is no longer available for pre-order.",
        "error",
      );
    } else if (booking) {
      // Оновлюємо дані, якщо власник змінив час чи кількість гостей
      const fresh = toPreOrderSession(booking);
      if (JSON.stringify(fresh) !== JSON.stringify(session))
        writeSession(fresh);
    }
  }, [session, booking, error, showToast]);

  return (
    <PreOrderContext.Provider value={{ session, startPreOrder, endPreOrder }}>
      {children}
    </PreOrderContext.Provider>
  );
};

export const usePreOrder = () => {
  const context = useContext(PreOrderContext);
  if (!context)
    throw new Error("usePreOrder must be used inside PreOrderProvider");
  return context;
};
