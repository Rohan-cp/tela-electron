import { useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuthContext } from '../contexts/AuthContext';

export const useApiClient = () => {
  const { userToken } = useAuthContext();

  useEffect(() => {
    apiClient.setAuthToken(userToken);
  }, [userToken]);

  return apiClient;
};
