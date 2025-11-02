import { useState, useCallback, useRef } from "react";
import { useAutocomplete } from "./useAPI";
import { QuillEditorRef } from "./editorTypes";

export interface LLMAutocompleteState {
  isActive: boolean;
  suggestion: string;
  isLoading: boolean;
  error: string | null;
}

export interface UseLLMAutocompleteProps {
  quillRef: React.RefObject<QuillEditorRef>;
}

export function useLLMAutocomplete({ quillRef }: UseLLMAutocompleteProps): {
  state: LLMAutocompleteState;
  handleTabPress: () => void;
  handleEscapePress: () => void;
  cleanup: () => void;
} {
  const [state, setState] = useState<LLMAutocompleteState>({
    isActive: false,
    suggestion: "",
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const justAcceptedRef = useRef<boolean>(false);
  const autocompleteMutation = useAutocomplete();

  const getContext = useCallback(() => {
    if (!quillRef.current) return "";

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) return "";

    const textBeforeCursor = quill.getText(0, selection.index);

    const sentenceEndings = /[.!?]+/;
    const sentences = textBeforeCursor
      .split(sentenceEndings)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

    const contextSentences = sentences.slice(0, -1);

    return contextSentences
      .map(sentence => {
        const hasEnding = /[.!?]$/.test(sentence);
        return hasEnding ? sentence : sentence + ".";
      })
      .join(" ")
      .trim();
  }, [quillRef]);

  const getCurrentSentence = useCallback(() => {
    if (!quillRef.current) return "";

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) return "";

    const textBeforeCursor = quill.getText(0, selection.index);

    const sentenceEndings = /[.!?]+/;
    const sentences = textBeforeCursor.split(sentenceEndings);
    const currentSentence = sentences[sentences.length - 1] || "";

    const cleanedSentence = currentSentence.trim();

    if (cleanedSentence.length < 2) {
      return "";
    }

    return cleanedSentence;
  }, [quillRef]);

  const shouldAddSpace = useCallback(() => {
    if (!quillRef.current) return false;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) return false;

    const allText = quill.getText();
    const cursorIndex = selection.index;

    // Check character before cursor
    const charBefore = cursorIndex > 0 ? allText[cursorIndex - 1] : "";
    // Check character after cursor
    const charAfter = cursorIndex < allText.length ? allText[cursorIndex] : "";

    // Don't add space if:
    // 1. Cursor is at start of text
    // 2. Previous character is already whitespace
    // 3. Next character is already whitespace or punctuation
    if (cursorIndex === 0 || /\s/.test(charBefore)) {
      return false;
    }

    if (/[\s.,!?;:]/.test(charAfter)) {
      return false;
    }

    // Add space if we're at the end of a word (after non-whitespace)
    return /\S/.test(charBefore);
  }, [quillRef]);

  const insertGreySuggestion = useCallback(
    (suggestion: string, expectedCursorIndex: number) => {
      if (!quillRef.current) {
        return false;
      }

      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();

      if (!selection) {
        return false;
      }

      // Validate that cursor hasn't moved since we started generating
      if (selection.index !== expectedCursorIndex) {
        return false;
      }

      const suggestionText = shouldAddSpace() ? " " + suggestion : suggestion;

      quill.insertText(selection.index, suggestionText, {
        color: "#666666",
        background: "rgba(255, 255, 255, 0.1)",
      });

      quill.setSelection(selection.index, 0);
      return true;
    },
    [quillRef, shouldAddSpace]
  );

  const generateSuggestion = useCallback(async () => {
    if (!quillRef.current) {
      return;
    }

    const quill = quillRef.current.getEditor();
    const initialSelection = quill.getSelection();

    if (!initialSelection) {
      return;
    }

    const initialCursorIndex = initialSelection.index;

    const context = getContext();
    const currentSentence = getCurrentSentence();

    if (!currentSentence) {
      setState(prev => ({
        ...prev,
        error: "Please type at least a few words to get a suggestion",
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const result = await autocompleteMutation.mutateAsync({
        context,
        currentSentence,
        maxTokens: 50,
      });

      if (result.suggestion && result.suggestion.trim().length > 0) {
        const suggestionText = shouldAddSpace()
          ? " " + result.suggestion
          : result.suggestion;

        // Try to insert the suggestion
        const insertionSuccess = insertGreySuggestion(
          result.suggestion,
          initialCursorIndex
        );

        if (insertionSuccess) {
          setState(prev => ({
            ...prev,
            isActive: true,
            suggestion: suggestionText,
            isLoading: false,
            error: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isActive: false,
            suggestion: "",
            isLoading: false,
            error: "Cursor moved during suggestion generation",
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "No suggestion received from the AI",
        }));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return;
      }

      let errorMessage = "Failed to generate suggestion";
      if (error instanceof Error) {
        if (
          error.message?.includes("network") ||
          error.message?.includes("fetch")
        ) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message?.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message?.includes("rate limit")) {
          errorMessage = "Too many requests. Please wait a moment.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [
    quillRef,
    getContext,
    getCurrentSentence,
    autocompleteMutation,
    insertGreySuggestion,
    shouldAddSpace,
  ]);

  const acceptSuggestion = useCallback(() => {
    if (!quillRef.current || !state.isActive) {
      return;
    }

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) {
      return;
    }

    const text = quill.getText(0, quill.getText(0, 10000).length);

    const suggestionIndex = text.indexOf(state.suggestion);

    if (suggestionIndex !== -1) {
      quill.formatText(suggestionIndex, state.suggestion.length, {
        color: "#fafafa",
        background: null,
      });

      const newCursorPosition = suggestionIndex + state.suggestion.length;
      quill.setSelection(newCursorPosition, 0);
    }

    justAcceptedRef.current = true;

    setState(prev => ({
      ...prev,
      isActive: false,
      suggestion: "",
      error: null,
      isLoading: false,
    }));

    setTimeout(() => {
      justAcceptedRef.current = false;
    }, 100);
  }, [quillRef, state.isActive, state.suggestion]);

  const cancelSuggestion = useCallback(() => {
    if (!quillRef.current || !state.isActive) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) return;

    const text = quill.getText(0, quill.getText(0, 10000).length);

    const suggestionIndex = text.indexOf(state.suggestion);

    if (suggestionIndex !== -1) {
      quill.deleteText(suggestionIndex, state.suggestion.length);
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      suggestion: "",
      error: null,
    }));
  }, [quillRef, state.isActive, state.suggestion]);

  const handleTabPress = useCallback(() => {
    if (justAcceptedRef.current) {
      return;
    }

    if (state.isLoading) {
      return;
    }

    if (state.isActive) {
      acceptSuggestion();
    } else {
      generateSuggestion();
    }
  }, [state.isActive, state.isLoading, acceptSuggestion, generateSuggestion]);

  const handleEscapePress = useCallback(() => {
    if (state.isActive) {
      cancelSuggestion();
    }
  }, [state.isActive, cancelSuggestion]);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    state,
    handleTabPress,
    handleEscapePress,
    cleanup,
  };
}
