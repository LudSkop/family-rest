import css from "./DishCard.module.css";
import Image from "next/image";
import type { Dish } from "@/types/dish";
import { formatPrice } from "@/lib/utils/formatPrice";

type Props = {
  dish: Dish;
  onOpen: (id: string) => void;
  // Лише в режимі передзамовлення: показує кнопку «Pre-Order»
  onPreOrder?: (dish: Dish) => void;
};

const DishCard = ({ dish, onOpen, onPreOrder }: Props) => {
  const { id, name, price_cents, weight_grams, image_url, is_available } = dish;

  return (
    <article className={`${css.card} ${is_available ? "" : css.soldOut}`}>
      {!is_available && <span className={css.badge}>Sold Out</span>}

      <div className={css.imageWrapper}>
        <Image
          src={image_url}
          alt={name}
          fill
          sizes="200px"
          className={css.image}
        />
      </div>

      <div className={css.info}>
        <h3 className={css.name}>
          {/* Кнопка розтягнута на всю картку (::after) — клікабельна вся картка */}
          <button
            type="button"
            className={css.link}
            aria-haspopup="dialog"
            onClick={() => onOpen(id)}
          >
            {name}
          </button>
        </h3>
        <div className={css.meta}>
          <p className={css.price}>{formatPrice(price_cents)}</p>
          <p className={css.weight}>{weight_grams} g</p>
        </div>
      </div>

      {/* Розпродану страву замовити не можна — кнопки немає */}
      {onPreOrder && is_available && (
        <button
          type="button"
          className={css.preOrderBtn}
          onClick={() => onPreOrder(dish)}
        >
          Pre-Order
        </button>
      )}
    </article>
  );
};

export default DishCard;
