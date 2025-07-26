# AI Chatbot Aggregator

A cross-platform desktop application built with Tauri, React, and Playwright that allows you to send prompts to multiple AI chatbots simultaneously and compare their responses side-by-side.

## 🎯 Features

- **Multi-AI Support**: Interact with ChatGPT, Claude, Gemini, and Perplexity simultaneously
- **Parallel Processing**: All chatbots run concurrently for faster results
- **Session Management**: Login once, save sessions for future use
- **Modern UI**: Clean, responsive interface built with React and TailwindCSS
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↕️ Tauri Bridge
Backend (Rust)
    ↕️ Process Communication
Node.js + Playwright (AI Automation)
```

## 📁 Project Structure

```
ai-chatbot-aggregator/
├── src/                          # Frontend React app
│   ├── components/              # React components
│   │   ├── ChatBotCard.tsx     # Individual chatbot response display
│   │   ├── PromptInput.tsx     # Prompt input and chatbot selection
│   │   └── ResponseGrid.tsx    # Grid layout for responses
│   ├── ai/                     # AI chatbot automation (Node.js)
│   │   ├── base.ts            # Base chatbot class
│   │   ├── chatgpt.ts         # ChatGPT automation
│   │   ├── claude.ts          # Claude automation
│   │   ├── gemini.ts          # Gemini automation
│   │   ├── perplexity.ts      # Perplexity automation
│   │   ├── manager.ts         # AI manager coordinator
│   │   └── index.ts           # AI module exports
│   ├── services/              # Frontend services
│   │   └── tauri.ts          # Tauri API wrapper
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx               # Main React component
│   └── main.tsx              # React entry point
├── src-tauri/                # Tauri Rust backend
│   ├── src/
│   │   ├── lib.rs           # Tauri commands and main logic
│   │   └── main.rs          # Rust entry point
│   └── Cargo.toml           # Rust dependencies
├── ai-backend.js            # Node.js script for AI interactions
├── sessions/                # Playwright session storage
├── dist/                    # Compiled TypeScript output
└── package.json             # Node.js dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Rust** (latest stable)
3. **System Dependencies** (for Tauri):
   - **Linux**: `webkit2gtk-4.0-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
   - **macOS**: Xcode Command Line Tools
   - **Windows**: Microsoft C++ Build Tools

### Installation

1. **Clone and setup**:
   ```bash
   cd ai-chatbot-aggregator
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Build the backend**:
   ```bash
   npm run build:backend
   ```

### First-Time Setup

1. **Setup AI chatbot sessions** (one-time setup):
   - Run the app: `npm run tauri dev`
   - Click "Setup Sessions" button
   - Login to each chatbot manually when prompted
   - Sessions will be saved for future use

2. **Manual session setup** (alternative):
   ```bash
   node ai-backend.js --setup-sessions
   ```

### Development

```bash
# Start development server
npm run tauri dev

# Build for production
npm run tauri build

# Build backend only
npm run build:backend
```

## 🤖 Supported AI Chatbots

| Chatbot | URL | Status |
|---------|-----|--------|
| ChatGPT | https://chat.openai.com | ✅ |
| Claude | https://claude.ai | ✅ |
| Gemini | https://gemini.google.com | ✅ |
| Perplexity | https://www.perplexity.ai | ✅ |

## 💡 How It Works

1. **User Input**: Enter a prompt and select which chatbots to query
2. **Parallel Processing**: The app opens browser contexts for each selected chatbot
3. **Automation**: Playwright automates the web interfaces to send prompts
4. **Response Extraction**: AI responses are extracted and formatted
5. **Side-by-Side Display**: Results are displayed in a clean, comparable format

## 🔧 Configuration

### Adding New Chatbots

1. Create a new class in `src/ai/` extending `BaseChatBot`
2. Implement the required methods:
   - `getLoginSelectors()`: CSS selectors for the UI elements
   - `waitForResponse()`: Logic to wait for and extract the response
3. Add the chatbot to the `AIManager` constructor
4. Update the Rust backend in `src-tauri/src/lib.rs`

### Customizing Selectors

Each chatbot implementation contains CSS selectors that may need updates if the UI changes:

```typescript
getLoginSelectors() {
  return {
    chatInputSelector: 'textarea[placeholder*="Message"]',
    submitButtonSelector: 'button[aria-label="Send"]',
    responseSelector: '.response-content'
  };
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Session not found**: Re-run session setup
2. **Selector not found**: Chatbot UI may have changed, update selectors
3. **Timeout errors**: Increase timeout values in chatbot implementations
4. **Browser launch fails**: Install Playwright browsers: `npx playwright install`

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG=pw:api npm run tauri dev
```

## 🔒 Privacy & Security

- **Local Storage**: All sessions and data are stored locally
- **No API Keys**: Uses web automation, no API keys required
- **Manual Login**: You control your own authentication
- **Session Files**: Located in `sessions/` directory

## 🛣️ Roadmap

- [ ] Export responses to various formats (PDF, CSV, JSON)
- [ ] Response comparison tools
- [ ] Custom prompt templates
- [ ] Response history and search
- [ ] More AI chatbot integrations
- [ ] Batch processing for multiple prompts
- [ ] Response analytics and metrics

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This tool automates web interfaces and may break if the chatbot websites change their UI. It's intended for personal use and educational purposes. Please respect the terms of service of each AI platform.
