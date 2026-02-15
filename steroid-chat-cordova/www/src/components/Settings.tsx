import React, { useState, useEffect } from 'react';
import { AIProvider, ProviderConfig, AppSettings } from '../types';
import { storageService } from '../services/storage';
import { aiService } from '../services/aiService';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'providers' | 'general'>('providers');
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);
  const [testResult, setTestResult] = useState<{ provider: AIProvider; success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await storageService.getSettings();
    setSettings(s);
  };

  const handleApiKeyChange = async (provider: AIProvider, apiKey: string) => {
    if (!settings) return;
    const newProviders = {
      ...settings.providers,
      [provider]: { ...settings.providers[provider], apiKey }
    };
    setSettings({ ...settings, providers: newProviders });
  };

  const handleModelChange = async (provider: AIProvider, model: string) => {
    if (!settings) return;
    const newProviders = {
      ...settings.providers,
      [provider]: { ...settings.providers[provider], model }
    };
    setSettings({ ...settings, providers: newProviders });
  };

  const handleBaseUrlChange = async (provider: AIProvider, baseUrl: string) => {
    if (!settings) return;
    const newProviders = {
      ...settings.providers,
      [provider]: { ...settings.providers[provider], baseUrl }
    };
    setSettings({ ...settings, providers: newProviders });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await storageService.saveSettings(settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: AIProvider) => {
    if (!settings) return;
    setTestingProvider(provider);
    setTestResult(null);

    const config = settings.providers[provider];
    const success = await aiService.testConnection(provider, config);

    setTestResult({
      provider,
      success,
      message: success ? 'Connection successful!' : 'Connection failed. Check your settings.'
    });
    setTestingProvider(null);
  };

  const handleDefaultProviderChange = async (provider: AIProvider) => {
    if (!settings) return;
    setSettings({ ...settings, defaultProvider: provider });
  };

  const providers: { key: AIProvider; name: string; hasApiKey: boolean; hasModel: boolean; hasBaseUrl: boolean }[] = [
    { key: 'openai', name: 'OpenAI', hasApiKey: true, hasModel: true, hasBaseUrl: false },
    { key: 'grok', name: 'Grok (xAI)', hasApiKey: true, hasModel: true, hasBaseUrl: false },
    { key: 'openrouter', name: 'OpenRouter', hasApiKey: true, hasModel: true, hasBaseUrl: false },
    { key: 'qwen', name: 'Qwen (Alibaba)', hasApiKey: true, hasModel: true, hasBaseUrl: false },
    { key: 'ollama', name: 'Ollama (Local)', hasApiKey: false, hasModel: true, hasBaseUrl: true }
  ];

  if (!isOpen || !settings) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'providers' ? 'active' : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            API Providers
          </button>
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'providers' && (
            <div className="providers-list">
              {providers.map(p => (
                <div key={p.key} className="provider-section">
                  <div className="provider-header">
                    <h3>{p.name}</h3>
                    <button
                      className="test-button"
                      onClick={() => handleTestConnection(p.key)}
                      disabled={testingProvider === p.key}
                    >
                      {testingProvider === p.key ? 'Testing...' : 'Test'}
                    </button>
                  </div>

                  {testResult?.provider === p.key && (
                    <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                      {testResult.message}
                    </div>
                  )}

                  {p.hasApiKey && (
                    <div className="setting-field">
                      <label>API Key</label>
                      <input
                        type="password"
                        value={settings.providers[p.key].apiKey}
                        onChange={e => handleApiKeyChange(p.key, e.target.value)}
                        placeholder={p.key === 'ollama' ? 'No key needed' : `Enter ${p.name} API key`}
                      />
                    </div>
                  )}

                  {p.hasModel && (
                    <div className="setting-field">
                      <label>Model</label>
                      <select
                        value={settings.providers[p.key].model}
                        onChange={e => handleModelChange(p.key, e.target.value)}
                      >
                        {aiService.getProviderModels(p.key).map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {p.hasBaseUrl && (
                    <div className="setting-field">
                      <label>Base URL</label>
                      <input
                        type="text"
                        value={settings.providers[p.key].baseUrl || ''}
                        onChange={e => handleBaseUrlChange(p.key, e.target.value)}
                        placeholder="http://localhost:11434"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="general-settings">
              <div className="setting-field">
                <label>Default Provider</label>
                <select
                  value={settings.defaultProvider}
                  onChange={e => handleDefaultProviderChange(e.target.value as AIProvider)}
                >
                  {providers.map(p => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="setting-field">
                <label>Theme</label>
                <select
                  value={settings.theme}
                  onChange={e => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="save-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
