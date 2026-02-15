import React from 'react';
import { ChatMessage as ChatMessageType, FileAttachment } from '../types';
import { fileProcessingService } from '../services/fileProcessing';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="message message-system">
        <div className="message-content">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`message message-${message.role}`}>
      <div className="message-avatar">
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-body">
        <div className="message-header">
          <span className="message-role">
            {message.role === 'user' ? 'You' : 'AI'}
          </span>
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map(attachment => (
              <AttachmentDisplay key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        
        <div className="message-content">
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const AttachmentDisplay: React.FC<{ attachment: FileAttachment }> = ({ attachment }) => {
  const icon = fileProcessingService.getFileIcon(attachment.type);
  const size = fileProcessingService.formatFileSize(attachment.size);

  if (attachment.type === 'image') {
    return (
      <div className="attachment-item attachment-image">
        <img src={attachment.content} alt={attachment.name} />
        <div className="attachment-info">
          <span>{icon} {attachment.name}</span>
          <span>{size}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="attachment-item">
      <span className="attachment-icon">{icon}</span>
      <span className="attachment-name">{attachment.name}</span>
      <span className="attachment-size">{size}</span>
    </div>
  );
};

interface MessageListProps {
  messages: ChatMessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-chat">
          <div className="empty-icon">💬</div>
          <h2>Welcome to SteroidChat</h2>
          <p>Send a message or attach files to get started</p>
          <p className="supported-files">
            Supported: Text, Images, PDF, JSON
          </p>
        </div>
      )}
      {messages.map(message => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
