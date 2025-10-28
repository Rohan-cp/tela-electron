const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      defaultHeaders["Authorization"] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async createConversation(
    data: CreateConversationRequest
  ): Promise<Conversation> {
    return this.post<Conversation>(`${API_ENDPOINTS.CHAT}/conversations`, data);
  }

  async getConversations(): Promise<Conversation[]> {
    return this.get<Conversation[]>(`${API_ENDPOINTS.CHAT}/conversations`);
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    return this.get<Conversation>(
      `${API_ENDPOINTS.CHAT}/conversations/${conversationId}`
    );
  }

  async sendMessage(
    conversationId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> {
    return this.post<SendMessageResponse>(
      `${API_ENDPOINTS.CHAT}/conversations/${conversationId}/messages`,
      data
    );
  }

  async applyChange(changeId: string): Promise<SuggestedChange> {
    return this.post<SuggestedChange>(
      `${API_ENDPOINTS.CHAT}/changes/${changeId}/apply`
    );
  }

  async deleteConversation(
    conversationId: string
  ): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(
      `${API_ENDPOINTS.CHAT}/conversations/${conversationId}`
    );
  }
}

export const apiClient = new ApiClient();

export const API_ENDPOINTS = {
  AUTOCOMPLETE: "/api/autocomplete",
  TRANSFORM: "/api/transform",
  AUTH: "/auth",
  FEEDBACK: "/api/feedback",
  CHAT: "/api/chat",
} as const;

export interface AutocompleteRequest {
  context: string;
  currentSentence: string;
  maxTokens?: number;
}

export interface AutocompleteResponse {
  success: boolean;
  suggestion: string;
  error?: string;
}

export interface TransformRequest {
  text: string;
  transformation: string;
}

export interface TransformResponse {
  success: boolean;
  transformedText: string;
  error?: string;
}

export interface FeedbackRequest {
  email: string;
  message: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback: {
    id: string;
    email: string;
    message: string;
    createdAt: string;
  };
  error?: string;
}

export interface Conversation {
  id: string;
  title?: string;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  source: "USER" | "ASSISTANT";
  content: string;
  suggestedChanges?: SuggestedChange[];
  createdAt: string;
}

export interface SuggestedChange {
  id: string;
  messageId: string;
  title: string;
  currentText: string;
  suggestedText: string;
  isApplied: boolean;
  createdAt: string;
}

export interface CreateConversationRequest {
  title?: string;
  documentId?: string;
}

export interface SendMessageRequest {
  content: string;
  documentContent?: string;
}

export interface SendMessageResponse {
  message: Message;
  suggestedChanges: SuggestedChange[];
}
