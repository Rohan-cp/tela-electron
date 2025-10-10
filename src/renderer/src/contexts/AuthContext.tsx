import {
  createContext,
  memo,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

type ContextState = {
  isUserAuthenticated: boolean;
  setIsUserAuthenticated: (newState: boolean) => void;

  userEmail: string | null;
  setUserEmail: (newState: string | null) => void;

  userToken: string | null;
  setUserToken: (newState: string | null) => void;

  userMode: UserMode;
  setUserMode: (newState: UserMode) => void;

  logout: () => void;
};

export enum UserMode {
  editor,
  noteTaker,
}

const AuthContext = createContext<ContextState | undefined>(undefined);

export const useAuthContext = (): ContextState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Attempted to use AuthContext without a provider!");
  }
  return context;
};

type Props = { children: ReactNode };

const AuthProvider = memo(({ children }: Props) => {
  // Initialize state from localStorage if available
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(
    () => {
      const stored = localStorage.getItem("tela_auth_authenticated");
      return stored === "true";
    },
  );
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem("tela_auth_email");
  });
  const [userToken, setUserToken] = useState<string | null>(() => {
    return localStorage.getItem("tela_auth_token");
  });
  const [userMode, setUserMode] = useState<UserMode>(UserMode.editor);

  // Memoized wrapper functions that also update localStorage
  const setAuthenticated = useCallback((value: boolean) => {
    setIsUserAuthenticated(value);
    if (value) {
      localStorage.setItem("tela_auth_authenticated", "true");
    } else {
      localStorage.removeItem("tela_auth_authenticated");
    }
  }, []);

  const setEmail = useCallback((value: string | null) => {
    setUserEmail(value);
    if (value) {
      localStorage.setItem("tela_auth_email", value);
    } else {
      localStorage.removeItem("tela_auth_email");
    }
  }, []);

  const setToken = useCallback((value: string | null) => {
    setUserToken(value);
    if (value) {
      localStorage.setItem("tela_auth_token", value);
    } else {
      localStorage.removeItem("tela_auth_token");
    }
  }, []);

  const logout = useCallback(() => {
    setAuthenticated(false);
    setEmail(null);
    setToken(null);
  }, [setAuthenticated, setEmail, setToken]);

  const value = useMemo(
    () => ({
      isUserAuthenticated: isUserAuthenticated,
      setIsUserAuthenticated: setAuthenticated,
      userEmail: userEmail,
      setUserEmail: setEmail,
      userToken: userToken,
      setUserToken: setToken,
      userMode: userMode,
      setUserMode: setUserMode,
      logout: logout,
    }),
    [
      isUserAuthenticated,
      setAuthenticated,
      userEmail,
      setEmail,
      userToken,
      setToken,
      userMode,
      setUserMode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
});

AuthProvider.displayName = "AuthProvider";

export default AuthProvider;
