import { useEffect, useCallback } from "react";

export interface UseKeyboardShortcutsProps {
  quillRef: React.RefObject<{
    getEditor: () => {
      getSelection: () => { index: number; length: number } | null;
      getText: (index: number, length: number) => string;
      getBounds: (
        index: number,
        length: number,
      ) => { bottom: number; left: number } | null;
    };
  }>;
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

        // Get any selected text when opening chat
        if (selection && selection.length > 0) {
          const text = quill.getText(selection.index, selection.length);
          setSelectedText(text);
        } else {
          setSelectedText(null);
        }

        setIsChatAssistantOpen((prevState: boolean) => !prevState);
        return; // Early return to avoid other shortcut checks
      }

      // For other shortcuts, we need a selection
      if (!selection || selection.length === 0) return;

      // Check for CMD+T for transform
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();

        // Get the bounds of the selection to position the toolbar
        const bounds = quill.getBounds(selection.index, selection.length);
        if (!bounds) return;

        // Store the selection for later use
        setTransformSelection({
          index: selection.index,
          length: selection.length,
        });

        // Set toolbar position and show transform view
        setToolbarPosition({
          top: bounds.bottom + 10,
          left: bounds.left,
        });
        setShowToolbar(true);
        setIsTransformSelected(true);
      }

      // Keep existing header shortcuts
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
