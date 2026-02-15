import { AIProvider, ChatRequest, AIResponse, ProviderConfig } from '../types';

export interface AIProviderService {
  name: string;
  chat(request: ChatRequest): Promise<AIResponse>;
  chatStream(request: ChatRequest, onChunk: (chunk: string) => void): Promise<AIResponse>;
  isConfigured(config: ProviderConfig): boolean;
}

export class OpenAIProvider implements AIProviderService {
  name = 'OpenAI';

  async chat(request: ChatRequest): Promise<AIResponse> {
    const config = request.messages[0]?.attachments?.[0] ? {
      apiKey: '',
      provider: 'openai' as AIProvider
    } : { apiKey: '', provider: 'openai' as AIProvider };
    
    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'gpt-4o',
        temperature: request.temperature,
        max_tokens: request.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      provider: 'openai',
      model: data.model,
      usage: data.usage
    };
  }

  async chatStream(request: ChatRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const response = await fetch('/api/openai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'gpt-4o',
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let result: AIResponse | null = null;
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          fullContent += content;
          onChunk(content);
          
          if (!result) {
            result = {
              content: fullContent,
              provider: 'openai',
              model: parsed.model || request.model || 'gpt-4o',
              usage: parsed.usage
            };
          }
        } catch {}
      }
    }
    
    return result || { content: fullContent, provider: 'openai', model: request.model || 'gpt-4o' };
  }

  isConfigured(config: ProviderConfig): boolean {
    return !!config.apiKey && config.apiKey !== 'YOUR_OPENAI_API_KEY';
  }
}

export class GrokProvider implements AIProviderService {
  name = 'Grok';

  async chat(request: ChatRequest): Promise<AIResponse> {
    const response = await fetch('/api/grok/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'grok-2-1212',
        temperature: request.temperature,
        max_tokens: request.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      provider: 'grok',
      model: data.model,
      usage: data.usage
    };
  }

  async chatStream(request: ChatRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const response = await fetch('/api/grok/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'grok-2-1212',
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let result: AIResponse | null = null;
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          fullContent += content;
          onChunk(content);
          
          if (!result) {
            result = {
              content: fullContent,
              provider: 'grok',
              model: parsed.model || request.model || 'grok-2-1212'
            };
          }
        } catch {}
      }
    }
    
    return result || { content: fullContent, provider: 'grok', model: request.model || 'grok-2-1212' };
  }

  isConfigured(config: ProviderConfig): boolean {
    return !!config.apiKey && config.apiKey !== 'YOUR_GROK_API_KEY';
  }
}

export class OpenRouterProvider implements AIProviderService {
  name = 'OpenRouter';

  async chat(request: ChatRequest): Promise<AIResponse> {
    const response = await fetch('/api/openrouter/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'openai/gpt-4o-mini',
        temperature: request.temperature,
        max_tokens: request.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      provider: 'openrouter',
      model: data.model,
      usage: data.usage
    };
  }

  async chatStream(request: ChatRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const response = await fetch('/api/openrouter/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'openai/gpt-4o-mini',
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let result: AIResponse | null = null;
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          fullContent += content;
          onChunk(content);
          
          if (!result) {
            result = {
              content: fullContent,
              provider: 'openrouter',
              model: parsed.model || request.model || 'openai/gpt-4o-mini'
            };
          }
        } catch {}
      }
    }
    
    return result || { content: fullContent, provider: 'openrouter', model: request.model || 'openai/gpt-4o-mini' };
  }

  isConfigured(config: ProviderConfig): boolean {
    return !!config.apiKey && config.apiKey !== 'YOUR_OPENROUTER_API_KEY';
  }
}

export class QwenProvider implements AIProviderService {
  name = 'Qwen';

  async chat(request: ChatRequest): Promise<AIResponse> {
    const response = await fetch('/api/qwen/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'qwen-turbo',
        temperature: request.temperature,
        max_tokens: request.maxTokens
      })
    });
    
    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      provider: 'qwen',
      model: data.model,
      usage: data.usage
    };
  }

  async chatStream(request: ChatRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const response = await fetch('/api/qwen/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'qwen-turbo',
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let result: AIResponse | null = null;
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          fullContent += content;
          onChunk(content);
          
          if (!result) {
            result = {
              content: fullContent,
              provider: 'qwen',
              model: parsed.model || request.model || 'qwen-turbo'
            };
          }
        } catch {}
      }
    }
    
    return result || { content: fullContent, provider: 'qwen', model: request.model || 'qwen-turbo' };
  }

  isConfigured(config: ProviderConfig): boolean {
    return !!config.apiKey && config.apiKey !== 'YOUR_QWEN_API_KEY';
  }
}

export class OllamaProvider implements AIProviderService {
  name = 'Ollama';
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async chat(request: ChatRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'llama3.2',
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      content: data.message.content,
      provider: 'ollama',
      model: data.model
    };
  }

  async chatStream(request: ChatRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        model: request.model || 'llama3.2',
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let result: AIResponse | null = null;
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const content = parsed.message?.content || '';
          fullContent += content;
          onChunk(content);
          
          if (!result) {
            result = {
              content: fullContent,
              provider: 'ollama',
              model: parsed.model || request.model || 'llama3.2'
            };
          }
        } catch {}
      }
    }
    
    return result || { content: fullContent, provider: 'ollama', model: request.model || 'llama3.2' };
  }

  isConfigured(config: ProviderConfig): boolean {
    return !!config.baseUrl;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      if (!response.ok) return [];
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }
}

export const aiProviders: Record<AIProvider, AIProviderService> = {
  openai: new OpenAIProvider(),
  grok: new GrokProvider(),
  openrouter: new OpenRouterProvider(),
  qwen: new QwenProvider(),
  ollama: new OllamaProvider()
};

export function getProvider(provider: AIProvider): AIProviderService {
  return aiProviders[provider];
}
