import { AIProvider, ProviderConfig, AppSettings } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'steroidchat_settings',
  OPENAI_KEY: 'steroidchat_openai_key',
  GROK_KEY: 'steroidchat_grok_key',
  OPENROUTER_KEY: 'steroidchat_openrouter_key',
  QWEN_KEY: 'steroidchat_qwen_key',
  OLLAMA_URL: 'steroidchat_ollama_url',
  CHAT_HISTORY: 'steroidchat_history'
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultProvider: 'openai',
  providers: {
    openai: {
      provider: 'openai',
      apiKey: 'YOUR_OPENAI_API_KEY',
      model: 'gpt-4o'
    },
    grok: {
      provider: 'grok',
      apiKey: 'YOUR_GROK_API_KEY',
      model: 'grok-2-1212'
    },
    openrouter: {
      provider: 'openrouter',
      apiKey: 'YOUR_OPENROUTER_API_KEY',
      model: 'openai/gpt-4o-mini'
    },
    qwen: {
      provider: 'qwen',
      apiKey: 'YOUR_QWEN_API_KEY',
      model: 'qwen-turbo'
    },
    ollama: {
      provider: 'ollama',
      apiKey: '',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    }
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
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      await this.saveSettings(DEFAULT_SETTINGS);
    }
  }

  async getSettings(): Promise<AppSettings> {
    if (this.cache) return this.cache;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        this.cache = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
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
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async saveChatHistory(chats: { id: string; messages: any[] }[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chats));
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    this.cache = null;
  }

  isKeyConfigured(provider: AIProvider, apiKey: string): boolean {
    if (provider === 'ollama') return true;
    return !!apiKey && apiKey !== `YOUR_${provider.toUpperCase()}_API_KEY`;
  }
}

export const storageService = StorageService.getInstance();
