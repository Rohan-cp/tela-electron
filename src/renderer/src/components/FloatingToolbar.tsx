import React, { useState, useEffect, useRef } from "react";
import "./FloatingToolbar.css";
import telaIcon from "../assets/telaButtonIcon.png";
import arrowIcon from "../assets/arrow.png";
import { QuillEditorRef } from "../hooks/editorTypes";

export type ToolbarPosition = {
  top: number;
  left: number;
};

export type FloatingToolbarProps = {
  showToolbar: boolean;
  showDiffView: boolean;
  showLoader: boolean;
  isTransformSelected: boolean;
  toolbarPosition: ToolbarPosition;
  handleChangePromptInput: () => void;
  handleSubmitPromptToTransform: (userTransformPrompt: string) => void;
  setIsInteractingWithToolbar: React.Dispatch<React.SetStateAction<boolean>>;
  originalText: string;
  suggestedText: string;
  transformError: string | null;
  retryCount: number;
  quillRef?: React.RefObject<QuillEditorRef>;
  transformSelection?: { index: number; length: number } | null;
};

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  showToolbar,
  showDiffView,
  showLoader,
  isTransformSelected,
  toolbarPosition,
  handleChangePromptInput,
  handleSubmitPromptToTransform,
  setIsInteractingWithToolbar,
  originalText,
  suggestedText,
  quillRef,
  transformSelection,
}) => {
  const [userTransformPrompt, setUserTransformPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightAppliedRef = useRef(false);

  useEffect(() => {
    if (!showToolbar || !isTransformSelected) {
      setUserTransformPrompt("");
    }
  }, [showToolbar, isTransformSelected]);

  useEffect(() => {
    if (
      showToolbar &&
      isTransformSelected &&
      quillRef?.current &&
      transformSelection &&
      !highlightAppliedRef.current
    ) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        quill.formatText(
          transformSelection.index,
          transformSelection.length,
          { background: "rgba(252, 184, 39, 0.2)" },
          "api"
        );

        quill.setSelection(0, 0, "silent");

        highlightAppliedRef.current = true;
      }
    }
  }, [showToolbar, isTransformSelected, quillRef, transformSelection]);

  useEffect(() => {
    if (showToolbar && isTransformSelected && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [showToolbar, isTransformSelected]);

  useEffect(() => {
    if (
      (!showToolbar || !isTransformSelected) &&
      highlightAppliedRef.current &&
      quillRef?.current &&
      transformSelection
    ) {
      const quill = quillRef.current.getEditor();
      if (quill) {
        quill.formatText(
          transformSelection.index,
          transformSelection.length,
          { background: false },
          "api"
        );

        highlightAppliedRef.current = false;
      }
    }
  }, [showToolbar, isTransformSelected, quillRef, transformSelection]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setUserTransformPrompt(event.target.value);
    handleChangePromptInput();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmitPromptToTransform(userTransformPrompt);
    }
  };

  const handleClickOnThinkDiv = (): void => {};

  if (!showToolbar) return null;

  if (showDiffView) {
    return (
      <div
        className="floating-toolbar diff-view"
        style={{
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`,
        }}
      >
        <div className="diff-view-content">
          <div className="diff-view-header">Suggested Change</div>
          <div className="diff-view-container">
            <div className="suggest-remove-text-container">
              <div className="remove-red-left-border" />
              <div className="suggest-remove-text">{originalText}</div>
            </div>
            <div className="suggest-add-text-container">
              <div className="add-green-left-border" />
              <div className="suggest-add-text">{suggestedText}</div>
            </div>
            <div className="diff-view-actions">
              <div className="diff-view-buttons">
                <div className="reject-toolbar-btn hover-btn">Reject (⌘N)</div>
                <div className="accept-toolbar-btn hover-btn">Accept (⌘Y)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showLoader) {
    return (
      <div
        className="floating-toolbar loader-view"
        style={{
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`,
        }}
      >
        <div className="loader-container">
          <img className="loader-icon" alt="button" src={telaIcon} />
          <div className="loader-text" onClick={handleClickOnThinkDiv}>
            Preparing your changes...
          </div>
        </div>
      </div>
    );
  }

  if (isTransformSelected) {
    return (
      <div
        className="floating-toolbar transform-view"
        style={{
          height: 43,
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`,
        }}
        onMouseDown={e => {
          if (!(e.target instanceof HTMLInputElement)) {
            e.preventDefault();
          }
          setIsInteractingWithToolbar(true);
        }}
      >
        <input
          ref={inputRef}
          className="input"
          type="text"
          value={userTransformPrompt}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={e => {
            e.stopPropagation();
            setIsInteractingWithToolbar(true);
          }}
          onFocus={() => {
            setIsInteractingWithToolbar(true);
          }}
          placeholder='Ex. "make it sound more interesting"'
          disabled={showLoader}
        />
        <div
          className="right-prompt-toolbar-btn"
          onClick={() => {
            !showLoader && handleSubmitPromptToTransform(userTransformPrompt);
          }}
          style={{ opacity: showLoader ? 0.5 : 1 }}
        >
          {showLoader ? (
            <div className="loading-spinner" />
          ) : (
            <img className="arrow-icon" alt="button" src={arrowIcon} />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default FloatingToolbar;
