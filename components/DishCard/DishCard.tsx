import css from "./DishCard.module.css";
import Image from "next/image";
import type { Dish } from "@/types/dish";
import { formatPrice } from "@/lib/utils/formatPrice";

type Props = {
  dish: Dish;
  onOpen: (id: string) => void;
};

const DishCard = ({ dish, onOpen }: Props) => {
  const { id, name, price_cents, weight_grams, image_url, is_available } = dish;

  return (
    <article
      className={`${css.card} ${is_available ? "" : css.soldOut}`}
    >
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
    </article>
  );
};

export default DishCard;
