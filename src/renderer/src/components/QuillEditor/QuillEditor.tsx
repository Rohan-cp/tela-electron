import ReactQuill from "react-quill";
import { useEffect } from "react";
import "quill/dist/quill.bubble.css";

export interface QuillEditorProps {
  quillRef: React.RefObject<ReactQuill>;
  value: string;
  onChange: (
    content: string,
    delta: unknown,
    source: unknown,
    editor: {
      getText: () => string;
      getSelection?: () => { index: number; length: number } | null;
    }
  ) => void;
  onChangeSelection: (
    range: { index: number; length: number } | null,
    source: unknown,
    editor: { getText: () => string; getHTML: () => string }
  ) => void;
}

const modules = {
  toolbar: false,
  clipboard: {
    matchVisual: false,
  },
  keyboard: {
    bindings: {
      tab: {
        key: 9, // Tab key code
        handler: function () {
          // Prevent Quill from handling Tab - we'll handle it ourselves
          return false;
        },
      },
      handleSpace: {
        key: " ",
        handler: function (this: {
          quill: {
            getSelection: () => { index: number; length: number } | null;
            getText: (start?: number, end?: number) => string;
            format: (format: string, value: string, source?: string) => void;
            formatText: (
              index: number,
              length: number,
              format: Record<string, unknown>
            ) => void;
            formatLine: (
              index: number,
              length: number,
              format: string,
              value: string,
              source?: string
            ) => void;
            deleteText: (index: number, length: number) => void;
            insertText: (index: number, text: string, source?: string) => void;
            setSelection: (index: number, length?: number) => void;
          };
        }) {
          const selection = this.quill.getSelection();
          if (!selection || selection.length > 0) {
            return true; // Let default behavior handle it
          }

          const index = selection.index;

          // Get text before cursor
          const textBefore = this.quill.getText(0, index);

          // Find the start of the current line
          const lineStart = textBefore.lastIndexOf("\n") + 1;
          const lineText = textBefore.substring(lineStart);

          if (lineText === "*" || lineText === "-") {
            this.quill.deleteText(index - 1, 1);
            this.quill.formatLine(index - 1, 1, "list", "bullet", "user");
            return false;
          }

          return true;
        },
      },
    },
  },
};

const formats = [
  "bold",
  "italic",
  "underline",
  "strike",
  "header",
  "list",
  "bullet",
  "color",
  "background",
  "link",
  "image",
];

export default function QuillEditor({
  quillRef,
  value,
  onChange,
  onChangeSelection,
}: QuillEditorProps): JSX.Element {
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.setAttribute("spellcheck", "false");
    }
  }, []);

  return (
    <ReactQuill
      ref={quillRef}
      theme="bubble"
      value={value}
      onChange={onChange}
      onChangeSelection={onChangeSelection}
      modules={modules}
      formats={formats}
    />
  );
}
