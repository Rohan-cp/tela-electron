import ReactQuill from "react-quill";
import { useEffect } from "react";
import "quill/dist/quill.bubble.css";

export interface QuillEditorProps {
  quillRef: React.RefObject<ReactQuill>;
  value: string;
  onChange: (content: string, delta: any, source: any, editor: any) => void;
  onChangeSelection: (range: any, source: any, editor: any) => void;
}

const modules = {
  toolbar: false, // Disable the default toolbar
  clipboard: {
    // Preserve whitespace
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
