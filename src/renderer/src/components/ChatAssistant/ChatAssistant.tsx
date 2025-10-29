import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { QuillEditorRef, QuillEditor } from "../../hooks/editorTypes";
import chatBg from "../../assets/chat-bg.png";
import MessageRowItem from "../MessageRowItem";
import ShimmerMessage from "../ShimmerMessage";
import UpArrowIcon from "../../assets/UpArrowIcon.svg";
import { useChat } from "../../hooks/useChat";
import { Message } from "../../lib/api";

type ChatAssistantProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string | null;
  chatSelection: { index: number; length: number } | null;
  quillRef: React.RefObject<QuillEditorRef>;
};

const ChatAssistant = ({
  isOpen,
  onClose,
  selectedText,
  chatSelection,
  quillRef,
}: ChatAssistantProps): JSX.Element | null => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAttemptedAutoCreate = useRef(false);
  const highlightAppliedRef = useRef(false);

  const messageQuillRef = useRef<{
    getEditor: () => QuillEditor | null;
  }>({
    getEditor: () => {
      const editor = quillRef?.current?.getEditor();
      if (!editor) return null;

      return {
        getSelection: () => editor.getSelection(),
        getText: (start?: number, end?: number) => editor.getText(start, end),
        getHTML: () => editor.root?.innerHTML || "",
        insertText: (
          index: number,
          text: string,
          format?: Record<string, unknown>
        ) => {
          if (format) {
            editor.insertText(index, text, format);
          } else {
            editor.insertText(index, text);
          }
        },
        setSelection: (index: number, length: number) =>
          editor.setSelection(index, length),
        formatText: (
          index: number,
          length: number,
          format: Record<string, unknown>
        ) => {
          editor.formatText(index, length, format);
        },
        deleteText: (index: number, length: number) =>
          editor.deleteText(index, length),
        getBounds: (index: number, length: number) =>
          editor.getBounds?.(index, length),
        getLength: () => editor.getLength(),
        getFormat: (index?: number, length?: number) =>
          editor.getFormat(index, length),
        format: (name: string, value: unknown) => editor.format(name, value),
        root: editor.root,
        makeUnprivilegedEditor: (quill: unknown) => {
          return {
            getHTML: () => {
              const q = quill as { root?: { innerHTML?: string } };
              return q?.root?.innerHTML || "";
            },
          };
        },
      } as QuillEditor;
    },
  });

  const {
    currentConversation,
    sendMessage,
    startNewConversation,
    isSendingMessage,
    isCreatingConversation,
    optimisticMessages,
  } = useChat();

  const apiMessages = useMemo(
    () => currentConversation?.messages || [],
    [currentConversation?.messages]
  );

  const optimisticApiMessages: Message[] = useMemo(
    () =>
      Array.from(optimisticMessages.values()).map(optimisticMsg => ({
        id: optimisticMsg.id,
        conversationId: currentConversation?.id || "",
        source: "USER" as const,
        content: optimisticMsg.content,
        createdAt: new Date(optimisticMsg.timestamp).toISOString(),
      })),
    [optimisticMessages, currentConversation?.id]
  );

  const allMessages = useMemo(
    () => [...apiMessages, ...optimisticApiMessages],
    [apiMessages, optimisticApiMessages]
  );

  const shouldShowShimmer = useMemo(
    () => isSendingMessage && optimisticMessages.size > 0,
    [isSendingMessage, optimisticMessages.size]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }

    if (
      isOpen &&
      !currentConversation &&
      !isCreatingConversation &&
      !hasAttemptedAutoCreate.current
    ) {
      hasAttemptedAutoCreate.current = true;
      startNewConversation("New Chat").catch(() => {
        hasAttemptedAutoCreate.current = false;
      });
    }
  }, [isOpen, currentConversation, isCreatingConversation]);

  useEffect(() => {
    if (!isOpen) {
      hasAttemptedAutoCreate.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (
      isOpen &&
      chatSelection &&
      quillRef?.current &&
      !highlightAppliedRef.current
    ) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        quill.formatText(
          chatSelection.index,
          chatSelection.length,
          { background: "rgba(252, 184, 39, 0.2)" },
          "api"
        );

        quill.setSelection(0, 0, "silent");

        highlightAppliedRef.current = true;
      }
    }
  }, [isOpen, chatSelection, quillRef]);

  useEffect(() => {
    if (
      !isOpen &&
      highlightAppliedRef.current &&
      quillRef?.current &&
      chatSelection
    ) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        quill.formatText(
          chatSelection.index,
          chatSelection.length,
          { background: false },
          "api"
        );

        highlightAppliedRef.current = false;
      }
    }
  }, [isOpen, chatSelection, quillRef]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!inputValue.trim() || isSendingMessage || isCreatingConversation) {
      return;
    }

    const messageContent = inputValue.trim();
    setInputValue("");

    try {
      const conversationId = currentConversation?.id;

      if (!conversationId) {
        return;
      }

      await sendMessage(
        messageContent,
        selectedText || undefined,
        conversationId
      );
    } catch {
      return;
    }
  }, [
    inputValue,
    isSendingMessage,
    isCreatingConversation,
    currentConversation?.id,
    sendMessage,
    selectedText,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleNewChat = useCallback(async (): Promise<void> => {
    try {
      await startNewConversation("New Chat");
    } catch {
      return;
    }
  }, [startNewConversation]);

  const handleContainerClick = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      setInputValue(e.target.value);
    },
    []
  );

  const handleInputContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={`chat-assistant-modal ${isOpen ? "visible" : "hidden"}`}
      style={{
        backgroundImage: `url(${chatBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      onClick={handleContainerClick}
    >
      <div className="chat-assistant-header">
        <span className="chat-assistant-title">Chat Assistant</span>
        <div className="chat-assistant-actions">
          <div className="icon-button" onClick={handleNewChat} title="New Chat">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 4.16669V15.8334"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.16669 10H15.8334"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="icon-button" onClick={onClose} title="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="chat-assistant-messages">
        {allMessages.length > 0 ? (
          <>
            {allMessages.map(message => (
              <MessageRowItem
                key={message.id}
                message={message}
                quillRef={messageQuillRef}
              />
            ))}
            {shouldShowShimmer && (
              <ShimmerMessage
                key="shimmer-loading"
                text="Preparing your changes"
              />
            )}
          </>
        ) : (
          <div className="chat-empty-state">
            {isCreatingConversation ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div
                  className="loading-spinner"
                  style={{
                    width: 20,
                    height: 20,
                    margin: "0 auto 10px",
                  }}
                />
                <div>Setting up your chat...</div>
              </div>
            ) : (
              <>
                <div className="chat-empty-title">
                  Chat with your AI writing assistant
                </div>
                <div className="chat-empty-description">
                  Develop your content with an AI assistant that understands the
                  context of your writing and responds to your natural language
                  prompts
                </div>
                <ul className="chat-empty-list">
                  <li className="chat-empty-list-item">
                    Request suggestions for improvements
                  </li>
                  <li className="chat-empty-list-item">
                    Find facts and statistics for your content
                  </li>
                  <li className="chat-empty-list-item">
                    Get feedback on your writing
                  </li>
                </ul>
              </>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {selectedText && (
        <div className="selected-text-container">
          <div className="selected-text-header">Selected Text:</div>
          <div className="selected-text">{selectedText}</div>
        </div>
      )}

      <div
        className="chat-assistant-input-container"
        onClick={handleInputContainerClick}
      >
        <textarea
          ref={inputRef}
          className="chat-assistant-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Plan, discuss, explore, and refine..."
          autoComplete="off"
          rows={2}
        />
        <button
          className="chat-assistant-submit"
          onClick={handleSubmit}
          disabled={
            !inputValue.trim() || isSendingMessage || isCreatingConversation
          }
        >
          <img
            style={{
              width: "auto",
              height: 13,
            }}
            src={UpArrowIcon}
            alt=" "
          />
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;
