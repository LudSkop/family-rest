"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { usePreOrder } from "@/components/PreOrder/PreOrderProvider";
import type { Dish } from "@/types/dish";

// Страва в кошику: копія потрібних полів (щоб показати кошик без запитів)
export interface CartItem {
  dishId: string;
  name: string;
  price_cents: number;
  image_url: string;
  quantity: number;
}

export const MAX_QUANTITY = 20;

// Кошик окремий для кожного бронювання
export const cartStorageKey = (bookingId: string) =>
  `family-rest:cart:${bookingId}`;

// ===== Сховище в localStorage, на яке можна «підписатися» =====
// Як і в PreOrderProvider: на сервері кошик порожній, у браузері — з localStorage

const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; items: CartItem[] }>();

const readItems = (key: string): CartItem[] => {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY; // приватний режим / заблоковане сховище
  }

  // Той самий масив, поки дані не змінились, — інакше React перемальовує без кінця
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.items;

  let items = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) items = parsed as CartItem[];
  } catch {
    items = EMPTY;
  }
  cache.set(key, { raw, items });
  return items;
};

const writeItems = (key: string, items: CartItem[]) => {
  try {
    if (items.length > 0) localStorage.setItem(key, JSON.stringify(items));
    else localStorage.removeItem(key);
  } catch {
    // без сховища кошик просто не переживе оновлення сторінки
  }
  listeners.forEach((listener) => listener());
};

// Викликає PreOrderProvider, коли передзамовлення закінчилось
export const clearStoredCart = (bookingId: string) =>
  writeItems(cartStorageKey(bookingId), []);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Зміни з інших вкладок
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("family-rest:cart:")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

// ===== Контекст =====

type CartContextValue = {
  items: CartItem[];
  // Кількість страв (з урахуванням quantity) — для лічильника на іконці
  count: number;
  totalCents: number;
  addItem: (dish: Dish) => void;
  setQuantity: (dishId: string, quantity: number) => void;
  removeItem: (dishId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = usePreOrder();
  const key = session ? cartStorageKey(session.bookingId) : null;

  const items = useSyncExternalStore(
    subscribe,
    () => (key ? readItems(key) : EMPTY),
    () => EMPTY,
  );

  // Зміни завжди рахуємо від свіжих даних зі сховища
  const update = useCallback(
    (change: (current: CartItem[]) => CartItem[]) => {
      if (!key) return;
      writeItems(key, change(readItems(key)));
    },
    [key],
  );

  const addItem = useCallback(
    (dish: Dish) =>
      update((current) => {
        const existing = current.find((item) => item.dishId === dish.id);
        if (existing) {
          return current.map((item) =>
            item.dishId === dish.id
              ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) }
              : item,
          );
        }
        return [
          ...current,
          {
            dishId: dish.id,
            name: dish.name,
            price_cents: dish.price_cents,
            image_url: dish.image_url,
            quantity: 1,
          },
        ];
      }),
    [update],
  );

  const setQuantity = useCallback(
    (dishId: string, quantity: number) =>
      update((current) =>
        quantity < 1
          ? current.filter((item) => item.dishId !== dishId)
          : current.map((item) =>
              item.dishId === dishId
                ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY) }
                : item,
            ),
      ),
    [update],
  );

  const removeItem = useCallback(
    (dishId: string) =>
      update((current) => current.filter((item) => item.dishId !== dishId)),
    [update],
  );

  const clear = useCallback(() => update(() => []), [update]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      totalCents: items.reduce(
        (sum, item) => sum + item.price_cents * item.quantity,
        0,
      ),
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
