"use client";

import css from "./CartDrawer.module.css";
import Image from "next/image";
import Link from "next/link";
import Modal from "@/components/Modal/Modal";

type Props = {
  onClose: () => void;
};

// Бічна панель кошика (праворуч). Передзамовлень на бекенді ще немає,
// тому поки лише порожній стан з Figma
const CartDrawer = ({ onClose }: Props) => {
  return (
    <Modal onClose={onClose} labelledBy="cart-title" className={css.drawer}>
      <h2 id="cart-title" className={css.title}>
        Cart
      </h2>

      <div className={css.empty}>
        <Image
          src="/image/cart-empty.jpg"
          alt=""
          width={180}
          height={130}
          className={css.illustration}
        />
        <p className={css.emptyTitle}>Your cart is empty</p>
        <p className={css.emptyText}>
          Looks like you haven&apos;t added any dishes to your cart yet
        </p>
        <Link href="/menu" className={css.menuLink} onClick={onClose}>
          Go to Menu
        </Link>
      </div>
    </Modal>
  );
};

export default CartDrawer;
