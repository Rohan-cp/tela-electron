import React, { useState, useEffect } from "react";
import "./TransformModal.css";

export type TransformModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (transformedText: string) => void;
  onReject: () => void;
  originalText: string;
  transformedText: string;
  isLoading: boolean;
  error: string | null;
};

const TransformModal: React.FC<TransformModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
  originalText,
  transformedText,
  isLoading,
  error,
}) => {
  const [showDiff, setShowDiff] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowDiff(false);
    }
  }, [isOpen]);

  // Show diff view when transformation is complete
  useEffect(() => {
    if (!isLoading && transformedText && !error) {
      const timer = setTimeout(() => {
        setShowDiff(true);
      }, 500); // Small delay for smooth transition
      return (): void => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, transformedText, error]);

  if (!isOpen) return null;

  const handleAccept = (): void => {
    onAccept(transformedText);
    onClose();
  };

  const handleReject = (): void => {
    onReject();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && showDiff && !isLoading) {
      handleAccept();
    } else if (e.key === "n" && e.metaKey && showDiff && !isLoading) {
      e.preventDefault();
      handleReject();
    } else if (e.key === "y" && e.metaKey && showDiff && !isLoading) {
      e.preventDefault();
      handleAccept();
    }
  };

  return (
    <div
      className="transform-modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="transform-modal" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="loading-screen">
            <div className="loader-container">
              <div className="loading-spinner-large" />
              <h2>Preparing your changes...</h2>
            </div>
            <p>AI is transforming your text...</p>
          </div>
        )}

        {error && (
          <div className="error-screen">
            <div className="error-icon">⚠️</div>
            <h2>Transformation failed</h2>
            <p>{error}</p>
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {showDiff && !isLoading && !error && (
          <div className="diff-screen">
            <button className="close-button" onClick={onClose}>
              ×
            </button>
            <div className="modal-header">
              <h2>Suggested Change</h2>
            </div>

            <div className="diff-container">
              <div className="suggest-remove-text-container">
                <div className="remove-red-left-border" />
                <div className="suggest-remove-text">{originalText}</div>
              </div>
              <div className="suggest-add-text-container">
                <div className="add-green-left-border" />
                <div className="suggest-add-text">{transformedText}</div>
              </div>
              <div className="diff-view-actions">
                <div className="diff-view-buttons">
                  <div
                    className="reject-toolbar-btn hover-btn"
                    onClick={handleReject}
                  >
                    Reject (⌘N)
                  </div>
                  <div
                    className="accept-toolbar-btn hover-btn"
                    onClick={handleAccept}
                  >
                    Accept (⌘Y)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransformModal;
