import { useCallback, useRef } from "react";
import ReactQuill from "react-quill";
import {
  countLineBreaks,
  countWords,
  createFileTree,
  createHeaderLines,
  extractHeaders,
  Subtree,
} from "@renderer/utils/textOps";

export interface EditorStats {
  charCount: number;
  wordCount: number;
  lineCount: number;
}

export interface UseEditorOperationsProps {
  setCharCount: (num: number) => void;
  setWordCount: (num: number) => void;
  setLineCount: (num: number) => void;
  setFileTree: (newFileTree: Subtree[]) => void;
}

export function useEditorOperations({
  setCharCount,
  setWordCount,
  setLineCount,
  setFileTree,
}: UseEditorOperationsProps): {
  quillRef: React.RefObject<ReactQuill>;
  updateFileStats: () => void;
  getEditorStats: (editor: { getText: () => string }) => EditorStats;
  formatHeader: (level: number) => void;
} {
  const quillRef = useRef<ReactQuill>(null);

  const updateFileStats = useCallback(() => {
    if (!quillRef?.current) return;
    const quill = quillRef.current.getEditor();
    if (!quill) return;

    const newLength = quill.getLength();
    const fileText = quill.getText();
    const wordCount = countWords(fileText ?? "");
    const lineCount = countLineBreaks(fileText ?? "");

    const unprivilegedEditor = quillRef.current.makeUnprivilegedEditor(quill);
    const content = unprivilegedEditor?.getHTML();

    // first get the headers
    const headersExtracted = extractHeaders(content ?? "");
    const newHeaderLines = createHeaderLines(fileText ?? "", headersExtracted);

    // create the new file tree
    const newFileTree = createFileTree(newHeaderLines);

    setFileTree(newFileTree);
    setCharCount(newLength ? newLength - 1 : 0);
    setWordCount(wordCount);
    setLineCount(lineCount);
  }, [setCharCount, setWordCount, setLineCount, setFileTree]);

  const getEditorStats = useCallback(
    (editor: { getText: () => string }): EditorStats => {
      const fileText = editor.getText();
      const wordCount = countWords(fileText ?? "");
      const lineCount = countLineBreaks(fileText ?? "");
      const charCount = fileText.length;

      return { charCount, wordCount, lineCount };
    },
    [],
  );

  const formatHeader = useCallback((level: number) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const selection = quill.getSelection();
    if (!selection) return;

    // Get current format
    const currentFormat = quill.getFormat(selection);

    // Toggle header level or remove header
    if (currentFormat.header === level) {
      quill.format("header", false);
    } else {
      quill.format("header", level);
    }
  }, []);

  return {
    quillRef,
    updateFileStats,
    getEditorStats,
    formatHeader,
  };
}
