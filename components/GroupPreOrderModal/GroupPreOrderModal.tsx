"use client";

import css from "./GroupPreOrderModal.module.css";
import Image from "next/image";
import Modal from "@/components/Modal/Modal";
import { formatPrice } from "@/lib/utils/formatPrice";
import { formatBookingDate, formatTimeRange } from "@/lib/utils/bookingTime";
import type {
  Booking,
  CartLine,
  ParticipantPreOrder,
  SubmittedPart,
} from "@/types/booking";

type Props = {
  booking: Booking;
  // Власник бачить усю компанію, гість — лише себе
  participants: ParticipantPreOrder[];
  totalCents: number;
  // Немає — додавати страви вже не можна (бронювання почалось чи минуло)
  onAddMore?: () => void;
  onClose: () => void;
};

// Відправлені частини фінальні — показуємо їх разом: одна страва = один рядок
const mergeLines = (parts: SubmittedPart[]) => {
  const byDish = new Map<string, CartLine>();
  parts
    .flatMap((part) => part.items)
    .forEach((line) => {
      const existing = byDish.get(line.dish.id);
      byDish.set(
        line.dish.id,
        existing
          ? {
              ...existing,
              quantity: existing.quantity + line.quantity,
              line_total_cents:
                existing.line_total_cents + line.line_total_cents,
              note:
                [existing.note, line.note].filter(Boolean).join("; ") || null,
            }
          : line,
      );
    });
  return [...byDish.values()];
};

// «Group Pre-Order» з Figma (статус «Sent to Restaurant»):
// спершу «My Pre-Order», далі блок кожного гостя в порядку приєднання
const GroupPreOrderModal = ({
  booking,
  participants,
  totalCents,
  onAddMore,
  onClose,
}: Props) => {
  const isOwner = booking.role === "OWNER";
  const me = participants.find((p) => p.id === booking.participant_id);
  const others = participants.filter((p) => p.id !== booking.participant_id);
  const ordered = [...(me ? [me] : []), ...others];

  // Місця, на які ще ніхто не приєднався (лише власнику — він бачить усіх)
  const notJoined = isOwner
    ? Math.max(booking.party_size - participants.length, 0)
    : 0;

  return (
    <Modal onClose={onClose} labelledBy="group-title" className={css.modal}>
      <div className={css.head}>
        <h2 id="group-title" className={css.title}>
          Group Pre-Order
        </h2>
        <span className={css.badge}>Sent to Restaurant</span>
      </div>

      <p className={css.meta}>
        <span>{booking.location.address}</span>
        <span>{formatBookingDate(booking.starts_at)}</span>
        <span>{formatTimeRange(booking.starts_at, booking.ends_at)}</span>
        <span>
          {booking.party_size} {booking.party_size === 1 ? "Guest" : "Guests"}
        </span>
      </p>

      <div className={css.blocks}>
        {ordered.map((participant) => {
          const isMe = participant === me;
          const lines = mergeLines(participant.parts);
          const titleId = `pre-order-${participant.id}`;

          return (
            <section
              key={participant.id}
              className={css.block}
              aria-labelledby={titleId}
            >
              <div className={css.blockHead}>
                <h3 id={titleId} className={css.blockTitle}>
                  {isMe ? "My Pre-Order" : participant.name}
                  {!isMe && (
                    <span className={css.role}>
                      {participant.role === "OWNER" ? "Host" : "Guest"}
                    </span>
                  )}
                </h3>
                {/* Відправлене змінити не можна — нові страви йдуть окремою частиною */}
                {isMe && onAddMore && (
                  <button
                    type="button"
                    className={css.link}
                    onClick={onAddMore}
                  >
                    {lines.length ? "Add more dishes" : "Add dishes"}
                  </button>
                )}
              </div>

              {lines.length === 0 ? (
                <p className={css.empty}>
                  {isMe
                    ? "You haven't pre-ordered yet."
                    : "Hasn't pre-ordered yet."}
                </p>
              ) : (
                <>
                  <ul className={css.lines}>
                    {lines.map((line) => (
                      <li key={line.dish.id} className={css.line}>
                        <div className={css.thumb}>
                          <Image
                            src={line.dish.image_url}
                            alt=""
                            fill
                            sizes="40px"
                          />
                        </div>
                        <div className={css.lineInfo}>
                          <p className={css.lineName}>{line.dish.name}</p>
                          {line.note && (
                            <p className={css.lineNote}>{line.note}</p>
                          )}
                        </div>
                        <p className={css.qty}>Qty {line.quantity}</p>
                        <p className={css.price}>
                          {formatPrice(line.line_total_cents)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <p className={css.subtotal}>
                    <span>Subtotal</span>
                    <span>{formatPrice(participant.total_cents)}</span>
                  </p>
                </>
              )}
            </section>
          );
        })}
      </div>

      {notJoined > 0 && (
        <p className={css.notJoined}>
          {notJoined === 1
            ? "1 more guest hasn't joined yet."
            : `${notJoined} more guests haven't joined yet.`}
        </p>
      )}

      <p className={css.total}>
        <span>Grand Total</span>
        <strong>{formatPrice(totalCents)}</strong>
      </p>
    </Modal>
  );
};

export default GroupPreOrderModal;
