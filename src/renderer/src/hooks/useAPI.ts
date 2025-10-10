import { useMutation } from "@tanstack/react-query";
import {
  apiClient,
  API_ENDPOINTS,
  type AutocompleteRequest,
  type AutocompleteResponse,
  type TransformRequest,
  type TransformResponse,
} from "@renderer/lib/api";
import { useAuthContext } from "@renderer/contexts/AuthContext";

export function useAutocomplete() {
  const { userToken } = useAuthContext();

  return useMutation<AutocompleteResponse, Error, AutocompleteRequest>({
    mutationFn: async (data) => {
      apiClient.setAuthToken(userToken);

      return await apiClient.post<AutocompleteResponse>(
        API_ENDPOINTS.AUTOCOMPLETE,
        data,
      );
    },
    gcTime: 0,
    staleTime: 0,
  });
}

export function useTransform() {
  const { userToken } = useAuthContext();

  return useMutation<TransformResponse, Error, TransformRequest>({
    mutationFn: async (data) => {
      // Set the auth token for this request
      apiClient.setAuthToken(userToken);

      return apiClient.post<TransformResponse>(API_ENDPOINTS.TRANSFORM, data);
    },
    gcTime: 0,
    staleTime: 0,
  });
}

export function useAPI() {
  return {
    autocomplete: useAutocomplete(),
    transform: useTransform(),
  };
}
