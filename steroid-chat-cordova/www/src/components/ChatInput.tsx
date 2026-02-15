import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileAttachment, AIProvider } from '../types';
import { fileProcessingService } from '../services/fileProcessing';

interface ChatInputProps {
  onSend: (content: string, attachments?: FileAttachment[]) => void;
  onProviderChange: (provider: AIProvider) => void;
  currentProvider: AIProvider;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onProviderChange,
  currentProvider,
  disabled
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    try {
      const processed = await Promise.all(
        Array.from(files).map(file => fileProcessingService.processFile(file))
      );
      setAttachments(prev => [...prev, ...processed]);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || disabled) return;

    onSend(message, attachments);
    setMessage('');
    setAttachments([]);
  };

  const providers: { value: AIProvider; label: string }[] = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'grok', label: 'Grok' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'qwen', label: 'Qwen' },
    { value: 'ollama', label: 'Ollama' }
  ];

  return (
    <div className="chat-input-container">
      {attachments.length > 0 && (
        <div className="attachments-preview">
          {attachments.map(attachment => (
            <div key={attachment.id} className="attachment-chip">
              <span className="attachment-icon">
                {fileProcessingService.getFileIcon(attachment.type)}
              </span>
              <span className="attachment-name">{attachment.name}</span>
              <button
                type="button"
                className="attachment-remove"
                onClick={() => removeAttachment(attachment.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-row">
          <button
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
          >
            📎
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".txt,.md,.log,.csv,.js,.ts,.py,.html,.css,.json,.xml,.yaml,.yml,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.pdf"
            style={{ display: 'none' }}
          />

          <select
            className="provider-select"
            value={currentProvider}
            onChange={(e) => onProviderChange(e.target.value as AIProvider)}
            disabled={disabled}
          >
            {providers.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <input
            type="text"
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={disabled || isProcessing}
          />

          <button
            type="submit"
            className="send-button"
            disabled={disabled || isProcessing || (!message.trim() && attachments.length === 0)}
          >
            {isProcessing ? '⏳' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
};
