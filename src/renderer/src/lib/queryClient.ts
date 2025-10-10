import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

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
