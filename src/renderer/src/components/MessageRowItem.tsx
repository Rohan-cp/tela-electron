import React, { useCallback, useMemo } from "react";
import { MessageStyle } from "@renderer/types/types";
import { Message, SuggestedChange } from "../lib/api";
import { useChat } from "../hooks/useChat";
import "./MessageRowItem.css";

type MessageRowItemProps = {
  message: Message;
  quillRef: React.RefObject<{ getEditor: () => unknown }>;
};

type SuggestedChangeItemProps = {
  change: SuggestedChange;
  quillRef: React.RefObject<{ getEditor: () => unknown }>;
};

const SuggestedChangeItem = React.memo(function SuggestedChangeItem({
  change,
  quillRef,
}: SuggestedChangeItemProps): JSX.Element {
  const { applyChange, isApplyingChange } = useChat();

  const handleApplyChange = useCallback(async (): Promise<void> => {
    try {
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();

        if (
          quill &&
          typeof quill === "object" &&
          "getText" in quill &&
          "deleteText" in quill &&
          "insertText" in quill
        ) {
          const editorText = (quill as { getText: () => string }).getText();
          const currentText = change.currentText;
          const suggestedText = change.suggestedText;

          const textIndex = editorText.indexOf(currentText);

          if (textIndex !== -1) {
            (
              quill as { deleteText: (index: number, length: number) => void }
            ).deleteText(textIndex, currentText.length);
            (
              quill as { insertText: (index: number, text: string) => void }
            ).insertText(textIndex, suggestedText);
          }
        }
      }

      await applyChange(change.id);
    } catch (error) {
      console.error("Failed to apply change:", error);
    }
  }, [
    applyChange,
    change.id,
    change.currentText,
    change.suggestedText,
    quillRef,
  ]);

  return (
    <div key={change.id} className={MessageStyle.SuggestChangeMessage}>
      <div className="suggestion-container">
        <div className="suggestion-title">{change.title}</div>
        <div className="suggestion-diff-container">
          <div className="suggest-remove-text-container">
            <div className="remove-red-left-border" />
            <div className="suggest-remove-text">{change.currentText}</div>
          </div>
          <div className="suggest-add-text-container">
            <div className="add-green-left-border" />
            <div className="suggest-add-text">{change.suggestedText}</div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              onClick={handleApplyChange}
              className="apply-change-btn"
              style={{
                opacity: isApplyingChange ? 0.5 : 1,
                cursor: isApplyingChange ? "not-allowed" : "pointer",
              }}
            >
              {isApplyingChange ? "Applying..." : "Apply this change"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default React.memo(function MessageRowItem({
  message,
  quillRef,
}: MessageRowItemProps): JSX.Element {
  const messageStyle = useMemo(
    () =>
      message.source === "USER"
        ? MessageStyle.UserMessage
        : MessageStyle.AssistantMessage,
    [message.source],
  );

  const suggestedChanges = useMemo(
    () =>
      message.suggestedChanges?.map((change) => (
        <SuggestedChangeItem
          key={change.id}
          change={change}
          quillRef={quillRef}
        />
      )),
    [message.suggestedChanges, quillRef],
  );

  return (
    <>
      <div key={message.id} className={messageStyle}>
        <div className="message-text">{message.content}</div>
      </div>
      {suggestedChanges}
    </>
  );
});
