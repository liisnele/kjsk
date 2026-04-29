import type {
  Booking,
  CatalogResponse,
  OpenGame,
  SkillLevel,
} from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
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
