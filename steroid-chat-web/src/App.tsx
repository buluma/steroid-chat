import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, AIProvider, FileAttachment, AppSettings } from './types';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/ChatMessage';
import { Settings } from './components/Settings';
import { storageService } from './services/storage';
import { aiService } from './services/aiService';
import './App.css';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('openai'); // Default value will be overridden by useEffect
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => { initApp(); }, []);

  const initApp = async () => {
    await storageService.init();
    const s = await storageService.getSettings();
    setSettings(s);
    setCurrentProvider(s.defaultProvider);
    setIsInitialized(true);
  };

  const handleSend = useCallback(async (content: string, attachments?: FileAttachment[]) => {
    if (!content.trim() && !attachments?.length || !isInitialized || !settings) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');
    setStreamingMessage(null);

    const chatHistory = [...messages, userMessage];

    try {
      const config = settings.providers[currentProvider];
      if (!config) throw new Error('Provider not configured');

      // Create a streaming message with a stable ID and timestamp
      const streamingMsgId = 'streaming-' + crypto.randomUUID();
      const streamingTimestamp = Date.now();
      
      setStreamingMessage({
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        timestamp: streamingTimestamp
      });

      const response = await aiService.chat(currentProvider, config, chatHistory, {
        stream: true,
        onChunk: (chunk) => {
          setStreamingContent(prev => prev + chunk);
          setStreamingMessage(prev => prev ? { ...prev, content: prev.content + chunk } : null);
        }
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      setStreamingMessage(null);
    }
  }, [messages, currentProvider, settings, isInitialized]);

  if (!isInitialized || !settings) {
    return (
      <div className="app">
        <div className="app-loading">Loading SteroidChat...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>SteroidChat</h1>
          <span className="provider-badge">{aiService.getProviderDisplayName(currentProvider)}</span>
        </div>
        <div className="header-right">
          <button className="header-button" onClick={() => setMessages([])} title="New Chat">+</button>
          <button className="header-button" onClick={() => setSettingsOpen(true)} title="Settings">*</button>
        </div>
      </header>

      <main className="app-main">
        <MessageList messages={streamingMessage ? [...messages, streamingMessage] : messages} />
      </main>

      <footer className="app-footer">
        <ChatInput onSend={handleSend} onProviderChange={setCurrentProvider} currentProvider={currentProvider} disabled={isLoading} />
      </footer>

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
