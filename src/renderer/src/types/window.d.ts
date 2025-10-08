interface Window {
  api: {
    notifyRouteChange: (route: string) => void;
    startGoogleAuth: () => Promise<{ success: boolean; error?: string }>;
    checkAuthStatus: () => Promise<{
      authenticated: boolean;
      user?: any;
      timedOut?: boolean;
    }>;
    onAuthSuccess: (callback: (userData: any) => void) => () => void;
    // Add other API methods as needed
  };
}
