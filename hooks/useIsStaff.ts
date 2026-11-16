"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingRequests } from "@/lib/api/clientApi";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// У /auth/me немає ролі. Персонал визначаємо за тим, чи бекенд віддає
// список запитів (решті він відповідає 403 STAFF_ONLY)
export const useIsStaff = () => {
  const { data: user } = useCurrentUser();

  const { isSuccess } = useQuery({
    queryKey: ["staff", "access", user?.id],
    queryFn: () => getBookingRequests(0, 1),
    enabled: Boolean(user),
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  return Boolean(user) && isSuccess;
};
