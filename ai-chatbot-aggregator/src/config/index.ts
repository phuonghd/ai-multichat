export const CONFIG = {
  // Browser settings
  BROWSER: {
    HEADLESS: process.env.NODE_ENV === 'production',
    TIMEOUT: {
      PAGE_LOAD: 30000,
      SELECTOR_WAIT: 10000,
      RESPONSE_WAIT: 60000,
      STREAMING_CHECK: 2000,
    },
    ARGS: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  },

  // Application settings
  APP: {
    SESSIONS_DIR: 'sessions',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },

  // Chatbot configurations
  CHATBOTS: {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      selectors: {
        chatInput: [
          '#prompt-textarea',
          '[data-id="root"] textarea',
          'textarea[placeholder*="Message"]',
          'textarea[data-testid="textbox"]'
        ],
        submitButton: [
          '[data-testid="send-button"]',
          'button[aria-label="Send prompt"]',
          'button[data-testid="send-button"]',
          'button:has(svg[data-icon="send"])'
        ],
        responseContainer: [
          '[data-message-author-role="assistant"]',
          '.group:has([data-message-author-role="assistant"])',
          '[data-testid="conversation-turn-3"]'
        ],
        responseText: [
          '[data-message-author-role="assistant"]:last-child .markdown p',
          '[data-message-author-role="assistant"]:last-child p',
          '[data-message-author-role="assistant"]:last-child div'
        ],
        stopButton: [
          'button[aria-label="Stop generating"]',
          'button[data-testid="stop-button"]'
        ]
      }
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai',
      selectors: {
        chatInput: [
          'div[contenteditable="true"]',
          'textarea[placeholder*="Talk to Claude"]',
          '[data-testid="chat-input"]'
        ],
        submitButton: [
          'button[aria-label="Send Message"]',
          'button:has(svg[data-icon="send"])',
          '[data-testid="send-button"]'
        ],
        responseContainer: [
          '.font-claude-message',
          '[data-testid="user-input"] ~ div .prose',
          '.prose'
        ],
        responseText: [
          '.font-claude-message:last-child',
          '.prose:last-child'
        ],
        stopButton: [
          'button[aria-label="Stop"]',
          'button[data-testid="stop-button"]'
        ]
      }
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      url: 'https://gemini.google.com',
      selectors: {
        chatInput: [
          'rich-textarea[placeholder*="Enter a prompt"]',
          'textarea[placeholder*="Enter a prompt"]',
          '[data-testid="input-textarea"]'
        ],
        submitButton: [
          'button[aria-label="Send message"]',
          'button[data-testid="send-button"]',
          'button:has(svg[data-icon="send"])'
        ],
        responseContainer: [
          '.model-response-text',
          '[data-response-container]',
          '[data-testid="response"]'
        ],
        responseText: [
          '.model-response-text:last-child',
          '[data-response-container]:last-child .markdown p'
        ],
        stopButton: [
          'button[aria-label="Stop generating"]',
          'button[data-testid="stop-button"]'
        ]
      }
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      url: 'https://www.perplexity.ai',
      selectors: {
        chatInput: [
          'textarea[placeholder*="Ask anything"]',
          'textarea[placeholder*="Follow up"]',
          '[data-testid="search-input"]'
        ],
        submitButton: [
          'button[aria-label="Submit"]',
          'button:has(svg[data-icon="arrow-right"])',
          '[data-testid="submit-button"]'
        ],
        responseContainer: [
          '.prose',
          '[data-testid="answer"]',
          '[data-testid="response"]'
        ],
        responseText: [
          '.prose:last-child',
          '[data-testid="answer"]:last-child'
        ],
        stopButton: [
          'button[aria-label="Stop"]',
          'button[data-testid="stop-button"]'
        ]
      }
    }
  }
} as const;

export type ChatBotId = keyof typeof CONFIG.CHATBOTS;
export type ChatBotConfigType = typeof CONFIG.CHATBOTS[ChatBotId];