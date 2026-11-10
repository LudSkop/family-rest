// Запити з браузера йдуть на свій Next-сервер (/api/v1), а не напряму на бекенд.
// Шляхи збігаються з бекендом один в один — так cookie сесії працюють без змін.

import axios, { isAxiosError } from "axios";
import type { ApiError } from "@/types/api";
import type { User } from "@/types/user";
import type { Dish, DishCategory, DishPage, DishSort } from "@/types/dish";
import type { Location } from "@/types/location";

const nextServer = axios.create({
  baseURL: "/api/v1",
});

// ===== Dishes & locations =====

export interface GetDishesParams {
  sort?: DishSort;
  category?: DishCategory;
  limit?: number;
  offset?: number;
}

export const getDishes = async (
  params: GetDishesParams = {},
): Promise<DishPage> => {
  const { data } = await nextServer.get<DishPage>("/menu/dishes", { params });
  return data;
};

export const getPopularDishes = async (): Promise<Dish[]> => {
  const { items } = await getDishes({ sort: "POPULAR", limit: 4 });
  return items;
};

export const getLocations = async (): Promise<Location[]> => {
  const { data } = await nextServer.get<Location[]>("/locations");
  return data;
};

// ===== Session =====

export interface LoginParams {
  email: string;
  password: string;
}

export const login = async (params: LoginParams): Promise<User> => {
  const { data } = await nextServer.post<User>("/auth/login", params);
  return data;
};

// Поточний користувач за cookie сесії; без сесії (401) — null
export const getMe = async (): Promise<User | null> => {
  try {
    const { data } = await nextServer.get<User>("/auth/me");
    return data;
  } catch (error) {
    if (getApiStatus(error) === 401) return null;
    throw error;
  }
};

export const logout = async () => {
  await nextServer.post("/auth/logout");
};

// ===== Registration =====

export interface RegisterParams {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export const register = async (
  params: RegisterParams,
): Promise<RegisterResponse> => {
  const { data } = await nextServer.post<RegisterResponse>(
    "/auth/register",
    params,
  );
  return data;
};

// ===== Email verification =====

export interface VerifyEmailParams {
  email: string;
  code: string;
}

export const verifyEmail = async (params: VerifyEmailParams) => {
  await nextServer.post("/auth/verify-email", params);
};

export const resendCode = async (email: string) => {
  await nextServer.post("/auth/resend-code", { email });
};

// ===== Password reset =====

export const requestPasswordReset = async (email: string) => {
  await nextServer.post("/auth/password-reset/request", { email });
};

export const verifyPasswordResetCode = async (params: VerifyEmailParams) => {
  await nextServer.post("/auth/password-reset/verify-code", params);
};

export interface ConfirmPasswordResetParams {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export const confirmPasswordReset = async (
  params: ConfirmPasswordResetParams,
) => {
  await nextServer.post("/auth/password-reset/confirm", params);
};

// ===== Errors =====

interface ValidationErrorBody {
  detail: { msg: string }[];
}

// Бекенд віддає помилки як { code, message },
// а помилки валідації (422) — у форматі FastAPI { detail: [...] }
export const getApiError = (error: unknown): ApiError | null => {
  if (!isAxiosError(error) || !error.response) return null;

  const data = error.response.data as Partial<ApiError & ValidationErrorBody>;

  if (data?.code) {
    return data as ApiError;
  }

  if (Array.isArray(data?.detail)) {
    return {
      code: "VALIDATION_ERROR",
      message: data.detail[0]?.msg ?? "Invalid data",
    };
  }

  return null;
};

export const getApiStatus = (error: unknown) =>
  isAxiosError(error) ? error.response?.status : undefined;
