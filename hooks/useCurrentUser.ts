"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api/clientApi";

const subscribe = () => () => {};

// Хто увійшов: null — гість. Той самий ключ ["me"] оновлюють вхід і вихід
export const useCurrentUser = () => {
  const query = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Сервер не знає, хто увійшов, і малює стан «завантаження».
  // Поки React гідрує HTML, віддаємо те саме, інакше буде hydration mismatch
  // (дані /auth/me можуть прийти в кеш раніше, ніж гідрується сторінка)
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return {
    data: isHydrated ? query.data : undefined,
    isLoading: !isHydrated || query.isLoading,
  };
};
