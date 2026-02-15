# SteroidChat - AI Chat Application

A Cordova-based mobile/web application that integrates multiple AI providers (OpenAI, Grok, OpenRouter, Qwen, and Ollama) with support for text, images, PDF, and JSON file processing.

## Features

- **Multi-Provider Support**: OpenAI, Grok (xAI), OpenRouter, Qwen (Alibaba), Ollama (Local)
- **File Processing**: Text, Images (base64), PDF, JSON
- **Streaming Responses**: Real-time token-by-token display
- **Secure Storage**: API keys stored in local storage
- **Cross-Platform**: Web, Android, iOS

## Project Structure

```
steroid-chat-cordova/
├── www/
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── services/       # AI providers & file processing
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx        # Main application
│   │   └── App.css        # Styles
│   ├── dist/              # Built assets
│   └── index.html         # Entry point
├── platforms/             # Cordova platforms
├── plugins/               # Cordova plugins
└── config.xml            # Cordova configuration
```

## Setup

### 1. Install Dependencies

```bash
cd steroid-chat-cordova
npm install
```

### 2. Install Android SDK

For Android builds, install Android SDK:

```bash
# Option 1: Using Homebrew (macOS)
brew install android-sdk
# Then add to ~/.zshrc or ~/.bashrc:
# export ANDROID_HOME=/opt/homebrew/share/android-sdk
# export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Option 2: Manual download
# Download from https://developer.android.com/studio
```

### 3. Build for Android

```bash
# Add Android platform
cordova platform add android

# Build debug APK
cordova build android

# Or run on connected device
cordova run android
```

### 4. Build for Browser (Development)

```bash
cd www
npm run dev
```

## API Keys Configuration

Edit `www/src/services/storage.ts` or use the in-app Settings to configure:

| Provider | Required | Default Model |
|----------|----------|---------------|
| OpenAI | API Key | gpt-4o |
| Grok | API Key | grok-2-1212 |
| OpenRouter | API Key | openai/gpt-4o-mini |
| Qwen | API Key | qwen-turbo |
| Ollama | Base URL only | llama3.2 |

### Getting API Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **Grok (xAI)**: https://console.x.ai
- **OpenRouter**: https://openrouter.ai/keys
- **Qwen (Alibaba)**: https://dashscope.console.aliyun.com
- **Ollama**: Install locally from https://ollama.ai

## Supported File Types

- **Text**: .txt, .md, .log, .csv, .js, .ts, .py, .html, .css
- **JSON**: .json
- **Images**: .jpg, .jpeg, .png, .gif, .webp, .bmp, .svg
- **PDF**: .pdf

## Technologies Used

- **Frontend**: React 19 + TypeScript + Vite
- **Mobile**: Apache Cordova
- **AI Integration**: OpenAI-compatible APIs
- **File Processing**: Native JavaScript APIs
