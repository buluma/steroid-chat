import { AIProvider, ProviderConfig, AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  defaultProvider: 'ollama',
  providers: {
    openai: { provider: 'openai', apiKey: 'YOUR_OPENAI_API_KEY', model: 'gpt-4o' },
    grok: { provider: 'grok', apiKey: 'YOUR_GROK_API_KEY', model: 'grok-2-1212' },
    openrouter: { provider: 'openrouter', apiKey: 'YOUR_OPENROUTER_API_KEY', model: 'openai/gpt-4o-mini' },
    qwen: { provider: 'qwen', apiKey: 'YOUR_QWEN_API_KEY', model: 'qwen-turbo' },
    ollama: { provider: 'ollama', apiKey: '', baseUrl: 'http://localhost:11434', model: 'llama3.2' },
    deepseek: { provider: 'deepseek', apiKey: 'YOUR_DEEPSEEK_API_KEY', model: 'deepseek-chat' },
    mistral: { provider: 'mistral', apiKey: 'YOUR_MISTRAL_API_KEY', model: 'mistral-small-latest' },
    together: { provider: 'together', apiKey: 'YOUR_TOGETHER_API_KEY', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
    lmstudio: { provider: 'lmstudio', apiKey: '', baseUrl: 'http://localhost:1234/v1', model: 'llama-3.3-70b-instruct' }
  },
  theme: 'system'
};

export class StorageService {
  private static instance: StorageService;
  private cache: AppSettings | null = null;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async init(): Promise<void> {
    const stored = localStorage.getItem('steroidchat_settings');
    if (!stored) {
      await this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  async getSettings(): Promise<AppSettings> {
    if (this.cache) return this.cache;
    try {
      const stored = localStorage.getItem('steroidchat_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = { ...DEFAULT_SETTINGS, ...parsed };
        for (const key of Object.keys(DEFAULT_SETTINGS.providers) as AIProvider[]) {
          if (!this.cache!.providers[key]) {
            this.cache!.providers[key] = DEFAULT_SETTINGS.providers[key];
          }
        }
      } else {
        this.cache = DEFAULT_SETTINGS;
      }
    } catch {
      this.cache = DEFAULT_SETTINGS;
    }
    return this.cache!;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.cache = settings;
    localStorage.setItem('steroidchat_settings', JSON.stringify(settings));
  }

  async getApiKey(provider: AIProvider): Promise<string> {
    const settings = await this.getSettings();
    return settings.providers[provider].apiKey;
  }

  async setApiKey(provider: AIProvider, apiKey: string): Promise<void> {
    const settings = await this.getSettings();
    settings.providers[provider].apiKey = apiKey;
    await this.saveSettings(settings);
  }

  async getProviderConfig(provider: AIProvider): Promise<ProviderConfig> {
    const settings = await this.getSettings();
    return settings.providers[provider];
  }

  async setProviderConfig(provider: AIProvider, config: Partial<ProviderConfig>): Promise<void> {
    const settings = await this.getSettings();
    settings.providers[provider] = { ...settings.providers[provider], ...config };
    await this.saveSettings(settings);
  }

  async getDefaultProvider(): Promise<AIProvider> {
    const settings = await this.getSettings();
    return settings.defaultProvider;
  }

  async setDefaultProvider(provider: AIProvider): Promise<void> {
    const settings = await this.getSettings();
    settings.defaultProvider = provider;
    await this.saveSettings(settings);
  }

  async getChatHistory(): Promise<{ id: string; messages: any[] }[]> {
    try {
      const stored = localStorage.getItem('steroidchat_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  async saveChatHistory(chats: { id: string; messages: any[] }[]): Promise<void> {
    localStorage.setItem('steroidchat_history', JSON.stringify(chats));
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem('steroidchat_settings');
    localStorage.removeItem('steroidchat_history');
    this.cache = null;
  }
}

export const storageService = StorageService.getInstance();
