import { QueryClient } from "@tanstack/react-query";

// Create a client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Retry failed requests 2 times
      retry: 2,
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  autocomplete: {
    all: ["autocomplete"] as const,
    suggestion: (context: string, currentSentence: string) =>
      ["autocomplete", "suggestion", context, currentSentence] as const,
  },
  transform: {
    all: ["transform"] as const,
    text: (text: string, transformation: string) =>
      ["transform", "text", text, transformation] as const,
  },
} as const;
