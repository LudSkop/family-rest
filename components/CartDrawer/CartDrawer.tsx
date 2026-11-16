"use client";

import css from "./CartDrawer.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal/Modal";
import { useCart } from "@/components/PreOrder/CartProvider";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import { usePreOrder } from "@/components/PreOrder/PreOrderProvider";
import { formatPrice } from "@/lib/utils/formatPrice";

type Props = {
  onClose: () => void;
};

// prep_minutes з бекенда → «Expected ready time – 15 minutes»
const readyTime = (minutes: number) =>
  `Expected ready time – ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
);

// Бічна панель кошика: страви передзамовлення, Grand Total і Submit
const CartDrawer = ({ onClose }: Props) => {
  const { session } = usePreOrder();
  const router = useRouter();
  const { items, totalCents, setQuantity, removeItem, submit, isSubmitting } =
    useCart();

  // Власник після Submit бачить модалку «Pre-Order Submitted» (Figma owner),
  // гість — окрему сторінку «Pre-Order Submitted!» (Figma guest)
  const [isSentToOwner, setIsSentToOwner] = useState(false);

  const isOwner = session?.role === "OWNER";
  const hasSoldOut = items.some((item) => !item.dish.is_available);

  const handleSubmit = async () => {
    const part = await submit();
    if (!part || !session) return;

    if (isOwner) setIsSentToOwner(true);
    else {
      onClose();
      router.push("/pre-order/submitted");
    }
  };

  if (isSentToOwner) {
    return (
      <Modal
        onClose={onClose}
        labelledBy="sent-title"
        className={css.sentModal}
      >
        <h2 id="sent-title" className={css.sentTitle}>
          Pre-Order Submitted
        </h2>
        <p className={css.sentText}>Your Pre-Order was sent successfully.</p>
        <p className={css.sentText}>
          Wait for the confirmation from the restaurant.
        </p>
        <ButtonLink href="/reservations" onClick={onClose}>
          View Reservations
        </ButtonLink>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} labelledBy="cart-title" className={css.drawer}>
      <h2 id="cart-title" className={css.title}>
        Cart
      </h2>

      {items.length === 0 ? (
        <div className={css.empty}>
          <Image
            src="/image/cart-basket.svg"
            alt=""
            width={180}
            height={130}
            className={css.illustration}
          />
          <p className={css.emptyTitle}>Your cart is empty</p>
          <p className={css.emptyText}>
            {session
              ? "Looks like you haven't added any dishes to your cart yet"
              : "Book a table first — then you can pre-order dishes for your reservation"}
          </p>
          <Link
            href={session ? "/menu" : "/booking"}
            className={css.menuLink}
            onClick={onClose}
          >
            {session ? "Go to Menu" : "Book a Table"}
          </Link>
        </div>
      ) : (
        <>
          <div className={css.body}>
            {/* «My Pre-Order» — у власника (у Figma його кошик окремо від гостей) */}
            {isOwner && <h3 className={css.subtitle}>My Pre-Order</h3>}

            <ul className={css.items}>
              {items.map((item) => (
                <li
                  key={item.dish.id}
                  className={`${css.item} ${item.dish.is_available ? "" : css.itemSoldOut}`}
                >
                  <div className={css.imageWrapper}>
                    <Image
                      src={item.dish.image_url}
                      alt=""
                      fill
                      sizes="64px"
                      className={css.image}
                    />
                  </div>

                  <div className={css.info}>
                    <div className={css.itemHead}>
                      <p className={css.itemName}>
                        {item.dish.name}
                        {!item.dish.is_available && (
                          <span className={css.soldOutBadge}>Sold Out</span>
                        )}
                      </p>
                      <button
                        type="button"
                        className={css.remove}
                        onClick={() => removeItem(item.dish.id)}
                        aria-label={`Remove ${item.dish.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <p className={css.readyTime}>
                      {readyTime(item.dish.prep_minutes)}
                    </p>
                    {item.note && <p className={css.note}>{item.note}</p>}

                    <div className={css.itemFoot}>
                      <div
                        className={css.stepper}
                        role="group"
                        aria-label={`Quantity of ${item.dish.name}`}
                      >
                        <button
                          type="button"
                          className={css.stepBtn}
                          onClick={() =>
                            setQuantity(item.dish.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <output className={css.count} aria-live="polite">
                          {item.quantity}
                        </output>
                        <button
                          type="button"
                          className={css.stepBtn}
                          onClick={() =>
                            setQuantity(item.dish.id, item.quantity + 1)
                          }
                          // Розпродану страву можна лише зменшити чи прибрати
                          disabled={!item.dish.is_available}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <p className={css.itemPrice}>
                        {formatPrice(item.line_total_cents)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Футер притиснутий донизу панелі (примітка Figma) */}
          <div className={css.footer}>
            <p className={css.total}>
              <span>Grand Total</span>
              <strong>{formatPrice(totalCents)}</strong>
            </p>

            <button
              type="button"
              className={`${css.submit} ${hasSoldOut ? "" : css.submitActive}`}
              onClick={handleSubmit}
              disabled={hasSoldOut || isSubmitting}
              aria-describedby={hasSoldOut ? "submit-hint" : undefined}
            >
              {isSubmitting ? "Submitting..." : "Submit Pre-Order"}
            </button>
            {hasSoldOut && (
              <p id="submit-hint" className={css.hint}>
                Remove sold-out dishes to submit your pre-order.
              </p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

export default CartDrawer;
