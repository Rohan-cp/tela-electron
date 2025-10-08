import { useCallback, useEffect } from "react";
import { EditorStats } from "@renderer/hooks";

interface QuillInstance {
  getEditor(): {
    getSelection(): { index: number; length?: number } | null;
    deleteText(index: number, length: number): void;
    insertText(
      index: number,
      text: string,
      format?: Record<string, unknown>,
    ): void;
    setSelection(index: number, length: number): void;
    formatText(
      index: number,
      length: number,
      format: Record<string, unknown>,
    ): void;
    getText(index?: number, length?: number): string;
    getLength(): number;
    root: HTMLElement;
  };
}

export interface ContentHandlerProps {
  setTextValue: (content: string) => void;
  updateFileStats: () => void;
  handleUpdatingSelectedStats: (range: unknown, editor: unknown) => void;
  getEditorStats: (editor: unknown) => EditorStats;
  setCharCount: (count: number) => void;
  setWordCount: (count: number) => void;
  setLineCount: (count: number) => void;
  quillRef: React.RefObject<QuillInstance>;
  handleTabPress: () => void;
  handleEscapePress: () => void;
}

export function useContentHandler({
  setTextValue,
  updateFileStats,
  handleUpdatingSelectedStats,
  getEditorStats,
  setCharCount,
  setWordCount,
  setLineCount,
  quillRef,
  handleTabPress,
  handleEscapePress,
}: ContentHandlerProps): {
  handleChange: (
    content: string,
    delta: unknown,
    source: unknown,
    editor: unknown,
  ) => void;
} {
  const handleChange = useCallback(
    (content: string, _delta: unknown, _source: unknown, editor: unknown) => {
      const newContent = content;

      setTextValue(newContent);

      // Always update file stats when content changes
      const stats = getEditorStats(editor);
      setCharCount(stats.charCount);
      setWordCount(stats.wordCount);
      setLineCount(stats.lineCount);

      // Update file tree and other stats
      updateFileStats();

      // If there's a selection, update the selected stats
      if (
        editor &&
        typeof editor === "object" &&
        editor !== null &&
        "getSelection" in editor
      ) {
        const selection = (
          editor as { getSelection: () => { length: number } | null }
        ).getSelection();
        if (selection && selection.length > 0) {
          handleUpdatingSelectedStats(selection, editor);
        }
      }
    },
    [
      setTextValue,
      getEditorStats,
      setCharCount,
      setWordCount,
      setLineCount,
      updateFileStats,
      handleUpdatingSelectedStats,
    ],
  );

  // Set up key event listeners on the Quill editor
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault(); // Prevent default tab behavior
        event.stopPropagation();
        event.stopImmediatePropagation(); // Stop other listeners from handling this event
        handleTabPress();
        return false;
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation(); // Stop other listeners from handling this event
        handleEscapePress();
        return false;
      }
    };

    const editorElement = quill.root;
    // Use capture phase to ensure this listener runs first
    editorElement.addEventListener("keydown", handleKeyDown, true);

    return () => {
      editorElement.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [quillRef, handleTabPress, handleEscapePress]);

  return { handleChange };
}
