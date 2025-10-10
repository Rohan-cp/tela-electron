import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  CreateConversationRequest,
  SendMessageRequest,
  Conversation,
  Message,
  SuggestedChange,
} from "../lib/api";
import { useAuthContext } from "../contexts/AuthContext";

export function useChat(): {
  currentConversationId: string | null;
  conversations: Conversation[];
  currentConversation: Conversation | undefined;
  optimisticMessages: Map<
    string,
    { id: string; content: string; timestamp: number }
  >;
  conversationsLoading: boolean;
  conversationLoading: boolean;
  isSendingMessage: boolean;
  isApplyingChange: boolean;
  isCreatingConversation: boolean;
  isDeletingConversation: boolean;
  createConversation: (
    data: CreateConversationRequest,
  ) => Promise<Conversation>;
  sendMessage: (
    content: string,
    documentContent?: string,
    conversationId?: string,
  ) => Promise<{ message: Message; suggestedChanges: SuggestedChange[] }>;
  applyChange: (changeId: string) => Promise<SuggestedChange>;
  deleteConversation: (conversationId: string) => Promise<{ success: boolean }>;
  startNewConversation: (
    title?: string,
    documentId?: string,
  ) => Promise<Conversation>;
  switchToConversation: (conversationId: string) => void;
  sendMessageError: unknown;
  applyChangeError: unknown;
  createConversationError: unknown;
  deleteConversationError: unknown;
} {
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [optimisticMessages, setOptimisticMessages] = useState<
    Map<string, { id: string; content: string; timestamp: number }>
  >(new Map());
  const queryClient = useQueryClient();
  const { userToken } = useAuthContext();

  useEffect(() => {
    apiClient.setAuthToken(userToken);
  }, [userToken]);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiClient.getConversations(),
    enabled: !!userToken,
  });

  const { data: currentConversation, isLoading: conversationLoading } =
    useQuery({
      queryKey: ["conversation", currentConversationId],
      queryFn: () => apiClient.getConversation(currentConversationId!),
      enabled: !!currentConversationId && !!userToken,
    });

  const createConversationMutation = useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      apiClient.createConversation(data),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setCurrentConversationId(newConversation.id);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: SendMessageRequest;
      optimisticId: string;
    }) => apiClient.sendMessage(conversationId, data),
    onMutate: async ({ data, optimisticId }) => {
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        newMap.set(optimisticId, {
          id: optimisticId,
          content: data.content,
          timestamp: Date.now(),
        });
        return newMap;
      });
    },
    onSuccess: (_, { optimisticId }) => {
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(optimisticId);
        return newMap;
      });
      queryClient.invalidateQueries({
        queryKey: ["conversation", currentConversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_, { optimisticId }) => {
      setOptimisticMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(optimisticId);
        return newMap;
      });
    },
  });

  const applyChangeMutation = useMutation({
    mutationFn: (changeId: string) => apiClient.applyChange(changeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation", currentConversationId],
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (currentConversationId) {
        setCurrentConversationId(null);
      }
    },
  });

  const createConversation = useCallback(
    (data: CreateConversationRequest) => {
      return createConversationMutation.mutateAsync(data);
    },
    [createConversationMutation],
  );

  const sendMessage = useCallback(
    (content: string, documentContent?: string, conversationId?: string) => {
      const targetConversationId = conversationId || currentConversationId;
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (!targetConversationId) {
        throw new Error("No active conversation");
      }
      return sendMessageMutation.mutateAsync({
        conversationId: targetConversationId,
        data: { content, documentContent },
        optimisticId,
      });
    },
    [currentConversationId, sendMessageMutation],
  );

  const applyChange = useCallback(
    (changeId: string) => {
      return applyChangeMutation.mutateAsync(changeId);
    },
    [applyChangeMutation],
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      return deleteConversationMutation.mutateAsync(conversationId);
    },
    [deleteConversationMutation],
  );

  const startNewConversation = useCallback(
    (title?: string, documentId?: string) =>
      createConversation({ title, documentId }),
    [createConversation],
  );

  const switchToConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  return {
    currentConversationId,
    conversations: conversations || [],
    currentConversation,
    optimisticMessages,
    conversationsLoading,
    conversationLoading,
    isSendingMessage: sendMessageMutation.isPending,
    isApplyingChange: applyChangeMutation.isPending,
    isCreatingConversation: createConversationMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,
    createConversation,
    sendMessage,
    applyChange,
    deleteConversation,
    startNewConversation,
    switchToConversation,
    sendMessageError: sendMessageMutation.error,
    applyChangeError: applyChangeMutation.error,
    createConversationError: createConversationMutation.error,
    deleteConversationError: deleteConversationMutation.error,
  };
}
