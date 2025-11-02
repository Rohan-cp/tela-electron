import { useCallback, useEffect } from "react";
import { EditorStats } from "@renderer/hooks";
import { QuillEditorRef } from "@renderer/hooks/editorTypes";

export interface ContentHandlerProps {
  setTextValue: (content: string) => void;
  updateFileStats: () => void;
  handleUpdatingSelectedStats: (
    range: { index: number; length: number },
    editor: { getText: () => string }
  ) => void;
  getEditorStats: (editor: { getText: () => string }) => EditorStats;
  setCharCount: (count: number) => void;
  setWordCount: (count: number) => void;
  setLineCount: (count: number) => void;
  quillRef: React.RefObject<QuillEditorRef>;
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
    editor: {
      getText: () => string;
      getSelection?: () => { index: number; length: number } | null;
    }
  ) => void;
} {
  const handleChange = useCallback(
    (
      content: string,
      _delta: unknown,
      _source: unknown,
      editor: {
        getText: () => string;
        getSelection?: () => { index: number; length: number } | null;
      }
    ) => {
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
      if (editor.getSelection) {
        const selection = editor.getSelection();
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
    ]
  );

  // Set up key event listeners on the Quill editor
  useEffect(() => {
    if (!quillRef.current) {
      return;
    }

    const quill = quillRef.current.getEditor();
    if (!quill || !quill.root) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleTabPress();
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleEscapePress();
      }
    };

    const editorElement = quill.root;
    editorElement.addEventListener("keydown", handleKeyDown, true);

    return (): void => {
      editorElement.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleTabPress, handleEscapePress]);

  return { handleChange };
}
