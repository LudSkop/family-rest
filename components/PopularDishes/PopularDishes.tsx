"use client";

import css from "./PopularDishes.module.css";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPopularDishes } from "@/lib/api/clientApi";
import DishCard from "@/components/DishCard/DishCard";
import SectionTitle from "@/components/SectionTitle/SectionTitle";
import DishModal from "@/components/DishModal/DishModal";

const PopularDishes = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: dishes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dishes", "popular"],
    queryFn: getPopularDishes,
  });

  return (
    <section className={css.section}>
      <div className="container">
        <SectionTitle>Most Popular Dishes</SectionTitle>

        {isLoading && <p className={css.status}>Loading dishes...</p>}

        {isError && (
          <p className={css.status}>
            Could not load dishes. Please try again later.
          </p>
        )}

        {dishes && dishes.length > 0 && (
          <ul className={css.list}>
            {dishes.map((dish) => (
              <li key={dish.id}>
                <DishCard dish={dish} onOpen={setSelectedId} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId && (
        <DishModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </section>
  );
};

export default PopularDishes;
