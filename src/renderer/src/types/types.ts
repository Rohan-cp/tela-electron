type SuggestChangeMessageContent = {
  title: string;
  value: {
    current: string;
    suggestedChange: string;
  };
};

export enum MessageStyle {
  UserMessage = "chat-message user-message",
  AssistantMessage = "chat-message assistant-message",
  SuggestChangeMessage = "chat-message suggest-change-message",
}

export type Message = {
  id: string;
  content: SuggestChangeMessageContent | string;
  style: MessageStyle;
};
