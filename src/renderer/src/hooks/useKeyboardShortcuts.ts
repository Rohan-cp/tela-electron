import { useEffect, useCallback } from "react";
import { QuillEditorRef } from "./editorTypes";

export interface UseKeyboardShortcutsProps {
  quillRef: React.RefObject<QuillEditorRef>;
  formatHeader: (level: number) => void;
  setTransformSelection: (
    selection: { index: number; length: number } | null,
  ) => void;
  setToolbarPosition: (position: { top: number; left: number }) => void;
  setShowToolbar: (show: boolean) => void;
  setIsTransformSelected: (selected: boolean) => void;
  setSelectedText: (text: string | null) => void;
  setIsChatAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useKeyboardShortcuts({
  quillRef,
  formatHeader,
  setTransformSelection,
  setToolbarPosition,
  setShowToolbar,
  setIsTransformSelected,
  setSelectedText,
  setIsChatAssistantOpen,
}: UseKeyboardShortcutsProps): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const selection = quill.getSelection();

      // Check for CMD+L for chat (should work regardless of selection)
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();

        if (selection && selection.length > 0) {
          const text = quill.getText(selection.index, selection.length);
          setSelectedText(text);
        } else {
          setSelectedText(null);
        }

        setIsChatAssistantOpen((prevState: boolean) => !prevState);
        return;
      }

      if (!selection || selection.length === 0) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();

        const bounds = quill.getBounds(selection.index, selection.length);
        if (!bounds) return;

        setTransformSelection({
          index: selection.index,
          length: selection.length,
        });

        setToolbarPosition({
          top: bounds.bottom + 10,
          left: bounds.left,
        });
        setShowToolbar(true);
        setIsTransformSelected(true);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        formatHeader(1);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "2") {
        e.preventDefault();
        formatHeader(2);
      }
    },
    [
      quillRef,
      formatHeader,
      setTransformSelection,
      setToolbarPosition,
      setShowToolbar,
      setIsTransformSelected,
      setSelectedText,
      setIsChatAssistantOpen,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
