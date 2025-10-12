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
    },
  ) => void;
  onChangeSelection: (
    range: { index: number; length: number } | null,
    source: unknown,
    editor: { getText: () => string; getHTML: () => string },
  ) => void;
}

const modules = {
  toolbar: false,
  clipboard: {
    matchVisual: false,
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
