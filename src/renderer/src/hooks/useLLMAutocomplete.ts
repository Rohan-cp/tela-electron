import { useState, useCallback, useRef } from "react";
import { useAutocomplete } from "./useAPI";

export interface LLMAutocompleteState {
  isActive: boolean;
  suggestion: string;
  isLoading: boolean;
  error: string | null;
}

export interface UseLLMAutocompleteProps {
  quillRef: React.RefObject<any>;
}

export function useLLMAutocomplete({ quillRef }: UseLLMAutocompleteProps) {
  const [state, setState] = useState<LLMAutocompleteState>({
    isActive: false,
    suggestion: "",
    isLoading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const justAcceptedRef = useRef<boolean>(false);
  const autocompleteMutation = useAutocomplete();

  // Debug: Log when the hook is initialized
  // console.log('🔧 useLLMAutocomplete hook initialized with quillRef:', !!quillRef.current)

  // Get context from the editor (previous sentences)
  const getContext = useCallback(() => {
    if (!quillRef.current) return "";

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) return "";

    // Get all text before the current cursor position
    const textBeforeCursor = quill.getText(0, selection.index);

    // Split into sentences and get all previous sentences as context
    const sentenceEndings = /[.!?]+/;
    const sentences = textBeforeCursor
      .split(sentenceEndings)
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());

    // Get all previous sentences (not just the last 3) for better context
    const contextSentences = sentences.slice(0, -1); // Exclude the current incomplete sentence

    // Join with proper sentence endings and clean up
    return contextSentences
      .map((sentence) => {
        // Add proper sentence ending if it doesn't have one
        const hasEnding = /[.!?]$/.test(sentence);
        return hasEnding ? sentence : sentence + ".";
      })
      .join(" ")
      .trim();
  }, [quillRef]);

  // Get current incomplete sentence
  const getCurrentSentence = useCallback(() => {
    if (!quillRef.current) return "";

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) return "";

    const textBeforeCursor = quill.getText(0, selection.index);

    // More robust sentence detection - look for sentence boundaries
    const sentenceEndings = /[.!?]+/;
    const sentences = textBeforeCursor.split(sentenceEndings);
    const currentSentence = sentences[sentences.length - 1] || "";

    // Clean up the sentence and ensure it's not empty
    const cleanedSentence = currentSentence.trim();

    // If the sentence is too short or just whitespace, return empty
    if (cleanedSentence.length < 2) {
      return "";
    }

    return cleanedSentence;
  }, [quillRef]);

  // Insert suggestion as grey text
  const insertGreySuggestion = useCallback(
    (suggestion: string) => {
      if (!quillRef.current) {
        console.log("❌ No quill ref available for inserting suggestion");
        return;
      }

      const quill = quillRef.current.getEditor();
      const selection = quill.getSelection();

      if (!selection) {
        console.log("❌ No selection available for inserting suggestion");
        return;
      }

      console.log(
        "📝 INSERTING SUGGESTION:",
        suggestion,
        "at position:",
        selection.index,
      );
      console.log("📝 Current text before insertion:", quill.getText());

      // Insert the suggestion with grey color (add space before suggestion)
      const suggestionWithSpace = " " + suggestion;
      quill.insertText(selection.index, suggestionWithSpace, {
        color: "#666666", // Darker grey for better contrast
        background: "rgba(255, 255, 255, 0.1)", // Subtle background to make it more visible
      });

      console.log("📝 Text after insertion:", quill.getText());
      console.log("📝 HTML after insertion:", quill.root.innerHTML);

      // Position cursor BEFORE the suggestion (at the original cursor position)
      quill.setSelection(selection.index, 0);
      console.log(
        "✅ Suggestion inserted and cursor positioned at:",
        selection.index,
      );
    },
    [quillRef],
  );

  // Call backend for LLM autocomplete using TanStack Query
  const generateSuggestion = useCallback(async () => {
    if (!quillRef.current) {
      return;
    }

    const context = getContext();
    const currentSentence = getCurrentSentence();

    if (!currentSentence) {
      setState((prev) => ({
        ...prev,
        error: "Please type at least a few words to get a suggestion",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Use TanStack Query mutation
      const result = await autocompleteMutation.mutateAsync({
        context,
        currentSentence,
        maxTokens: 50,
      });

      if (result.suggestion && result.suggestion.trim().length > 0) {
        console.log("✅ Received suggestion:", result.suggestion);
        const suggestionWithSpace = " " + result.suggestion;
        setState((prev) => ({
          ...prev,
          isActive: true,
          suggestion: suggestionWithSpace,
          isLoading: false,
          error: null,
        }));

        // Insert the suggestion as grey text
        insertGreySuggestion(result.suggestion);
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "No suggestion received from the AI",
        }));
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return;
      }

      console.error("💥 Error generating suggestion:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to generate suggestion";
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

      setState((prev) => ({
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
  ]);

  // Accept the suggestion (convert grey to normal text)
  const acceptSuggestion = useCallback(() => {
    if (!quillRef.current || !state.isActive) {
      return;
    }

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) {
      return;
    }

    // Find the grey text and convert it to normal text
    const text = quill.getText();

    // Find the grey text by looking for the suggestion
    const suggestionIndex = text.indexOf(state.suggestion);
    if (suggestionIndex !== -1) {
      console.log("✅ ACCEPTING suggestion at index:", suggestionIndex);

      // Convert grey text to normal white text
      quill.formatText(suggestionIndex, state.suggestion.length, {
        color: "#fafafa", // Set to normal text color (textPrimary)
        background: null, // Remove background
      });

      // Move cursor to the end of the accepted text
      const newCursorPosition = suggestionIndex + state.suggestion.length;
      quill.setSelection(newCursorPosition, 0);
      console.log(
        "✅ Suggestion accepted, cursor moved to:",
        newCursorPosition,
      );
    } else {
      // Fallback: if we can't find the suggestion text, just clear the state
      console.warn(
        "❌ Could not find suggestion text to accept:",
        state.suggestion,
      );
    }

    // Set flag to prevent immediate re-triggering
    justAcceptedRef.current = true;

    // Clear the suggestion state IMMEDIATELY to prevent re-triggering
    setState((prev) => ({
      ...prev,
      isActive: false,
      suggestion: "",
      error: null,
      isLoading: false,
    }));

    // Reset the flag after a short delay
    setTimeout(() => {
      justAcceptedRef.current = false;
    }, 100);
  }, [quillRef, state.isActive, state.suggestion]);

  // Cancel the suggestion
  const cancelSuggestion = useCallback(() => {
    if (!quillRef.current || !state.isActive) return;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();

    if (!selection) return;

    // Find and remove the grey suggestion text
    const text = quill.getText();

    const suggestionIndex = text.indexOf(state.suggestion);
    if (suggestionIndex !== -1) {
      quill.deleteText(suggestionIndex, state.suggestion.length);
    } else {
      // Fallback: if we can't find the suggestion text, just clear the state
      console.warn("Could not find suggestion text to cancel");
    }

    // Clear the suggestion state
    setState((prev) => ({
      ...prev,
      isActive: false,
      suggestion: "",
      error: null,
    }));
  }, [quillRef, state.isActive, state.suggestion]);

  // Handle tab key press
  const handleTabPress = useCallback(() => {
    console.log("🎯 Tab pressed! Current state:", {
      isActive: state.isActive,
      isLoading: state.isLoading,
      justAccepted: justAcceptedRef.current,
    });

    // Prevent immediate re-triggering after acceptance
    if (justAcceptedRef.current) {
      return;
    }

    if (state.isActive) {
      // Second tab - accept the suggestion
      acceptSuggestion();
    } else {
      // First tab - generate suggestion
      generateSuggestion();
    }
  }, [
    state.isActive,
    state.isLoading,
    state.suggestion,
    acceptSuggestion,
    generateSuggestion,
  ]);

  // Handle escape key press
  const handleEscapePress = useCallback(() => {
    if (state.isActive) {
      cancelSuggestion();
    }
  }, [state.isActive, cancelSuggestion]);

  // Cleanup on unmount
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
