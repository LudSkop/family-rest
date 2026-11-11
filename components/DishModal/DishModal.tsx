"use client";

import css from "./DishModal.module.css";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import { getDish } from "@/lib/api/clientApi";
import { formatPrice } from "@/lib/utils/formatPrice";

type Props = {
  id: string;
  onClose: () => void;
};

// Модалка страви: фото ліворуч, склад і поживність праворуч (як у Figma)
const DishModal = ({ id, onClose }: Props) => {
  const {
    data: dish,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dishes", id],
    queryFn: () => getDish(id),
    retry: false,
  });

  return (
    <Modal onClose={onClose} labelledBy="dish-title" className={css.modal}>
      {isLoading && <p className={css.status}>Loading dish...</p>}

      {isError && (
        <p className={css.status}>
          Could not load the dish. Please try again later.
        </p>
      )}

      {dish && (
        <div className={css.layout}>
          <div className={css.imageWrapper}>
            <Image
              src={dish.image_url}
              alt={dish.name}
              fill
              sizes="(min-width: 768px) 260px, 220px"
              className={css.image}
            />
          </div>

          <div className={css.info}>
            <h2 id="dish-title" className={css.name}>
              {dish.name}
            </h2>

            <p className={css.description}>{dish.description}</p>

            {/* dl — пари «назва: значення» для поживності */}
            <dl className={css.facts}>
              <div className={css.fact}>
                <dt>Calories:</dt>
                <dd>~{dish.calories} kcal</dd>
              </div>
              <div className={css.factRow}>
                <div className={css.fact}>
                  <dt>Protein:</dt>
                  <dd>{dish.protein}</dd>
                </div>
                <div className={css.fact}>
                  <dt>Fats:</dt>
                  <dd>{dish.fats}</dd>
                </div>
                <div className={css.fact}>
                  <dt>Carbs:</dt>
                  <dd>{dish.carbs}</dd>
                </div>
              </div>
              <div className={css.fact}>
                <dt>Vitamins &amp; minerals:</dt>
                <dd>{dish.vitamins}</dd>
              </div>
            </dl>

            <p className={css.price}>
              {formatPrice(dish.price_cents)}
              <span className={css.weight}>/{dish.weight_grams}g</span>
            </p>

            {!dish.is_available && (
              <p className={css.soldOut}>Currently unavailable</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DishModal;
