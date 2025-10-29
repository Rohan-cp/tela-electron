import { useState, useCallback } from "react";

export function useChatAssistant(): {
  isChatAssistantOpen: boolean;
  selectedText: string | null;
  chatSelection: { index: number; length: number } | null;
  openChatAssistant: (
    text?: string,
    selection?: { index: number; length: number }
  ) => void;
  closeChatAssistant: () => void;
} {
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [chatSelection, setChatSelection] = useState<{
    index: number;
    length: number;
  } | null>(null);

  const openChatAssistant = useCallback(
    (text?: string, selection?: { index: number; length: number }) => {
      setSelectedText(text || null);
      setChatSelection(selection || null);
      setIsChatAssistantOpen(true);
    },
    []
  );

  const closeChatAssistant = useCallback(() => {
    setIsChatAssistantOpen(false);
    setSelectedText(null);
    setChatSelection(null);
  }, []);

  return {
    isChatAssistantOpen,
    selectedText,
    chatSelection,
    openChatAssistant,
    closeChatAssistant,
  };
}
