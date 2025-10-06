import { useState, useCallback } from "react";
import { Suggestion } from "@renderer/components/TextEditor";

export interface UseTransformProps {
  quillRef: React.RefObject<any>;
  transformSelection: { index: number; length: number } | null;
  setSuggestion: (suggestion: Suggestion | null) => void;
  setShowToolbar: (show: boolean) => void;
}

export function useTransform({
  quillRef,
  transformSelection,
  setSuggestion,
  setShowToolbar,
}: UseTransformProps) {
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

      const originalText = quill.getText(
        transformSelection.index,
        transformSelection.length,
      );

      // Clear previous errors
      setTransformError(null);
      setShowLoader(true);

      try {
        const response = await fetch("http://localhost:3001/api/transform", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ originalText, userTransformPrompt }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle specific error cases
          if (response.status === 429) {
            const retryAfter = errorData.retryAfter || 60;
            throw new Error(
              `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
            );
          }

          if (response.status === 400) {
            throw new Error(
              errorData.error || "Invalid request. Please check your input.",
            );
          }

          if (response.status === 503) {
            throw new Error(
              "AI service is temporarily unavailable. Please try again later.",
            );
          }

          throw new Error(errorData.error || "Failed to transform text");
        }

        const { transformedText, success } = await response.json();

        if (!success || !transformedText) {
          throw new Error(
            "No transformation was generated. Please try a different prompt.",
          );
        }

        // Remove quotes from the transformedText and handle falsy values
        const cleanedTransformedText = transformedText.replace(/^"|"$/g, "");

        setOriginalText(originalText);
        setSuggestedText(cleanedTransformedText);

        setSuggestion({
          currentWord: originalText,
          suggestion: cleanedTransformedText,
        });

        // Open modal with the transformation
        setModalOriginalText(originalText);
        setModalTransformedText(cleanedTransformedText);
        setIsTransformModalOpen(true);
        setShowToolbar(false); // Close the floating toolbar
        setRetryCount(0); // Reset retry count on success
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

        // Auto-retry for network errors (up to 2 times)
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
          ); // Exponential backoff
        }
      } finally {
        setShowLoader(false);
      }
    },
    [quillRef, transformSelection, setSuggestion, setShowToolbar, retryCount],
  );

  const handleTransformAccept = useCallback(
    (transformedText: string) => {
      if (!quillRef.current || !transformSelection) return;

      const quill = quillRef.current.getEditor();
      quill.deleteText(transformSelection.index, transformSelection.length);
      quill.insertText(transformSelection.index, transformedText);

      // Clear the selection
      // Note: setTransformSelection is not available in this scope
    },
    [quillRef, transformSelection],
  );

  const handleTransformReject = useCallback(() => {
    // Just close the modal, no changes needed
    // Note: setTransformSelection is not available in this scope
  }, []);

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
