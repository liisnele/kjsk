import type {
  AdminBooking,
  AdminUser,
  Booking,
  CatalogResponse,
  OpenGame,
  SkillLevel,
} from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const getJsonHeaders = (init?: RequestInit) => ({
  ...(init?.body ? { "Content-Type": "application/json" } : {}),
  ...(init?.headers ?? {}),
});

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: getJsonHeaders(init),
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function apiFetchOptional<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: getJsonHeaders(init),
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const text = await response.text();

  return (text ? JSON.parse(text) : {}) as T;
}

export const fetchCatalog = () => apiFetch<CatalogResponse>("/api/catalog");
export const fetchBookings = () => apiFetch<Booking[]>("/api/bookings");
export const fetchGames = () => apiFetch<OpenGame[]>("/api/games");

export interface CreateBookingInput {
  sportId: string;
  centerId: string;
  courtId?: string;
  date: string;
  time: string;
  duration: number;
  name: string;
  email: string;
  phone: string;
  participants: number;
  status?: "confirmed" | "cancelled";
  note?: string;
  equipment?: string[];
}

export const createBooking = (payload: CreateBookingInput) =>
  apiFetch<Booking>("/api/bookings", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      equipment: payload.equipment ?? [],
      status: payload.status ?? "confirmed",
      note: payload.note ?? "",
    }),
  });

export interface CreateGameInput {
  sportId: string;
  centerId: string;
  courtId: string;
  date: string;
  time: string;
  duration: number;
  description: string;
  level: SkillLevel;
  minPlayers: number;
  maxPlayers: number;
  creatorName: string;
  equipment: string[];
}

export const createGame = (payload: CreateGameInput) =>
  apiFetch<OpenGame>("/api/games", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export interface ParticipantInput {
  name: string;
  email: string;
  phone: string;
}

export const registerForGame = (gameId: string, payload: ParticipantInput) =>
  apiFetch<OpenGame>(`/api/games/${gameId}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const cancelGameRegistration = (gameId: string, name: string) =>
  apiFetch<OpenGame>(`/api/games/${gameId}/register?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
  });

export const cancelWaitlistEntry = (gameId: string, name: string) =>
  apiFetch<OpenGame>(`/api/games/${gameId}/waitlist?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
  });

export const fetchAdminMe = () =>
  apiFetch<{ user: AdminUser }>("/api/admin/me");

export const signInAdmin = (payload: { username: string; password: string }) =>
  apiFetchOptional<{ user: AdminUser }>("/api/auth/sign-in/username", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const signOutAdmin = () =>
  apiFetchOptional<{ success?: boolean }>("/api/admin/logout", {
    method: "POST",
  });

export const fetchAdminBookings = (filters?: {
  status?: string;
  date?: string;
  search?: string;
}) => {
  const params = new URLSearchParams();

  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.search) params.set("search", filters.search);

  return apiFetch<AdminBooking[]>(`/api/admin/bookings${params.size ? `?${params}` : ""}`);
};

export const cancelAdminBooking = (bookingId: string) =>
  apiFetch<AdminBooking>(`/api/admin/bookings/${bookingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "cancelled" }),
  });
