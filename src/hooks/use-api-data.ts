import {
  cancelGameRegistration,
  cancelWaitlistEntry,
  createBooking,
  createGame,
  fetchBookings,
  fetchCatalog,
  fetchGames,
  registerForGame,
} from "@/lib/api";
import type {
  CreateBookingInput,
  CreateGameInput,
  ParticipantInput,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const queryKeys = {
  catalog: ["catalog"] as const,
  bookings: ["bookings"] as const,
  games: ["games"] as const,
};

export function useCatalogQuery() {
  return useQuery({
    queryKey: queryKeys.catalog,
    queryFn: fetchCatalog,
  });
}

export function useBookingsQuery() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: fetchBookings,
  });
}

export function useGamesQuery() {
  return useQuery({
    queryKey: queryKeys.games,
    queryFn: fetchGames,
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingInput) => createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

export function useCreateGameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGameInput) => createGame(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}

export function useRegisterForGameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, payload }: { gameId: string; payload: ParticipantInput }) =>
      registerForGame(gameId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
    },
  });
}

export function useCancelGameRegistrationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, name }: { gameId: string; name: string }) =>
      cancelGameRegistration(gameId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
    },
  });
}

export function useCancelWaitlistEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gameId, name }: { gameId: string; name: string }) =>
      cancelWaitlistEntry(gameId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
    },
  });
}
