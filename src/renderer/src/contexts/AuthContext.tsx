import {
  createContext,
  memo,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type ContextState = {
  isUserAuthenticated: boolean;
  setIsUserAuthenticated: (newState: boolean) => void;

  userEmail: string | null;
  setUserEmail: (newState: string | null) => void;

  userMode: UserMode;
  setUserMode: (newState: UserMode) => void;
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
  const [isUserAuthenticated, setIsUserAuthenticated] =
    useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userMode, setUserMode] = useState<UserMode>(UserMode.editor);

  const value = useMemo(
    () => ({
      isUserAuthenticated: isUserAuthenticated,
      setIsUserAuthenticated: setIsUserAuthenticated,
      userEmail: userEmail,
      setUserEmail: setUserEmail,
      userMode: userMode,
      setUserMode: setUserMode,
    }),
    [
      isUserAuthenticated,
      setIsUserAuthenticated,
      userEmail,
      setUserEmail,
      userMode,
      setUserMode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
});

AuthProvider.displayName = "AuthProvider";

export default AuthProvider;
