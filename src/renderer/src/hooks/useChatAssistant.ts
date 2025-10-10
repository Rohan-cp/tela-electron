import { useState, useCallback } from "react";

export function useChatAssistant(): {
  isChatAssistantOpen: boolean;
  selectedText: string | null;
  openChatAssistant: (text?: string) => void;
  closeChatAssistant: () => void;
} {
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  const openChatAssistant = useCallback((text?: string) => {
    setSelectedText(text || null);
    setIsChatAssistantOpen(true);
  }, []);

  const closeChatAssistant = useCallback(() => {
    setIsChatAssistantOpen(false);
    setSelectedText(null);
  }, []);

  return {
    isChatAssistantOpen,
    selectedText,
    openChatAssistant,
    closeChatAssistant,
  };
}
