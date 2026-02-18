import { AIProvider, ChatMessage, AIResponse, ProviderConfig } from "../types";
import { Sentry, logger } from "../sentry";

const API_ENDPOINTS: Record<AIProvider, { baseUrl: string; chat: string }> = {
  openai: { baseUrl: "https://api.openai.com/v1", chat: "/chat/completions" },
  grok: { baseUrl: "https://api.x.ai/v1", chat: "/chat/completions" },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    chat: "/chat/completions",
  },
  qwen: {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    chat: "/chat/completions",
  },
  ollama: { baseUrl: "http://localhost:11434", chat: "/api/chat" },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    chat: "/chat/completions",
  },
  mistral: { baseUrl: "https://api.mistral.ai/v1", chat: "/chat/completions" },
  together: {
    baseUrl: "https://api.together.xyz/v1",
    chat: "/chat/completions",
  },
  lmstudio: { baseUrl: "http://localhost:1234/v1", chat: "/chat/completions" },
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
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  // Handles streaming formats where JSON objects may be concatenated
  // without separators (e.g. `{...}{...}`) or wrapped as SSE lines.
  private extractJsonObjects(buffer: string): {
    objects: Record<string, any>[];
    remaining: string;
  } {
    const objects: Record<string, any>[] = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let lastConsumed = 0;

    for (let i = 0; i < buffer.length; i += 1) {
      const ch = buffer[i];

      if (start === -1) {
        if (ch === "{") {
          start = i;
          depth = 1;
        }
        continue;
      }

      if (inString) {
        if (escapeNext) {
          escapeNext = false;
        } else if (ch === "\\") {
          escapeNext = true;
        } else if (ch === "\"") {
          inString = false;
        }
        continue;
      }

      if (ch === "\"") {
        inString = true;
        continue;
      }

      if (ch === "{") {
        depth += 1;
        continue;
      }

      if (ch === "}") {
        depth -= 1;
        if (depth === 0 && start !== -1) {
          const jsonCandidate = buffer.slice(start, i + 1);
          try {
            const parsed = JSON.parse(jsonCandidate);
            objects.push(parsed);
            lastConsumed = i + 1;
          } catch {
            // Keep this segment for the next chunk if parsing is incomplete.
            return { objects, remaining: buffer.slice(start) };
          }
          start = -1;
        }
      }
    }

    if (start !== -1) {
      return { objects, remaining: buffer.slice(start) };
    }

    return { objects, remaining: buffer.slice(lastConsumed) };
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
      signal?: AbortSignal;
    } = {},
  ): Promise<AIResponse> {
    const endpoint = this.getEndpointConfig(provider);
    const {
      model,
      temperature = 0.7,
      maxTokens = 4096,
      stream = false,
      onChunk,
      signal,
    } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (provider !== "ollama" && provider !== "lmstudio") {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://steroidchat.app";
      headers["X-Title"] = "SteroidChat";
    }

    const body: Record<string, any> = {
      messages: this.buildMessages(messages),
      model: model || config.model || this.getDefaultModel(provider),
      temperature,
      max_tokens: maxTokens,
      stream,
    };

    if (provider === "ollama" || provider === "lmstudio") {
      body.stream = stream;
    }

    const url = `${endpoint.baseUrl}${endpoint.chat}`;

    return Sentry.startSpan(
      {
        op: "ai.chat",
        name: `${provider} chat completion`,
      },
      async (span) => {
        span.setAttribute("provider", provider);
        span.setAttribute("stream", stream);
        span.setAttribute("message_count", messages.length);
        try {
          if (stream && onChunk) {
            return await this.handleStreamResponse(
              provider,
              url,
              headers,
              body,
              onChunk,
              signal,
            );
          } else {
            return await this.handleRegularResponse(
              provider,
              url,
              headers,
              body,
              signal,
            );
          }
        } catch (error: any) {
          Sentry.captureException(error, {
            tags: { provider, stream: String(stream) },
          });
          logger.error(
            logger.fmt`AI chat request failed for provider: ${provider}`,
          );

          const displayName = this.getProviderDisplayName(provider);
          if (error.name === "AbortError") {
            throw new Error("Request cancelled");
          }
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError")
          ) {
            if (provider === "ollama") {
              throw new Error("Cannot connect to Ollama. Is it running?");
            }
            if (provider === "lmstudio") {
              throw new Error("Cannot connect to LM Studio. Is it running?");
            }
          }
          throw new Error(`${displayName}: ${error.message}`);
        }
      },
    );
  }

  private async handleRegularResponse(
    provider: AIProvider,
    url: string,
    headers: Record<string, string>,
    body: Record<string, any>,
    signal?: AbortSignal,
  ): Promise<AIResponse> {
    const endpointPath = new URL(url).pathname;
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `POST ${endpointPath}`,
      },
      async (span) => {
        span.setAttribute("provider", provider);
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal,
        });

        span.setAttribute("http.status_code", response.status);

        if (!response.ok) {
          const error = await response.text();
          if (response.status === 401) {
            throw new Error("Invalid API key. Please check your Settings.");
          }
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          }
          throw new Error(`Error ${response.status}: ${error.substring(0, 100)}`);
        }

        const data = await response.json();

        if (provider === "ollama") {
          return {
            content: data.message?.content || "",
            provider: "ollama",
            model: data.model || "llama3.2",
          };
        }

        return {
          content: data.choices?.[0]?.message?.content || "",
          provider: provider,
          model: data.model,
          usage: data.usage,
        };
      },
    );
  }

  private async handleStreamResponse(
    provider: AIProvider,
    url: string,
    headers: Record<string, string>,
    body: Record<string, any>,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<AIResponse> {
    const endpointPath = new URL(url).pathname;
    return Sentry.startSpan(
      {
        op: "http.client",
        name: `POST ${endpointPath} (stream)`,
      },
      async (span) => {
        span.setAttribute("provider", provider);
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal,
        });

        span.setAttribute("http.status_code", response.status);

        if (!response.ok) {
          const error = await response.text();
          if (response.status === 401) {
            throw new Error("Invalid API key. Please check your Settings.");
          }
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          }
          throw new Error(`Error ${response.status}: ${error.substring(0, 100)}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to read response stream");
        }

        const decoder = new TextDecoder();
        let fullContent = "";
        let resultModel = body.model;
        let streamBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const { objects, remaining } = this.extractJsonObjects(streamBuffer);
          streamBuffer = remaining;

          for (const data of objects) {
            if (provider === "ollama" || provider === "lmstudio") {
              const content = data.message?.content || data.response || "";
              if (content) {
                fullContent += content;
                onChunk(content);
              }
              if (data.model) resultModel = data.model;
            } else {
              const content = data.choices?.[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                onChunk(content);
              }
              if (data.model) resultModel = data.model;
            }
          }
        }

        streamBuffer += decoder.decode();
        const { objects: tailObjects } = this.extractJsonObjects(streamBuffer);
        for (const data of tailObjects) {
          if (provider === "ollama" || provider === "lmstudio") {
            const content = data.message?.content || data.response || "";
            if (content) {
              fullContent += content;
              onChunk(content);
            }
            if (data.model) resultModel = data.model;
          } else {
            const content = data.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              onChunk(content);
            }
            if (data.model) resultModel = data.model;
          }
        }

        return {
          content: fullContent,
          provider: provider,
          model: resultModel,
        };
      },
    );
  }

  private getDefaultModel(provider: AIProvider): string {
    const defaults: Record<AIProvider, string> = {
      openai: "gpt-4o",
      grok: "grok-2-1212",
      openrouter: "openai/gpt-4o-mini",
      qwen: "qwen-turbo",
      ollama: "llama3.2",
      deepseek: "deepseek-chat",
      mistral: "mistral-small-latest",
      together: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      lmstudio: "llama-3.3-70b-instruct",
    };
    return defaults[provider];
  }

  async testConnection(
    provider: AIProvider,
    config: ProviderConfig,
  ): Promise<boolean> {
    try {
      if (provider === "ollama") {
        const response = await fetch(
          `${config.baseUrl || "http://localhost:11434"}/api/tags`,
          { method: "GET" },
        );
        return response.ok;
      }
      if (provider === "lmstudio") {
        const response = await fetch(
          `${config.baseUrl || "http://localhost:1234"}/models`,
          { method: "GET" },
        );
        return response.ok;
      }

      const response = await fetch(
        `${API_ENDPOINTS[provider].baseUrl}/models`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${config.apiKey}` },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  getProviderDisplayName(provider: AIProvider): string {
    const names: Record<AIProvider, string> = {
      openai: "OpenAI",
      grok: "Grok (xAI)",
      openrouter: "OpenRouter",
      qwen: "Qwen (Alibaba)",
      ollama: "Ollama (Local)",
      deepseek: "DeepSeek",
      mistral: "Mistral AI",
      together: "Together AI",
      lmstudio: "LM Studio",
    };
    return names[provider];
  }

  async getProviderModels(
    provider: AIProvider,
    config: ProviderConfig,
  ): Promise<string[]> {
    const displayName = this.getProviderDisplayName(provider);

    if (provider === "ollama") {
      const baseUrl = config.baseUrl || "http://localhost:11434";
      try {
        const response = await fetch(`${baseUrl}/api/tags`, { method: "GET" });
        if (!response.ok) {
          if (response.status === 0 || response.status === 404) {
            throw new Error(
              `Cannot connect to Ollama at ${baseUrl}. Is Ollama running?`,
            );
          }
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          return data.models.map(
            (model: any) => model.name || model.model || "",
          );
        }
        return [];
      } catch (e: any) {
        if (
          e.message.includes("Failed to fetch") ||
          e.message.includes("NetworkError")
        ) {
          throw new Error(
            `Cannot connect to Ollama at ${baseUrl}. Is Ollama running?`,
          );
        }
        throw e;
      }
    }

    if (provider === "lmstudio") {
      const baseUrl = config.baseUrl || "http://localhost:1234";
      try {
        const response = await fetch(`${baseUrl}/models`, { method: "GET" });
        if (!response.ok) {
          if (response.status === 0 || response.status === 404) {
            throw new Error(
              `Cannot connect to LM Studio at ${baseUrl}. Is LM Studio running?`,
            );
          }
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((model: any) => model.id || model.model || "");
        }
        return [];
      } catch (e: any) {
        if (
          e.message.includes("Failed to fetch") ||
          e.message.includes("NetworkError")
        ) {
          throw new Error(
            `Cannot connect to LM Studio at ${baseUrl}. Is LM Studio running?`,
          );
        }
        throw e;
      }
    }

    if (!config.apiKey) {
      throw new Error(
        `API key required for ${displayName}. Please enter your API key in Settings.`,
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
    };

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://steroidchat.app";
      headers["X-Title"] = "SteroidChat";
    }

    const endpoint = this.getEndpointConfig(provider);
    const response = await fetch(`${endpoint.baseUrl}/models`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          `Invalid API key for ${displayName}. Please check your API key in Settings.`,
        );
      }
      if (response.status === 403) {
        throw new Error(
          `Access forbidden for ${displayName}. Check your API key permissions.`,
        );
      }
      if (response.status === 429) {
        throw new Error(
          `Rate limit exceeded for ${displayName}. Please try again later.`,
        );
      }
      throw new Error(`${displayName} error: ${response.status}`);
    }

    const data = await response.json();

    // Different providers return models in different formats
    if (data.data && Array.isArray(data.data)) {
      // OpenAI, OpenRouter, Together, Mistral format
      return data.data.map((model: any) => model.id || model.model || "");
    } else if (Array.isArray(data)) {
      // Alternative format
      return data.map(
        (model: any) => model.id || model.model || model.name || "",
      );
    } else if (data.models && Array.isArray(data.models)) {
      // Another possible format
      return data.models.map(
        (model: any) => model.id || model.model || model.name || "",
      );
    }

    return [];
  }
}

export const aiService = AIService.getInstance();
