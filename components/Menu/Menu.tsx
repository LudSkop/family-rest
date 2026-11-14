"use client";

import css from "./Menu.module.css";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import DishCard from "@/components/DishCard/DishCard";
import DishModal from "@/components/DishModal/DishModal";
import { usePreOrder } from "@/components/PreOrder/PreOrderProvider";
import { useCart } from "@/components/PreOrder/CartProvider";
import { useToast } from "@/components/Toast/ToastProvider";
import Pagination from "@/components/Pagination/Pagination";
import { getDishes } from "@/lib/api/clientApi";
import type { Dish, DishCategory, DishSort } from "@/types/dish";

const PAGE_SIZE = 12;

// Як у Figma: без вкладки «All», за замовчуванням — Appetizers
const CATEGORIES: { value: DishCategory; label: string }[] = [
  { value: "APPETIZER", label: "Appetizers" },
  { value: "MAIN_COURSE", label: "Main Courses" },
  { value: "DESSERT", label: "Desserts" },
];

const SORT_OPTIONS: { value: DishSort; label: string }[] = [
  { value: "POPULAR", label: "Popular First" },
  { value: "NEWEST", label: "Newest First" },
  { value: "PRICE_ASC", label: "Price: Low to High" },
  { value: "PRICE_DESC", label: "Price: High to Low" },
];

// Значення з адреси перевіряємо: невідоме — як не задане
const DEFAULT_CATEGORY: DishCategory = "APPETIZER";

const parseCategory = (value: string | null): DishCategory =>
  CATEGORIES.find((category) => category.value === value)?.value ??
  DEFAULT_CATEGORY;

const parseSort = (value: string | null): DishSort =>
  SORT_OPTIONS.find((option) => option.value === value)?.value ?? "POPULAR";

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

// Фільтри живуть в адресі (/menu?category=DESSERT&sort=PRICE_ASC&page=2):
// посиланням можна поділитися, а «Назад» у браузері повертає попередній стан
const Menu = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = parseCategory(searchParams.get("category"));
  const sort = parseSort(searchParams.get("sort"));
  const page = parsePage(searchParams.get("page"));

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // У режимі передзамовлення на картках і в модалці з'являється «Pre-Order»
  const { session } = usePreOrder();
  const { showToast } = useToast();
  const { addItem } = useCart();
  const handlePreOrder = session
    ? (dish: Dish) => {
        addItem(dish);
        showToast(
          `${dish.name} was added to your cart.`,
          "success",
          "Added to cart",
        );
      }
    : undefined;

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ["dishes", { category, sort, page }],
    queryFn: () =>
      getDishes({
        category,
        sort,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    // Поки вантажиться нова сторінка, показуємо попередню (без «стрибка» до Loading)
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const updateParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(changes).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });

    const query = params.toString();
    router.push(query ? `/menu?${query}` : "/menu", { scroll: false });
  };

  const handleCategory = (value: DishCategory) =>
    updateParams({
      category: value === DEFAULT_CATEGORY ? null : value,
      page: null,
    });

  const handleSort = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as DishSort;
    updateParams({ sort: value === "POPULAR" ? null : value, page: null });
  };

  const handlePage = (value: number) => {
    updateParams({ page: value === 1 ? null : String(value) });
    document
      .getElementById("menu-list")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={css.page}>
      <nav aria-label="Breadcrumbs" className={css.breadcrumbs}>
        <ol className="container">
          <li>
            <Link href="/">Main page</Link>
          </li>
          <li aria-current="page">Menu</li>
        </ol>
      </nav>

      {/* Банер усередині контейнера: краї збігаються з табами й картками */}
      <div className={`container ${css.bannerWrapper}`}>
        <div className={css.banner}>
          <p className={css.kicker}>Family Rest Restaurants</p>
          <h1 className={css.title}>Menu</h1>
        </div>
      </div>

      <section className={css.section} aria-label="Dishes">
        <div className="container">
          <div className={css.toolbar}>
            <div className={css.tabs} role="group" aria-label="Category">
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  className={css.tab}
                  aria-pressed={category === value}
                  onClick={() => handleCategory(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className={css.sort}>
              <span className={css.sortLabel}>Sort by:</span>
              <select value={sort} onChange={handleSort}>
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            id="menu-list"
            className={css.results}
            aria-busy={isPlaceholderData}
          >
            {isLoading && <p className={css.status}>Loading dishes...</p>}

            {isError && (
              <p className={css.status}>
                Could not load the menu. Please try again later.
              </p>
            )}

            {data && data.items.length === 0 && (
              <p className={css.status}>No dishes in this category yet.</p>
            )}

            {data && data.items.length > 0 && (
              <ul
                className={`${css.list} ${isPlaceholderData ? css.listLoading : ""}`}
              >
                {data.items.map((dish) => (
                  <li key={dish.id}>
                    <DishCard
                      dish={dish}
                      onOpen={setSelectedId}
                      onPreOrder={handlePreOrder}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={handlePage}
          />
        </div>
      </section>

      {selectedId && (
        <DishModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onPreOrder={handlePreOrder}
        />
      )}
    </div>
  );
};

export default Menu;
