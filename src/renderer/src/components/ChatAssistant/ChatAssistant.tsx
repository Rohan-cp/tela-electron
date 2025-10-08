import React, { useState, useRef, useEffect } from "react";
import chatBg from "../../assets/chat-bg-old.png";
import { MessageStyle, Message } from "@renderer/types/types";
import MessageRowItem from "../MessageRowItem";
import UpArrowIcon from "../../assets/UpArrowIcon.svg";

type ChatAssistantProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string | null;
};

const ChatAssistant = ({
  isOpen,
  onClose,
  selectedText,
}: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      style: MessageStyle.UserMessage,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");

    // In a real app, you would send this message to your AI service
    // and then add the response to the messages

    // Mock AI response after a delay
    // we need to get from api how many changes were suggested
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Absolutely — here are some changes that make your essay more concise and focused and capture the big picture of the Renaissance, its psychological influence on society, and how it set the stage for the period that followed",
        style: MessageStyle.AssistantMessage,
      };

      // for every suggested change
      const change1: Message = {
        id: (Date.now() + 1).toString(),
        content: {
          title: "Change 1: To make it more concise",
          value: {
            current: "Do you feel the buzz or is it just me?",
            suggestedChange:
              "Is there electricity in the air, or am I the only one feeling it?",
          },
        },
        style: MessageStyle.SuggestChangeMessage,
      };

      const change2: Message = {
        id: (Date.now() + 1).toString(),
        content: {
          title:
            "Change 2: Expand on influcence on period after and the pyshcological effect on the generation that came after",
          value: {
            current: "Head in the clouds but my gravity is centered.",
            suggestedChange: "One sweater, two mouths",
          },
        },
        style: MessageStyle.SuggestChangeMessage,
      };

      setMessages((prev) => [...prev, aiResponse, change1, change2]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    // Clear all existing messages to start a new chat
    setMessages([]);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`chat-assistant-modal ${isOpen ? "visible" : "hidden"}`}
      style={{
        backgroundImage: `url(${chatBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        pointerEvents: "auto",
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
        {messages.length > 0 ? (
          // Messages are present, show conversation
          messages.map((message) => (
            <MessageRowItem
              id={message.id}
              style={message.style}
              content={message.content}
            />
          ))
        ) : (
          // Empty state - no messages yet
          <div className="chat-empty-state">
            <div className="chat-empty-title">
              {/* Title placeholder */}
              Chat with your AI writing assistant
            </div>
            <div className="chat-empty-description">
              {/* Description placeholder */}
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
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Display selected text if available */}
      {selectedText && (
        <div className="selected-text-container">
          <div className="selected-text-header">Selected Text:</div>
          <div className="selected-text">{selectedText}</div>
        </div>
      )}

      <div
        className="chat-assistant-input-container"
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative" }}
      >
        <textarea
          ref={inputRef}
          className="chat-assistant-input"
          value={inputValue}
          onChange={(e) => {
            e.stopPropagation();
            setInputValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Plan, discuss, explore, and refine..."
          autoComplete="off"
          rows={2}
          style={{
            position: "relative",
            zIndex: 1,
            pointerEvents: "auto",
            width: "100%",
            padding: "12px 12px",
            paddingRight: "48px", // Make room for the send button
            outline: "none",
            color: "#ffffff",
            transition: "border-color 0.2s ease",
            resize: "none",
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "1.4",
          }}
        />
        <button
          className="chat-assistant-submit"
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          style={{
            position: "absolute",
            bottom: "26px",
            right: "28px",
            zIndex: 2,
          }}
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
