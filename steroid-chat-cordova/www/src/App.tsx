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
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('openai');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    await storageService.init();
    const s = await storageService.getSettings();
    setSettings(s);
    setCurrentProvider(s.defaultProvider);
  };

  const handleSend = useCallback(async (content: string, attachments?: FileAttachment[]) => {
    if (!content.trim() && !attachments?.length) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
      timestamp: Date.now(),
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    const chatHistory = [...messages, userMessage];
    
    try {
      const config = settings?.providers[currentProvider];
      if (!config) {
        throw new Error('Provider not configured');
      }

      const isStreaming = true;
      
      const response = await aiService.chat(
        currentProvider,
        config,
        chatHistory,
        {
          stream: isStreaming,
          onChunk: (chunk) => {
            setStreamingContent(prev => prev + chunk);
          }
        }
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  }, [messages, currentProvider, settings]);

  const handleProviderChange = (provider: AIProvider) => {
    setCurrentProvider(provider);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>SteroidChat</h1>
          <span className="provider-badge">{aiService.getProviderDisplayName(currentProvider)}</span>
        </div>
        <div className="header-right">
          <button className="header-button" onClick={handleNewChat} title="New Chat">+</button>
          <button className="header-button" onClick={() => setSettingsOpen(true)} title="Settings">*</button>
        </div>
      </header>

      <main className="app-main">
        <MessageList messages={streamingContent ? [...messages, {
          id: 'streaming',
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now()
        }] : messages} />
      </main>

      <footer className="app-footer">
        <ChatInput
          onSend={handleSend}
          onProviderChange={handleProviderChange}
          currentProvider={currentProvider}
          disabled={isLoading}
        />
      </footer>

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
