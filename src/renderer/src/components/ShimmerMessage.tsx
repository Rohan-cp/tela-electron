import React from "react";

interface ShimmerMessageProps {
  text?: string;
}

const ShimmerMessage: React.FC<ShimmerMessageProps> = ({
  text = "Preparing your changes...",
}) => {
  return (
    <div className="chat-message assistant-message shimmer-message">
      <div className="shimmer-text">{text}</div>
    </div>
  );
};

export default ShimmerMessage;
