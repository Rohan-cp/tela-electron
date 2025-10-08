import { useMutation, useQuery } from "@tanstack/react-query";
import {
  apiClient,
  API_ENDPOINTS,
  type AutocompleteRequest,
  type AutocompleteResponse,
  type TransformRequest,
  type TransformResponse,
} from "@renderer/lib/api";
import { queryKeys } from "@renderer/lib/queryClient";

// Autocomplete API hook
export function useAutocomplete() {
  return useMutation<AutocompleteResponse, Error, AutocompleteRequest>({
    mutationFn: async (data) => {
      console.log(
        "🌐 Making API call to autocomplete endpoint with data:",
        data,
      );
      const result = await apiClient.post<AutocompleteResponse>(
        API_ENDPOINTS.AUTOCOMPLETE,
        data,
      );
      console.log("🌐 API response received:", result);
      return result;
    },
    // Don't cache autocomplete results since they're contextual
    gcTime: 0,
    staleTime: 0,
  });
}

// Transform API hook
export function useTransform() {
  return useMutation<TransformResponse, Error, TransformRequest>({
    mutationFn: async (data) => {
      return apiClient.post<TransformResponse>(API_ENDPOINTS.TRANSFORM, data);
    },
    // Don't cache transform results since they're contextual
    gcTime: 0,
    staleTime: 0,
  });
}

// Generic API hook for other endpoints
export function useAPI() {
  return {
    autocomplete: useAutocomplete(),
    transform: useTransform(),
  };
}
