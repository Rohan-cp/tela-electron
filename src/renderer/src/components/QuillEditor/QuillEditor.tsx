import ReactQuill from "react-quill";
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
