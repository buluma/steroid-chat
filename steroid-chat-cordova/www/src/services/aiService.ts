import { AIProvider, ChatMessage, AIResponse, ProviderConfig } from '../types';

const API_ENDPOINTS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    chat: '/chat/completions'
  },
  grok: {
    baseUrl: 'https://api.x.ai/v1',
    chat: '/chat/completions'
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    chat: '/chat/completions'
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    chat: '/chat/completions'
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    chat: '/api/chat'
  }
};

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private getEndpointConfig(provider: AIProvider) {
    return API_ENDPOINTS[provider];
  }

  private buildMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  async chat(
    provider: AIProvider,
    config: ProviderConfig,
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<AIResponse> {
    const endpoint = this.getEndpointConfig(provider);
    const { 
      model, 
      temperature = 0.7, 
      maxTokens = 4096, 
      stream = false,
      onChunk 
    } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (provider !== 'ollama') {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://steroidchat.app';
      headers['X-Title'] = 'SteroidChat';
    }

    const body: Record<string, any> = {
      messages: this.buildMessages(messages),
      model: model || config.model || this.getDefaultModel(provider),
      temperature,
      max_tokens: maxTokens,
      stream
    };

    if (provider === 'ollama') {
      delete body.temperature;
      delete body.max_tokens;
      body.stream = stream;
    }

    const url = `${endpoint.baseUrl}${endpoint.chat}`;

    try {
      if (stream && onChunk) {
        return await this.handleStreamResponse(provider, url, headers, body, onChunk);
      } else {
        return await this.handleRegularResponse(provider, url, headers, body);
      }
    } catch (error: any) {
      throw new Error(`${provider} API error: ${error.message}`);
    }
  }

  private async handleRegularResponse(
    provider: AIProvider,
    url: string,
    headers: Record<string, string>,
    body: Record<string, any>
  ): Promise<AIResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    if (provider === 'ollama') {
      return {
        content: data.message?.content || '',
        provider: 'ollama',
        model: data.model || 'llama3.2'
      };
    }

    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: provider as AIProvider,
      model: data.model,
      usage: data.usage
    };
  }

  private async handleStreamResponse(
    provider: AIProvider,
    url: string,
    headers: Record<string, string>,
    body: Record<string, any>,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to read response stream');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let resultModel = body.model;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            
            if (provider === 'ollama') {
              const content = data.message?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
              if (data.model) resultModel = data.model;
            } else {
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
              if (data.model) resultModel = data.model;
            }
          } catch {}
        }
      }
    }

    return {
      content: fullContent,
      provider: provider as AIProvider,
      model: resultModel
    };
  }

  private getDefaultModel(provider: AIProvider): string {
    const defaults: Record<AIProvider, string> = {
      openai: 'gpt-4o',
      grok: 'grok-2-1212',
      openrouter: 'openai/gpt-4o-mini',
      qwen: 'qwen-turbo',
      ollama: 'llama3.2'
    };
    return defaults[provider];
  }

  async testConnection(provider: AIProvider, config: ProviderConfig): Promise<boolean> {
    try {
      if (provider === 'ollama') {
        const response = await fetch(`${config.baseUrl || 'http://localhost:11434'}/api/tags`, {
          method: 'GET'
        });
        return response.ok;
      }

      const response = await fetch(`${API_ENDPOINTS[provider].baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getProviderDisplayName(provider: AIProvider): string {
    const names: Record<AIProvider, string> = {
      openai: 'OpenAI',
      grok: 'Grok (xAI)',
      openrouter: 'OpenRouter',
      qwen: 'Qwen (Alibaba)',
      ollama: 'Ollama (Local)'
    };
    return names[provider];
  }

  getProviderModels(provider: AIProvider): string[] {
    const models: Record<AIProvider, string[]> = {
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      grok: ['grok-2-1212', 'grok-2-vision-1212', 'grok-beta'],
      openrouter: ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5'],
      qwen: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-vl-max'],
      ollama: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3']
    };
    return models[provider];
  }
}

export const aiService = AIService.getInstance();
