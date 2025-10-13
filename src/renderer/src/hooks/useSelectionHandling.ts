import { useCallback, useState } from "react";
import { useEditorContext } from "@renderer/contexts/EditorContext";
import {
  countLineBreaks,
  countWords,
  createHeaderLines,
  extractHeaders,
  getSubstring,
  Selection,
} from "@renderer/utils/textOps";
import { ToolbarPosition } from "@renderer/components/FloatingToolbar";
import { QuillEditorRef } from "./editorTypes";

export interface UseSelectionHandlingProps {
  quillRef: React.RefObject<QuillEditorRef>;
  setSelectedStats: (
    stats: { charCount: number; wordCount: number; lineCount: number } | null,
  ) => void;
}

export function useSelectionHandling({
  quillRef,
  setSelectedStats,
}: UseSelectionHandlingProps): {
  showToolbar: boolean;
  setShowToolbar: (show: boolean) => void;
  toolbarPosition: ToolbarPosition;
  setToolbarPosition: (position: ToolbarPosition) => void;
  transformSelection: { index: number; length: number } | null;
  setTransformSelection: (
    selection: { index: number; length: number } | null,
  ) => void;
  handleSelectionChange: (
    range: { index: number; length: number } | null,
    source: unknown,
    editor: { getText: () => string; getHTML: () => string },
  ) => void;
  handleUpdatingSelectedStats: (
    range: { index: number; length: number },
    editor: { getText: () => string },
  ) => void;
  scrollToHeaderHandler: () => void;
} {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({
    top: 0,
    left: 0,
  });
  const [transformSelection, setTransformSelection] = useState<{
    index: number;
    length: number;
  } | null>(null);

  const {
    scrollToHeader,
    setScrollToHeader,
    setParentHeaderActive,
    setParentHeader2Active,
  } = useEditorContext();

  const handleUpdatingSelectedStats = useCallback(
    (
      range: { index: number; length: number },
      editor: { getText: () => string },
    ) => {
      if (range) {
        const { index, length } = range;
        if (length > 0) {
          const fileText = editor.getText();
          const selectedText = getSubstring(fileText, index, length);
          const wordCount = countWords(selectedText ?? "");
          const lineCount = countLineBreaks(selectedText ?? "");

          setSelectedStats({
            charCount: selectedText.length,
            wordCount: wordCount,
            lineCount: lineCount,
          });
        } else {
          setSelectedStats(null);
        }
      }
    },
    [setSelectedStats],
  );

  const handleSelectionChange = useCallback(
    (
      range: { index: number; length: number } | null,
      _source: unknown,
      editor: { getText: () => string; getHTML: () => string },
    ) => {
      if (range) {
        const { index, length } = range;

        // Update the active headers based on cursor position
        if (index !== undefined) {
          const fileText = editor.getText();
          const content = editor.getHTML();
          const headersExtracted = extractHeaders(content ?? "");
          const headerLines = createHeaderLines(
            fileText ?? "",
            headersExtracted,
          );

          // Find the nearest headers before the cursor position
          let nearestH1: Selection | null = null;
          let nearestH2: Selection | null = null;
          let nearestH1Distance = Infinity;
          let nearestH2Distance = Infinity;
          let currentH1: Selection | null = null;
          let currentH2: Selection | null = null;

          if (headerLines) {
            // First check if we're AT a header position
            for (const header of headerLines) {
              const headerIndex = header.index;

              if (
                index >= headerIndex &&
                index <= headerIndex + header.length
              ) {
                if (header.type === "h1") {
                  currentH1 = {
                    index: header.index,
                    length: header.length,
                  };
                } else if (header.type === "h2") {
                  currentH2 = {
                    index: header.index,
                    length: header.length,
                  };
                }
              }
            }

            // If we're not at a header, find the nearest H1 and H2 headers before the cursor
            if (!currentH1 && !currentH2) {
              for (const header of headerLines) {
                const headerIndex = header.index;

                if (headerIndex < index) {
                  const distance = index - headerIndex;

                  if (header.type === "h1" && distance < nearestH1Distance) {
                    nearestH1 = {
                      index: header.index,
                      length: header.length,
                    };
                    nearestH1Distance = distance;
                  } else if (
                    header.type === "h2" &&
                    distance < nearestH2Distance
                  ) {
                    nearestH2 = {
                      index: header.index,
                      length: header.length,
                    };
                    nearestH2Distance = distance;
                  }
                }
              }
            }
          }

          // Update the context - prioritize current position, then nearest headers
          // Prioritize H2 over H1 for parentHeaderActive
          if (currentH2) {
            setParentHeaderActive(null);
            setParentHeader2Active(currentH2);
          } else if (currentH1) {
            setParentHeaderActive(currentH1);
            setParentHeader2Active(null);
          } else if (nearestH2) {
            setParentHeaderActive(null);
            setParentHeader2Active(nearestH2);
          } else if (nearestH1) {
            setParentHeaderActive(nearestH1);
            setParentHeader2Active(null);
          } else {
            setParentHeaderActive(null);
            setParentHeader2Active(null);
          }
        }

        if (length > 0) {
          const bounds = quillRef.current?.getEditor().getBounds(index, length);

          if (bounds) {
            // Position the toolbar below the selection
            setToolbarPosition({
              top: bounds.bottom + 10, // 10px below the selection
              left: bounds.left,
            });

            setShowToolbar(true);
          }

          handleUpdatingSelectedStats(range, editor);
        } else {
          setSelectedStats(null);
        }
      } else {
        setSelectedStats(null);
      }
    },
    [
      handleUpdatingSelectedStats,
      setParentHeaderActive,
      setParentHeader2Active,
      setSelectedStats,
      quillRef,
    ],
  );

  const scrollToHeaderHandler = useCallback(() => {
    if (scrollToHeader) {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      quill.setSelection(scrollToHeader.index, scrollToHeader.length, "api");

      const bounds = quill.getBounds(
        scrollToHeader.index,
        scrollToHeader.length,
      );

      if (bounds) {
        const editorElement = quill.root;
        let scrollContainer = editorElement.parentElement;

        while (scrollContainer) {
          const overflowY = window.getComputedStyle(scrollContainer).overflowY;
          if (overflowY === "auto" || overflowY === "scroll") {
            break;
          }
          scrollContainer = scrollContainer.parentElement;
        }

        if (scrollContainer) {
          const headerTopRelativeToEditor = bounds.top;
          const editorTopRelativeToContainer = editorElement.offsetTop;
          const targetScrollTop =
            headerTopRelativeToEditor + editorTopRelativeToContainer - 100; // 100px padding from top

          scrollContainer.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: "smooth",
          });
        }
      }

      setScrollToHeader(null);
    }
  }, [scrollToHeader, quillRef, setScrollToHeader]);

  return {
    showToolbar,
    setShowToolbar,
    toolbarPosition,
    setToolbarPosition,
    transformSelection,
    setTransformSelection,
    handleSelectionChange,
    handleUpdatingSelectedStats,
    scrollToHeaderHandler,
  };
}
