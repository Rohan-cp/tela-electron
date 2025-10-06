import { ReactNode } from "react";
import "./EditorContainer.css";

export interface EditorContainerProps {
  children: ReactNode;
}

export default function EditorContainer({
  children,
}: EditorContainerProps): JSX.Element {
  return <div className="editor-container">{children}</div>;
}
