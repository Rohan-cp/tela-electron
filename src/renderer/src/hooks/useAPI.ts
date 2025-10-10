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

export function useAutocomplete(): ReturnType<
  typeof useMutation<AutocompleteResponse, Error, AutocompleteRequest>
> {
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
  });
}

export function useTransform(): ReturnType<
  typeof useMutation<TransformResponse, Error, TransformRequest>
> {
  const { userToken } = useAuthContext();

  return useMutation<TransformResponse, Error, TransformRequest>({
    mutationFn: async (data) => {
      apiClient.setAuthToken(userToken);

      return apiClient.post<TransformResponse>(API_ENDPOINTS.TRANSFORM, data);
    },
    gcTime: 0,
  });
}

export function useAPI(): {
  autocomplete: ReturnType<typeof useAutocomplete>;
  transform: ReturnType<typeof useTransform>;
} {
  return {
    autocomplete: useAutocomplete(),
    transform: useTransform(),
  };
}
