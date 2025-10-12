import ReactQuill from "react-quill";

/**
 * Shared Quill editor interface used across all hooks
 * We use ReactQuill directly as the base type
 */
export type QuillEditorRef = ReactQuill;

export interface QuillEditor {
  getSelection: () => { index: number; length: number } | null;
  getText: (start?: number, end?: number) => string;
  getHTML?: () => string;
  insertText: (
    index: number,
    text: string,
    format?: Record<string, unknown>,
  ) => void;
  setSelection: (index: number, length: number) => void;
  formatText: (
    index: number,
    length: number,
    format: Record<string, unknown>,
  ) => void;
  deleteText: (index: number, length: number) => void;
  getBounds?: (
    index: number,
    length: number,
  ) => { bottom: number; left: number } | null;
  getLength?: () => number;
  getFormat?: (index?: number, length?: number) => Record<string, unknown>;
  format?: (name: string, value: unknown) => void;
  root?: HTMLElement & { innerHTML: string };
  makeUnprivilegedEditor?: (quill: unknown) => { getHTML: () => string };
}
