"use client";

import css from "./NotificationBell.module.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/Toast/ToastProvider";
import {
  getBookings,
  getNotifications,
  markNotificationRead,
} from "@/lib/api/clientApi";
import {
  formatBookingDate,
  formatPeople,
  formatSlotTime,
} from "@/lib/utils/bookingTime";
import type { Booking } from "@/types/booking";
import type { AppNotification } from "@/types/notification";

// Як часто перевіряємо нові сповіщення (бекенд сам їх не надсилає)
const POLL_INTERVAL = 60_000;

const NOTIFICATIONS_KEY = ["notifications"];

const describe = (notification: AppNotification, booking?: Booking) => {
  const when = booking
    ? `for ${formatPeople(booking.party_size)} on ${formatBookingDate(booking.starts_at)} at ${formatSlotTime(booking.starts_at)}`
    : "";

  if (notification.kind === "BOOKING_REQUEST_APPROVED") {
    return {
      title: "Request approved",
      text: booking
        ? `Your table ${when} is confirmed. You and your guests can now pre-order.`
        : "Your large-group reservation request was approved.",
    };
  }

  return {
    title: "Request declined",
    text: booking
      ? `Unfortunately, the restaurant couldn't confirm your table ${when}. Please choose another time.`
      : "Your large-group reservation request was declined.",
  };
};

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// → "5 minutes ago", "yesterday"
const timeAgo = (dateTime: string, now: number) => {
  const minutes = Math.round((new Date(dateTime).getTime() - now) / 60000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
};

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </svg>
);

// 🔔 у хедері: лічильник непрочитаних і список сповіщень
const NotificationBell = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  // «Зараз» для «5 minutes ago» — оновлюємо при кожному відкритті
  const [now, setNow] = useState(() => Date.now());

  const notifications = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => getNotifications({ limit: 20 }),
    refetchInterval: POLL_INTERVAL,
    // Повернулись на вкладку — одразу перевіряємо, чи є нові
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Деталі бронювань для тексту сповіщення
  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
    enabled: isOpen,
  });

  const items = notifications.data?.items ?? [];
  const unread = items.filter((item) => !item.read_at);
  const bookingById = new Map(
    (bookings.data ?? []).map((booking) => [booking.id, booking]),
  );

  // Нове сповіщення, поки сторінка відкрита → toast і свіжий статус бронювань
  const seenIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!notifications.data) return;
    const ids = notifications.data.items.map((item) => item.id);

    // Перше завантаження: усе, що вже було, нове не вважаємо
    if (!seenIds.current) {
      seenIds.current = new Set(ids);
      return;
    }

    const fresh = notifications.data.items.filter(
      (item) => !item.read_at && !seenIds.current!.has(item.id),
    );
    ids.forEach((id) => seenIds.current!.add(id));
    if (fresh.length === 0) return;

    const latest = fresh[0];
    const notify = (list?: Booking[]) => {
      const { title, text } = describe(
        latest,
        list?.find((booking) => booking.id === latest.booking_id),
      );
      showToast(
        text,
        latest.kind === "BOOKING_REQUEST_APPROVED" ? "success" : "error",
        title,
      );
    };

    // Статус бронювання змінився — беремо свіжий список (і для тексту toast)
    queryClient
      .fetchQuery({
        queryKey: ["bookings"],
        queryFn: getBookings,
        staleTime: 0,
      })
      .then(notify, () => notify());
  }, [notifications.data, queryClient, showToast]);

  const markRead = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(markNotificationRead)),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });

  // Закриваємо по кліку поза списком і по Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggle = () => {
    setNow(Date.now());
    setIsOpen((prev) => !prev);
  };

  const openNotification = (notification: AppNotification) => {
    if (!notification.read_at) markRead.mutate([notification.id]);
    setIsOpen(false);
    router.push("/reservations");
  };

  const unreadCount = unread.length;

  return (
    <div className={css.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={css.bell}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-controls="notifications-panel"
        onClick={toggle}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={css.badge} aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          id="notifications-panel"
          className={css.panel}
          aria-labelledby="notifications-title"
        >
          <div className={css.head}>
            <h2 id="notifications-title" className={css.title}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                type="button"
                className={css.markAll}
                onClick={() => markRead.mutate(unread.map((item) => item.id))}
                disabled={markRead.isPending}
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.isLoading && (
            <p className={css.empty} role="status">
              Loading...
            </p>
          )}

          {notifications.isError && (
            <p className={css.empty}>
              Could not load notifications. Please try again later.
            </p>
          )}

          {notifications.isSuccess && items.length === 0 && (
            <p className={css.empty}>
              No notifications yet. We&apos;ll let you know when the restaurant
              reviews your large-group requests.
            </p>
          )}

          {items.length > 0 && (
            <ul className={css.list}>
              {items.map((item) => {
                const { title, text } = describe(
                  item,
                  bookingById.get(item.booking_id),
                );
                const isApproved = item.kind === "BOOKING_REQUEST_APPROVED";

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${css.item} ${item.read_at ? "" : css.unread}`}
                      onClick={() => openNotification(item)}
                    >
                      <span
                        className={`${css.dot} ${isApproved ? css.approved : css.rejected}`}
                        aria-hidden="true"
                      />
                      <span className={css.itemBody}>
                        <span className={css.itemTitle}>
                          {title}
                          {!item.read_at && (
                            <span className="visually-hidden"> (unread)</span>
                          )}
                        </span>
                        <span className={css.itemText}>{text}</span>
                        <span className={css.itemTime}>
                          {timeAgo(item.created_at, now)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default NotificationBell;
