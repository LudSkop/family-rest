import css from "./DishCard.module.css";
import Image from "next/image";
import type { Dish } from "@/types/dish";
import { formatPrice } from "@/lib/utils/formatPrice";

type Props = {
  dish: Dish;
};

const DishCard = ({ dish }: Props) => {
  const { name, price_cents, weight_grams, image_url } = dish;

  return (
    <article className={css.card}>
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
        <h3 className={css.name}>{name}</h3>
        <div className={css.meta}>
          <p className={css.price}>{formatPrice(price_cents)}</p>
          <p className={css.weight}>{weight_grams} g</p>
        </div>
      </div>
    </article>
  );
};

export default DishCard;
