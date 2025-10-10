interface Window {
  api: {
    notifyRouteChange: (route: string) => void;
    startGoogleAuth: () => Promise<{ success: boolean; error?: string }>;
    checkAuthStatus: () => Promise<{
      authenticated: boolean;
      user?: { email: string; token?: string };
      timedOut?: boolean;
    }>;
    onAuthSuccess: (
      callback: (userData: { email: string; token?: string }) => void,
    ) => () => void;
    // Add other API methods as needed
  };
}
