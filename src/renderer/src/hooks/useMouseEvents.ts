import { useEffect, useCallback } from "react";

export interface UseMouseEventsProps {
  quillRef: React.RefObject<unknown>;
  setShowToolbar: (show: boolean) => void;
  setIsTransformSelected: (selected: boolean) => void;
  setShowDiffView: (show: boolean) => void;
  setShowLoader?: (show: boolean) => void;
  setSelectedStats: (
    stats: { charCount: number; wordCount: number; lineCount: number } | null,
  ) => void;
  handleUpdatingSelectedStats: (range: unknown, editor: unknown) => void;
}

export function useMouseEvents({
  quillRef,
  setShowToolbar,
  setIsTransformSelected,
  setShowDiffView,
  setShowLoader,
  setSelectedStats,
  handleUpdatingSelectedStats,
}: UseMouseEventsProps): void {
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      const toolbarElements = document.querySelectorAll(".floating-toolbar");
      const chatAssistant = document.querySelector(".chat-assistant-modal");
      const editorElement = document.querySelector(".ql-editor");
      const titleInput = document.getElementById("documentName");
      const descriptionInput = document.getElementById("documentDescription");
      const modalElements = document.querySelectorAll("[data-modal]");

      let clickedInsideToolbar = false;
      toolbarElements.forEach((toolbar) => {
        if (toolbar.contains(e.target as Node)) {
          clickedInsideToolbar = true;
        }
      });

      let clickedInsideModal = false;
      modalElements.forEach((modal) => {
        if (modal.contains(e.target as Node)) {
          clickedInsideModal = true;
        }
      });

      const clickedInsideChat = chatAssistant?.contains(e.target as Node);
      const clickedInsideEditor = editorElement?.contains(e.target as Node);
      const clickedInsideTitleInput = titleInput?.contains(e.target as Node);
      const clickedInsideDescriptionInput = descriptionInput?.contains(
        e.target as Node,
      );

      if (
        !clickedInsideToolbar &&
        !clickedInsideChat &&
        !clickedInsideEditor &&
        !clickedInsideTitleInput &&
        !clickedInsideDescriptionInput &&
        !clickedInsideModal
      ) {
        // Clicked outside toolbar, chat, editor, and input fields
        if (window.getSelection) {
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            setSelectedStats(null);
          }
        }

        setShowToolbar(false);
        setIsTransformSelected(false);
        setShowDiffView(false);
        setShowLoader?.(false);
      } else if (!clickedInsideToolbar && clickedInsideEditor) {
        // Inside editor but not toolbar — check selection after delay
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.toString().trim() === "") {
            setShowToolbar(false);
            setIsTransformSelected(false);
            setShowDiffView(false);
            setShowLoader?.(false);
            setSelectedStats(null);
          } else {
            if (
              quillRef.current &&
              typeof quillRef.current === "object" &&
              "getEditor" in quillRef.current
            ) {
              const quill = (
                quillRef.current as { getEditor: () => unknown }
              ).getEditor();
              if (
                quill &&
                typeof quill === "object" &&
                "getSelection" in quill
              ) {
                const range = (
                  quill as { getSelection: () => { length: number } | null }
                ).getSelection();
                if (range && range.length > 0) {
                  handleUpdatingSelectedStats(range, quill);
                }
              }
            }
          }
        }, 10);
      }
    },
    [
      setShowToolbar,
      setIsTransformSelected,
      setShowDiffView,
      setShowLoader,
      setSelectedStats,
      handleUpdatingSelectedStats,
      quillRef,
    ],
  );

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return (): void => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);
}
