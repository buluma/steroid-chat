import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, AIProvider, FileAttachment, AppSettings } from './types';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/ChatMessage';
import { Settings } from './components/Settings';
import { storageService } from './services/storage';
import { aiService } from './services/aiService';
import { Sentry, logger } from './sentry';
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
    await Sentry.startSpan(
      {
        op: 'app.init',
        name: 'Initialize Application',
      },
      async (span) => {
        try {
          await storageService.init();
          const s = await storageService.getSettings();
          span.setAttribute('default_provider', s.defaultProvider);
          setSettings(s);
          setCurrentProvider(s.defaultProvider);
          setIsInitialized(true);
        } catch (error) {
          Sentry.captureException(error);
          logger.error('Failed to initialize app settings');
          throw error;
        }
      },
    );
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

      const response = await Sentry.startSpan(
        {
          op: 'ui.chat.send',
          name: 'Send Chat Message',
        },
        async (span) => {
          span.setAttribute('provider', currentProvider);
          span.setAttribute('attachments_count', attachments?.length || 0);
          span.setAttribute('message_length', content.length);

          const streamingMsgId = 'streaming-' + crypto.randomUUID();
          const streamingTimestamp = Date.now();

          setStreamingMessage({
            id: streamingMsgId,
            role: 'assistant',
            content: '',
            timestamp: streamingTimestamp
          });

          return aiService.chat(currentProvider, config, chatHistory, {
            stream: true,
            onChunk: (chunk) => {
              setStreamingContent(prev => prev + chunk);
              setStreamingMessage(prev => prev ? { ...prev, content: prev.content + chunk } : null);
            }
          });
        },
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { provider: currentProvider },
      });
      logger.error(logger.fmt`Failed to send chat message for provider: ${currentProvider}`);
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

  const handleTestSentry = () => {
    Sentry.startSpan(
      {
        op: 'ui.click',
        name: 'Test Sentry Button Click',
      },
      (span) => {
        span.setAttribute('provider', currentProvider);
        span.setAttribute('source', 'header');
        try {
          throw new Error('Manual test exception from SteroidChat UI');
        } catch (error) {
          Sentry.captureException(error, {
            tags: { source: 'manual_test' },
          });
          logger.warn('Manual Sentry test event captured');
        }
      },
    );
  };

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
          <button className="header-button header-button-test" onClick={handleTestSentry} title="Test Sentry">!</button>
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
