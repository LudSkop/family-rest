"use client";

import css from "./CartDrawer.module.css";
import Image from "next/image";
import Link from "next/link";
import Modal from "@/components/Modal/Modal";
import { MAX_QUANTITY, useCart } from "@/components/PreOrder/CartProvider";
import { usePreOrder } from "@/components/PreOrder/PreOrderProvider";
import { formatPrice } from "@/lib/utils/formatPrice";

type Props = {
  onClose: () => void;
};

// Бекенд не віддає час приготування — поки однаковий для всіх страв (як у Figma)
const READY_TIME = "Expected ready time – 10 minutes";

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
);

// Бічна панель кошика: страви передзамовлення, Grand Total і Submit
const CartDrawer = ({ onClose }: Props) => {
  const { session } = usePreOrder();
  const { items, totalCents, setQuantity, removeItem } = useCart();

  const isOwner = session?.role === "OWNER";

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
                <li key={item.dishId} className={css.item}>
                  <div className={css.imageWrapper}>
                    <Image
                      src={item.image_url}
                      alt=""
                      fill
                      sizes="64px"
                      className={css.image}
                    />
                  </div>

                  <div className={css.info}>
                    <div className={css.itemHead}>
                      <p className={css.itemName}>{item.name}</p>
                      <button
                        type="button"
                        className={css.remove}
                        onClick={() => removeItem(item.dishId)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <p className={css.readyTime}>{READY_TIME}</p>

                    <div className={css.itemFoot}>
                      <div
                        className={css.stepper}
                        role="group"
                        aria-label={`Quantity of ${item.name}`}
                      >
                        <button
                          type="button"
                          className={css.stepBtn}
                          onClick={() =>
                            setQuantity(item.dishId, item.quantity - 1)
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
                            setQuantity(item.dishId, item.quantity + 1)
                          }
                          disabled={item.quantity >= MAX_QUANTITY}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <p className={css.itemPrice}>
                        {formatPrice(item.price_cents * item.quantity)}
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

            {/* TODO (крок 7): на бекенді ще немає API передзамовлення */}
            <button
              type="button"
              className={css.submit}
              disabled
              aria-describedby="submit-hint"
            >
              Submit Pre-Order
            </button>
            <p id="submit-hint" className={css.hint}>
              Sending pre-orders to the restaurant is coming soon.
            </p>
          </div>
        </>
      )}
    </Modal>
  );
};

export default CartDrawer;
