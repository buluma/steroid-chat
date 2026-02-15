export type AIProvider = 'openai' | 'grok' | 'openrouter' | 'qwen' | 'ollama' | 'deepseek' | 'mistral' | 'together' | 'lmstudio';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: 'text' | 'image' | 'pdf' | 'json';
  content: string;
  mimeType: string;
  size: number;
}

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatRequest {
  messages: ChatMessage[];
  provider: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AppSettings {
  defaultProvider: AIProvider;
  providers: Record<AIProvider, ProviderConfig>;
  theme: 'light' | 'dark' | 'system';
}
