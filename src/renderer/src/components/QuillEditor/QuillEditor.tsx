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
    editor: unknown,
  ) => void;
  onChangeSelection: (range: unknown, source: unknown, editor: unknown) => void;
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
