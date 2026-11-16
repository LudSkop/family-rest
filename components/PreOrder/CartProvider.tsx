"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePreOrder } from "@/components/PreOrder/PreOrderProvider";
import { useToast } from "@/components/Toast/ToastProvider";
import {
  getApiError,
  getCart,
  removeCartItem,
  setCartItem,
  submitCart,
  type SetCartItemParams,
} from "@/lib/api/clientApi";
import type { Cart, CartLine, SubmittedPart } from "@/types/booking";
import type { Dish } from "@/types/dish";

// Кошик-чернетку тримає бекенд — окремо для кожного учасника бронювання
// (власник за сесією, гість за cookie guest_token)

const EMPTY_CART: Cart = { items: [], total_cents: 0 };

const cartKey = (bookingId: string) => ["bookings", bookingId, "cart"];

const CART_ERRORS: Record<string, string> = {
  PREORDER_CLOSED: "Pre-ordering for this reservation is closed.",
  DISH_UNAVAILABLE: "This dish is sold out right now.",
  QUANTITY_TOO_LARGE: "You've reached the maximum quantity for this dish.",
  CART_EMPTY: "Your cart is empty.",
};

// Поки бекенд не відповів, показуємо зміну одразу (оптимістично)
const withQuantity = (cart: Cart, line: CartLine, quantity: number): Cart => {
  const exists = cart.items.some((item) => item.dish.id === line.dish.id);
  const items =
    quantity < 1
      ? cart.items.filter((item) => item.dish.id !== line.dish.id)
      : exists
        ? cart.items.map((item) =>
            item.dish.id === line.dish.id
              ? {
                  ...item,
                  quantity,
                  line_total_cents: item.dish.price_cents * quantity,
                }
              : item,
          )
        : [
            ...cart.items,
            {
              ...line,
              quantity,
              line_total_cents: line.dish.price_cents * quantity,
            },
          ];

  return {
    items,
    total_cents: items.reduce((sum, item) => sum + item.line_total_cents, 0),
  };
};

type CartContextValue = {
  items: CartLine[];
  // Кількість страв (з урахуванням quantity) — для лічильника на іконці
  count: number;
  totalCents: number;
  isLoading: boolean;
  addItem: (dish: Dish) => void;
  setQuantity: (dishId: string, quantity: number) => void;
  removeItem: (dishId: string) => void;
  submit: () => Promise<SubmittedPart | null>;
  isSubmitting: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { session } = usePreOrder();
  const bookingId = session?.bookingId;

  const { data: cart = EMPTY_CART, isLoading } = useQuery({
    queryKey: cartKey(bookingId ?? "none"),
    queryFn: () => getCart(bookingId!),
    enabled: Boolean(bookingId),
    retry: false,
  });

  const showError = useCallback(
    (error: unknown) => {
      const apiError = getApiError(error);
      showToast(
        CART_ERRORS[apiError?.code ?? ""] ??
          apiError?.message ??
          "Could not update your cart. Please try again.",
        "error",
      );
    },
    [showToast],
  );

  const mutationKey = ["cart-update", bookingId];

  // Відповідь бекенда — остання правда про кошик. Але поки в дорозі є новіші
  // зміни (швидкі кліки «+»), не перезаписуємо ними оптимістичний стан:
  // його оновить відповідь на останній запит
  const syncCart = useCallback(
    (fresh: Cart) => {
      if (!bookingId) return;
      const inFlight = queryClient.isMutating({
        mutationKey: ["cart-update", bookingId],
      });
      if (inFlight <= 1) queryClient.setQueryData(cartKey(bookingId), fresh);
    },
    [bookingId, queryClient],
  );

  const rollback = useCallback(() => {
    if (bookingId)
      queryClient.invalidateQueries({ queryKey: cartKey(bookingId) });
  }, [bookingId, queryClient]);

  const setItemMutation = useMutation({
    mutationKey,
    mutationFn: (params: SetCartItemParams) => setCartItem(params),
    onSuccess: syncCart,
    onError: (error) => {
      rollback();
      showError(error);
    },
  });

  const removeMutation = useMutation({
    mutationKey,
    mutationFn: (dishId: string) => removeCartItem(bookingId!, dishId),
    onSuccess: syncCart,
    onError: (error) => {
      rollback();
      showError(error);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submitCart(bookingId!),
    onSuccess: () => {
      // Бекенд залишив порожній кошик для нової чернетки
      syncCart(EMPTY_CART);
      queryClient.invalidateQueries({
        queryKey: ["bookings", bookingId, "my-pre-order"],
      });
    },
    onError: (error) => {
      rollback();
      showError(error);
    },
  });

  // Нова кількість рахується від поточного (вже оптимістичного) стану кошика,
  // тож швидкі кліки «+» не губляться
  const changeQuantity = useCallback(
    (line: CartLine, quantity: number) => {
      if (!bookingId) return;
      const current =
        queryClient.getQueryData<Cart>(cartKey(bookingId)) ?? EMPTY_CART;
      queryClient.setQueryData(
        cartKey(bookingId),
        withQuantity(current, line, quantity),
      );

      if (quantity < 1) removeMutation.mutate(line.dish.id);
      else
        setItemMutation.mutate({
          bookingId,
          dishId: line.dish.id,
          quantity,
          note: line.note,
        });
    },
    [bookingId, queryClient, removeMutation, setItemMutation],
  );

  const findLine = useCallback(
    (dishId: string) => {
      if (!bookingId) return undefined;
      return queryClient
        .getQueryData<Cart>(cartKey(bookingId))
        ?.items.find((item) => item.dish.id === dishId);
    },
    [bookingId, queryClient],
  );

  const addItem = useCallback(
    (dish: Dish) => {
      const existing = findLine(dish.id);
      changeQuantity(
        existing ?? {
          id: `pending-${dish.id}`,
          dish: {
            id: dish.id,
            name: dish.name,
            price_cents: dish.price_cents,
            image_url: dish.image_url,
            is_available: dish.is_available,
            prep_minutes: dish.prep_minutes,
          },
          quantity: 0,
          note: null,
          line_total_cents: 0,
        },
        (existing?.quantity ?? 0) + 1,
      );
    },
    [findLine, changeQuantity],
  );

  const setQuantity = useCallback(
    (dishId: string, quantity: number) => {
      const line = findLine(dishId);
      if (line) changeQuantity(line, quantity);
    },
    [findLine, changeQuantity],
  );

  const removeItem = useCallback(
    (dishId: string) => setQuantity(dishId, 0),
    [setQuantity],
  );

  const submit = useCallback(async () => {
    try {
      return await submitMutation.mutateAsync();
    } catch {
      return null; // помилку вже показали toast-ом
    }
  }, [submitMutation]);

  const value = useMemo(
    () => ({
      items: bookingId ? cart.items : EMPTY_CART.items,
      count: bookingId
        ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
        : 0,
      totalCents: bookingId ? cart.total_cents : 0,
      isLoading,
      addItem,
      setQuantity,
      removeItem,
      submit,
      isSubmitting: submitMutation.isPending,
    }),
    [
      bookingId,
      cart,
      isLoading,
      addItem,
      setQuantity,
      removeItem,
      submit,
      submitMutation.isPending,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
