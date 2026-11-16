"use client";

import css from "./GroupPreOrderModal.module.css";
import Image from "next/image";
import Modal from "@/components/Modal/Modal";
import { formatPrice } from "@/lib/utils/formatPrice";
import { formatBookingDate, formatTimeRange } from "@/lib/utils/bookingTime";
import type { Booking, CartLine, MyPreOrder } from "@/types/booking";

type Props = {
  booking: Booking;
  preOrder: MyPreOrder;
  onAddMore: () => void;
  onClose: () => void;
};

// Відправлені частини фінальні — показуємо їх разом: одна страва = один рядок
const mergeLines = (preOrder: MyPreOrder) => {
  const byDish = new Map<string, CartLine>();
  preOrder.parts
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

// «Group Pre-Order» з Figma (статус «Sent to Restaurant»).
// Бекенд поки віддає лише власні страви учасника, тож блоків гостей немає
const GroupPreOrderModal = ({
  booking,
  preOrder,
  onAddMore,
  onClose,
}: Props) => {
  const lines = mergeLines(preOrder);

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

      <section className={css.block} aria-labelledby="my-pre-order">
        <div className={css.blockHead}>
          <h3 id="my-pre-order" className={css.blockTitle}>
            My Pre-Order
          </h3>
          {/* Відправлене змінити не можна — нові страви йдуть окремою частиною */}
          <button type="button" className={css.link} onClick={onAddMore}>
            Add more dishes
          </button>
        </div>

        <ul className={css.lines}>
          {lines.map((line) => (
            <li key={line.dish.id} className={css.line}>
              <div className={css.thumb}>
                <Image src={line.dish.image_url} alt="" fill sizes="40px" />
              </div>
              <div className={css.lineInfo}>
                <p className={css.lineName}>{line.dish.name}</p>
                {line.note && <p className={css.lineNote}>{line.note}</p>}
              </div>
              <p className={css.qty}>Qty {line.quantity}</p>
              <p className={css.price}>{formatPrice(line.line_total_cents)}</p>
            </li>
          ))}
        </ul>

        <p className={css.subtotal}>
          <span>Subtotal</span>
          <span>{formatPrice(preOrder.total_cents)}</span>
        </p>
      </section>

      <p className={css.total}>
        <span>Grand Total</span>
        <strong>{formatPrice(preOrder.total_cents)}</strong>
      </p>
    </Modal>
  );
};

export default GroupPreOrderModal;
