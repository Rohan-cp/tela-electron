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
import { useAuthContext } from "@renderer/contexts/AuthContext";

// Autocomplete API hook
export function useAutocomplete() {
  const { userToken } = useAuthContext();
  
  return useMutation<AutocompleteResponse, Error, AutocompleteRequest>({
    mutationFn: async (data) => {
      // Set the auth token for this request
      apiClient.setAuthToken(userToken);
      
      return await apiClient.post<AutocompleteResponse>(
        API_ENDPOINTS.AUTOCOMPLETE,
        data,
      );
    },
    // Don't cache autocomplete results since they're contextual
    gcTime: 0,
    staleTime: 0,
  });
}

// Transform API hook
export function useTransform() {
  const { userToken } = useAuthContext();
  
  return useMutation<TransformResponse, Error, TransformRequest>({
    mutationFn: async (data) => {
      // Set the auth token for this request
      apiClient.setAuthToken(userToken);
      
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
