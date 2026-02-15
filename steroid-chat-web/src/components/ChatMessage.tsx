import React from 'react';
import { ChatMessage as ChatMessageType, FileAttachment } from '../types';
import { fileProcessingService } from '../services/fileProcessing';

export const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  if (message.role === 'system') {
    return (
      <div className="message message-system">
        <div className="message-body">
          <div className="message-content">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message message-${message.role}`}>
      <div className="message-avatar">{message.role === 'user' ? '👤' : '🤖'}</div>
      <div className="message-body">
        <div className="message-header">
          <span className="message-role">{message.role === 'user' ? 'You' : 'AI'}</span>
          <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map(att => (
              <div key={att.id} className={`attachment-item ${att.type === 'image' ? 'attachment-image' : ''}`}>
                {att.type === 'image' ? <img src={att.content} alt={att.name} /> : null}
                <div className="attachment-info">
                  <span>{fileProcessingService.getFileIcon(att.type)} {att.name}</span>
                  <span>{fileProcessingService.formatFileSize(att.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="message-content">
          {message.content.split('\n').map((line, i) => <React.Fragment key={i}>{line}{i < message.content.split('\n').length - 1 && <br />}</React.Fragment>)}
        </div>
      </div>
    </div>
  );
};

export const MessageList: React.FC<{ messages: ChatMessageType[] }> = ({ messages }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-chat">
          <div className="empty-icon">💬</div>
          <h2>Welcome to SteroidChat</h2>
          <p>Send a message or attach files to get started</p>
          <p className="supported-files">Supported: Text, Images, PDF, JSON</p>
        </div>
      )}
      {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      <div ref={messagesEndRef} />
    </div>
  );
};
