"use client";

import css from "./AssistantPanel.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AssistantAction, AssistantActionStatus } from "@/types/assistant";

type Props = {
  action: AssistantAction;
  // Яка картка зараз застосовується / скасовується
  busyId: string | null;
  // Іде відповідь асистента — натискати не можна
  isLocked: boolean;
  onApply: (action: AssistantAction) => void;
  onCancel: (action: AssistantAction) => void;
};

// Смужка статусу зверху, як на картках у Reservations
const STATUS_LABELS: Record<AssistantActionStatus, string> = {
  PENDING: "Confirm to book",
  APPLIED: "Applied",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  FAILED: "Failed",
};

// Іконки ті самі, що на картці бронювання (ReservationCard)
const FIELD_ICONS: Record<string, string> = {
  location:
    "M12 21s-7-6.1-7-11.5a7 7 0 1 1 14 0C19 14.9 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  date: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  time: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  guests:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3 6",
  table: "M4 9h16M6 9v10M18 9v10M4 9l2-4h12l2 4",
};

// Мітка поля прихована за іконкою — голе «4» біля 👥 стає «4 guests»
const formatValue = (label: string, value: string) =>
  label.toLowerCase() === "guests" && /^\d+$/.test(value)
    ? `${value} ${value === "1" ? "guest" : "guests"}`
    : value;

// setTimeout не приймає більше ~24.8 доби
const MAX_TIMEOUT = 2 ** 31 - 1;

// Картка підтвердження: асистент лише пропонує, бронює — кнопка «Book»
const ActionCard = ({ action, busyId, isLocked, onApply, onCancel }: Props) => {
  const expiresAt = Date.parse(action.expires_at);
  const [isExpired, setIsExpired] = useState(() => expiresAt <= Date.now());

  // Картка на екрані сама не оновлюється: минув expires_at — показуємо EXPIRED
  useEffect(() => {
    if (action.status !== "PENDING" || isExpired) return;
    const timer = setTimeout(
      () => setIsExpired(true),
      Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMEOUT),
    );
    return () => clearTimeout(timer);
  }, [action.status, expiresAt, isExpired]);

  const status: AssistantActionStatus =
    action.status === "PENDING" && isExpired ? "EXPIRED" : action.status;
  const isBusy = busyId === action.id;
  const isDimmed = status === "CANCELLED" || status === "EXPIRED";
  const { card } = action;
  const titleId = `card-${action.id}`;

  return (
    <section
      className={`${css.card} ${css[`card${status}`]} ${isDimmed ? css.cardDimmed : ""}`}
      aria-labelledby={titleId}
    >
      <p className={css.cardStatus}>{STATUS_LABELS[status]}</p>

      <div className={css.cardBody}>
        <h3 id={titleId} className={css.cardTitle}>
          {card.title}
        </h3>

        <dl className={css.cardFields}>
          {card.fields.map(({ label, value }) => {
            const icon = FIELD_ICONS[label.toLowerCase()];
            return (
              <div key={label} className={css.cardField}>
                <dt className={icon ? "visually-hidden" : css.cardLabel}>
                  {label}
                </dt>
                <dd>
                  {icon && (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className={css.cardIcon}
                    >
                      <path d={icon} />
                    </svg>
                  )}
                  {formatValue(label, value)}
                </dd>
              </div>
            );
          })}
        </dl>

        {card.notice && <p className={css.cardNotice}>{card.notice}</p>}

        {status === "FAILED" && action.error && (
          <p className={css.cardError} role="alert">
            {action.error.message}
          </p>
        )}

        {status === "APPLIED" && (
          <Link href="/reservations" className={css.cardLink}>
            {action.result?.status === "PENDING"
              ? "View request in Reservations"
              : "View reservation"}
          </Link>
        )}

        {/* Як у «Book this table?»: обводка + градієнт */}
        {status === "PENDING" && (
          <div className={css.cardActions}>
            <button
              type="button"
              className={css.secondary}
              onClick={() => onCancel(action)}
              disabled={isBusy || isLocked || busyId !== null}
            >
              Cancel
            </button>
            <button
              type="button"
              className={css.primary}
              onClick={() => onApply(action)}
              disabled={isBusy || isLocked || busyId !== null}
            >
              {isBusy ? "Booking..." : card.confirm_label}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ActionCard;
