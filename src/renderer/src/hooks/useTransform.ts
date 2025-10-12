import { useState, useCallback } from "react";
import { Suggestion } from "@renderer/components/TextEditor";
import { apiClient } from "@renderer/lib/api";
import { useAuthContext } from "@renderer/contexts/AuthContext";
import { QuillEditorRef } from "./editorTypes";

export interface UseTransformProps {
  quillRef: React.RefObject<QuillEditorRef>;
  transformSelection: { index: number; length: number } | null;
  setSuggestion: (suggestion: Suggestion | null) => void;
  setShowToolbar: (show: boolean) => void;
}

export function useTransform({
  quillRef,
  transformSelection,
  setSuggestion,
  setShowToolbar,
}: UseTransformProps): {
  showLoader: boolean;
  originalText: string;
  suggestedText: string;
  transformError: string | null;
  retryCount: number;
  isTransformModalOpen: boolean;
  modalOriginalText: string;
  modalTransformedText: string;
  handleSubmitPromptToTransform: (
    userTransformPrompt: string,
    isRetry?: boolean,
  ) => Promise<void>;
  handleTransformAccept: (transformedText: string) => void;
  handleTransformReject: () => void;
  handleTransformModalClose: () => void;
} {
  const { userToken } = useAuthContext();
  const [showLoader, setShowLoader] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [suggestedText, setSuggestedText] = useState("");
  const [transformError, setTransformError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransformModalOpen, setIsTransformModalOpen] = useState(false);
  const [modalOriginalText, setModalOriginalText] = useState("");
  const [modalTransformedText, setModalTransformedText] = useState("");

  const handleSubmitPromptToTransform = useCallback(
    async (userTransformPrompt: string, isRetry: boolean = false) => {
      if (!quillRef.current) return;

      const quill = quillRef.current.getEditor();

      if (!transformSelection || transformSelection.length === 0) return;

      if (!quill) {
        throw new Error("Quill editor not available");
      }

      const originalText = quill.getText(
        transformSelection.index,
        transformSelection.length,
      );

      setTransformError(null);
      setShowLoader(true);

      try {
        apiClient.setAuthToken(userToken);

        const { transformedText, success } = await apiClient.post<{
          transformedText: string;
          success: boolean;
        }>("/api/transform", {
          originalText,
          userTransformPrompt,
        });

        if (!success || !transformedText) {
          throw new Error(
            "No transformation was generated. Please try a different prompt.",
          );
        }

        const cleanedTransformedText = transformedText.replace(/^"|"$/g, "");

        setOriginalText(originalText);
        setSuggestedText(cleanedTransformedText);

        setSuggestion({
          currentWord: originalText,
          suggestion: cleanedTransformedText,
        });

        setModalOriginalText(originalText);
        setModalTransformedText(cleanedTransformedText);
        setIsTransformModalOpen(true);
        setShowToolbar(false);
        setRetryCount(0);
      } catch (error: unknown) {
        console.error("Error transforming text:", error);

        let errorMessage = "Failed to transform text. Please try again.";

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "Request timed out. Please try again.";
          } else if (error.message) {
            errorMessage = error.message;
          }
        }

        setTransformError(errorMessage);

        if (
          !isRetry &&
          retryCount < 2 &&
          error instanceof Error &&
          (error.name === "TypeError" ||
            error.message.includes("fetch") ||
            error.message.includes("network"))
        ) {
          setRetryCount((prev) => prev + 1);
          setTimeout(
            () => {
              handleSubmitPromptToTransform(userTransformPrompt, true);
            },
            1000 * (retryCount + 1),
          );
        }
      } finally {
        setShowLoader(false);
      }
    },
    [
      quillRef,
      transformSelection,
      setSuggestion,
      setShowToolbar,
      retryCount,
      userToken,
    ],
  );

  const handleTransformAccept = useCallback(
    (transformedText: string) => {
      if (!quillRef.current || !transformSelection) return;

      const quill = quillRef.current.getEditor();

      if (!quill) {
        return;
      }

      quill.deleteText(transformSelection.index, transformSelection.length);
      quill.insertText(transformSelection.index, transformedText);
    },
    [quillRef, transformSelection],
  );

  const handleTransformReject = useCallback(() => {}, []);

  const handleTransformModalClose = useCallback(() => {
    setIsTransformModalOpen(false);
    setModalOriginalText("");
    setModalTransformedText("");
    setTransformError(null);
  }, []);

  return {
    showLoader,
    originalText,
    suggestedText,
    transformError,
    retryCount,
    isTransformModalOpen,
    modalOriginalText,
    modalTransformedText,
    handleSubmitPromptToTransform,
    handleTransformAccept,
    handleTransformReject,
    handleTransformModalClose,
  };
}
