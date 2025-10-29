import {
  createContext,
  memo,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type ContextState = {
  isFeedbackFormModalOpen: boolean;
  setIsFeedbackFormModalOpen: (newState: boolean) => void;
  isChangelogModalOpen: boolean;
  setIsChangelogModalOpen: (newState: boolean) => void;
  isKeyboardCommandsModalOpen: boolean;
  setIsKeyboardCommandsModalOpen: (newState: boolean) => void;
};

const ModalContext = createContext<ContextState | undefined>(undefined);

export const useModalContext = (): ContextState => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("Attempted to use ModalContext without a provider!");
  }
  return context;
};

type Props = { children: ReactNode };

const ModalProvider = memo(({ children }: Props) => {
  const [isFeedbackFormModalOpen, setIsFeedbackFormModalOpen] =
    useState<boolean>(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] =
    useState<boolean>(false);
  const [isKeyboardCommandsModalOpen, setIsKeyboardCommandsModalOpen] =
    useState<boolean>(false);

  const value = useMemo(
    () => ({
      isFeedbackFormModalOpen: isFeedbackFormModalOpen,
      setIsFeedbackFormModalOpen: setIsFeedbackFormModalOpen,
      isChangelogModalOpen: isChangelogModalOpen,
      setIsChangelogModalOpen: setIsChangelogModalOpen,
      isKeyboardCommandsModalOpen: isKeyboardCommandsModalOpen,
      setIsKeyboardCommandsModalOpen: setIsKeyboardCommandsModalOpen,
    }),
    [
      isFeedbackFormModalOpen,
      setIsFeedbackFormModalOpen,
      isChangelogModalOpen,
      setIsChangelogModalOpen,
      isKeyboardCommandsModalOpen,
      setIsKeyboardCommandsModalOpen,
    ]
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
});

ModalProvider.displayName = "ModalProvider";

export default ModalProvider;
