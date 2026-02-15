# SteroidChat

A cross-platform AI chat application built with Cordova and React that integrates multiple AI providers. Supports text, images, PDF, and JSON file processing with streaming responses.

## Overview

SteroidChat allows you to chat with various AI models from different providers through a single, unified interface. Whether you prefer OpenAI's GPT models, xAI's Grok, OpenRouter's aggregated APIs, Alibaba's Qwen, or running local models with Ollama - SteroidChat has you covered.

## Features

- **Multi-Provider Support**: Connect to 5 different AI providers
- **File Attachments**: Support for text, images, PDF, and JSON files
- **Streaming Responses**: Real-time token-by-token AI responses
- **Provider Switching**: Switch between AI providers instantly
- **Dark/Light Mode**: Automatically follows system theme
- **Offline Support**: Works with Ollama without internet

## Supported AI Providers

| Provider | Description | API Key Required |
|----------|-------------|------------------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-3.5 Turbo | Yes |
| Grok | Grok-2, Grok-2 Vision (xAI) | Yes |
| OpenRouter | 200+ models from multiple providers | Yes |
| Qwen | Qwen Turbo, Plus, Max (Alibaba) | Yes |
| Ollama | Local AI models (Llama, Mistral, etc.) | No |

## Supported File Types

| Type | Extensions | Description |
|------|------------|-------------|
| Text | .txt, .md, .log, .csv, .js, .ts, .py, .html, .css | Raw text files |
| JSON | .json | JavaScript Object Notation |
| Images | .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg | Image files (base64 encoded) |
| PDF | .pdf | PDF documents |

## Project Structure

```
steroid-chat/
├── steroid-chat-web/              # React web application source
│   ├── src/
│   │   ├── components/            # React UI components
│   │   │   ├── ChatInput.tsx      # Message input & file attachment
│   │   │   ├── ChatMessage.tsx    # Message display
│   │   │   └── Settings.tsx       # Configuration panel
│   │   ├── services/              # Business logic
│   │   │   ├── aiService.ts       # AI provider integration
│   │   │   ├── fileProcessing.ts  # File handling
│   │   │   └── storage.ts         # Local storage
│   │   ├── types/                 # TypeScript definitions
│   │   ├── App.tsx                # Main application
│   │   └── App.css                # Styles
│   └── dist/                      # Built web assets
│
└── steroid-chat-cordova/          # Cordova mobile app
    ├── www/                       # Web assets for mobile
    ├── platforms/                 # Mobile platform files
    ├── plugins/                   # Cordova plugins
    └── config.xml                 # App configuration
```

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- For Android: Android SDK
- For iOS: Xcode (macOS only)

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   cd steroid-chat-web
   npm install
   ```

2. **Run in browser (development):**
   ```bash
   npm run dev
   ```

3. **Build Android APK:**
   ```bash
   cd ../steroid-chat-cordova
   npm install
   ./node_modules/.bin/cordova build android
   ```

## Configuration

### Getting API Keys

| Provider | Website | Notes |
|----------|---------|-------|
| OpenAI | https://platform.openai.com/api-keys | Get free credits on signup |
| Grok | https://console.x.ai | Requires xAI account |
| OpenRouter | https://openrouter.ai/keys | Free tier available |
| Qwen | https://dashscope.console.aliyun.com | Alibaba Cloud |
| Ollama | https://ollama.ai | Install locally, no API key needed |

### Configuring Providers

1. Open the app
2. Tap the **Settings** icon (⚙️)
3. Enter your API key for each provider
4. Select your default provider
5. Tap **Save**

### Ollama Setup (Local AI)

1. Install Ollama from https://ollama.ai
2. Run: `ollama serve`
3. Pull a model: `ollama pull llama3.2`
4. In SteroidChat, set Ollama Base URL to `http://localhost:11434`

## Usage

### Sending Messages

1. Type your message in the input field
2. Press Enter or tap the send button
3. Wait for AI response

### Attaching Files

1. Tap the **attachment** icon (📎)
2. Select one or more files
3. Files are processed and attached to your message
4. Send the message with attached files

### Switching Providers

1. Use the **dropdown** in the input area
2. Select your preferred AI provider
3. Each message uses the selected provider

### Viewing Settings

1. Tap the **settings** icon in the header
2. Configure API keys
3. Change default provider
4. Test connection to providers

## Building

### Build Commands

```bash
# Development (browser)
cd steroid-chat-web
npm run dev

# Production web build
npm run build

# Android debug APK
cd ../steroid-chat-cordova
npm install
./node_modules/.bin/cordova build android

# Android release APK (requires signing)
./node_modules/.bin/cordova build android --release

# iOS (macOS only)
./node_modules/.bin/cordova build ios
```

### APK Location

After building, find the APK at:
```
steroid-chat-cordova/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

## Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Mobile**: Apache Cordova
- **File Handling**: HTML5 File API, Cordova plugins
- **AI Integration**: OpenAI-compatible REST APIs

## License

Apache-2.0

## Troubleshooting

### API Key Not Working
- Ensure you're using the correct key format
- Check that the key hasn't expired
- Verify the provider is not blocking your IP

### Ollama Not Connecting
- Make sure Ollama is running: `ollama serve`
- Check the Base URL in settings
- For Android, use network IP (e.g., `http://192.168.1.x:11434`)

### Build Errors
- Clean and rebuild: `rm -rf platforms && cordova platform add android`
- Ensure Android SDK is properly installed
- Check Java version (JDK 11+ required)

## Future Enhancements

- Voice input/output
- Chat history persistence
- Model fine-tuning support
- Plugin system for extensions
