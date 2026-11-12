// Запити з браузера йдуть на свій Next-сервер (/api/v1), а не напряму на бекенд.
// Шляхи збігаються з бекендом один в один — так cookie сесії працюють без змін.

import axios, { isAxiosError } from "axios";
import type { ApiError } from "@/types/api";
import type { User } from "@/types/user";
import type {
  Dish,
  DishCategory,
  DishDetails,
  DishPage,
  DishSort,
} from "@/types/dish";
import type { Location, LocationDetails } from "@/types/location";
import type { Booking, InvitePreview, TablePage } from "@/types/booking";

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

export const getDish = async (id: string): Promise<DishDetails> => {
  const { data } = await nextServer.get<DishDetails>(
    `/menu/dishes/${encodeURIComponent(id)}`,
  );
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

export const getLocation = async (id: string): Promise<LocationDetails> => {
  const { data } = await nextServer.get<LocationDetails>(
    `/locations/${encodeURIComponent(id)}`,
  );
  return data;
};

// ===== Bookings =====

export interface SearchTablesParams {
  date: string; // YYYY-MM-DD
  party_size: number;
  location_id?: string;
  time?: string; // HH:MM, один з кроків сітки
}

export const searchTables = async (
  params: SearchTablesParams,
): Promise<TablePage> => {
  const { data } = await nextServer.get<TablePage>("/bookings/tables", {
    params: { ...params, limit: 50 },
  });
  return data;
};

export interface CreateBookingParams {
  table_id: string;
  starts_at: string; // як у слоті бекенда, з поясом
  party_size: number;
}

export const createBooking = async (
  params: CreateBookingParams,
): Promise<Booking> => {
  const { data } = await nextServer.post<Booking>("/bookings", params);
  return data;
};

export const getBooking = async (bookingId: string): Promise<Booking> => {
  const { data } = await nextServer.get<Booking>(
    `/bookings/${encodeURIComponent(bookingId)}`,
  );
  return data;
};

export const getInviteCode = async (bookingId: string): Promise<string> => {
  const { data } = await nextServer.get<{ code: string }>(
    `/bookings/${encodeURIComponent(bookingId)}/invite`,
  );
  return data.code;
};

// ===== Invites =====

export const getInvite = async (code: string): Promise<InvitePreview> => {
  const { data } = await nextServer.get<InvitePreview>(
    `/invites/${encodeURIComponent(code)}`,
  );
  return data;
};

// name — лише для гостя без акаунта (до 50 символів)
export const joinInvite = async (
  code: string,
  name?: string,
): Promise<Booking> => {
  const { data } = await nextServer.post<Booking>(
    `/invites/${encodeURIComponent(code)}/join`,
    name ? { name } : {},
  );
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
