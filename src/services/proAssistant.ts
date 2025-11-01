// PromptsGenie Pro AI Assistant Service
// Handles communication with Gemini for context-aware guidance

import { generateWithGemini } from './promptApi';
import {
  getBaseSystemPrompt,
  getContextPrompt,
  formatConversationHistory,
  type ChatContext,
} from '../lib/proAssistantPrompts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolContext?: string;
}

export interface SendMessageOptions {
  message: string;
  context?: ChatContext;
  conversationHistory?: ChatMessage[];
}

export interface AssistantResponse {
  message: string;
  error?: string;
}

// Local storage key for conversation history
const HISTORY_STORAGE_KEY = 'promptsgenie-pro-chat-history';
const MAX_HISTORY_LENGTH = 50; // Keep last 50 messages

/**
 * Send a message to the AI assistant with context
 */
export const sendMessage = async (options: SendMessageOptions): Promise<AssistantResponse> => {
  const { message, context, conversationHistory = [] } = options;

  try {
    // Build the complete prompt
    let fullPrompt = getBaseSystemPrompt();

    // Add context if available
    if (context) {
      const contextPrompt = getContextPrompt(context);
      if (contextPrompt) {
        fullPrompt += contextPrompt;
      }
    }

    // Add conversation history for continuity
    if (conversationHistory.length > 0) {
      const formattedHistory = formatConversationHistory(
        conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        }))
      );
      fullPrompt += formattedHistory;
    }

    // Add the current user message
    fullPrompt += `\n\n**User**: ${message}\n\n**Assistant**: `;

    // Call Gemini API
    const response = await generateWithGemini(
      fullPrompt,
      'gemini-2.5-flash', // Use Gemini 2.5 Flash
      true, // Allow fallback to gemini-1.5-pro
      0.7 // Temperature for balanced creativity/accuracy
    );

    if (!response || response.trim() === '') {
      throw new Error('Empty response from AI');
    }

    return {
      message: response.trim(),
    };
  } catch (error) {
    console.error('ProAssistant error:', error);

    // User-friendly error messages
    let errorMessage = 'Sorry, I encountered an error. Please try again.';

    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'I\'m receiving too many requests right now. Please wait a moment and try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'I\'m having trouble connecting. Please check your internet connection.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'There\'s a configuration issue. Please contact support.';
      }
    }

    return {
      message: errorMessage,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Save conversation history to localStorage
 */
export const saveConversationHistory = (messages: ChatMessage[]): void => {
  try {
    // Keep only the most recent messages
    const recentMessages = messages.slice(-MAX_HISTORY_LENGTH);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(recentMessages));
  } catch (error) {
    console.error('Failed to save conversation history:', error);
  }
};

/**
 * Load conversation history from localStorage
 */
export const loadConversationHistory = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    return [];
  }
};

/**
 * Clear conversation history
 */
export const clearConversationHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear conversation history:', error);
  }
};

/**
 * Generate a unique message ID
 */
export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a user message object
 */
export const createUserMessage = (content: string, toolContext?: string): ChatMessage => {
  return {
    id: generateMessageId(),
    role: 'user',
    content,
    timestamp: Date.now(),
    toolContext,
  };
};

/**
 * Create an assistant message object
 */
export const createAssistantMessage = (content: string, toolContext?: string): ChatMessage => {
  return {
    id: generateMessageId(),
    role: 'assistant',
    content,
    timestamp: Date.now(),
    toolContext,
  };
};

/**
 * Quick actions - predefined helpful prompts
 */
export const quickActions = {
  help: {
    label: 'Help me get started',
    message: 'I\'m new to this tool. Can you explain how to use it effectively?',
  },
  optimize: {
    label: 'Optimize my input',
    message: 'Can you help me improve my current input to get better results?',
  },
  workflow: {
    label: 'Suggest next steps',
    message: 'What should I do after using this tool?',
  },
  inspiration: {
    label: 'Give me ideas',
    message: 'I\'m stuck. Can you suggest some creative directions or themes?',
  },
  compare: {
    label: 'Compare tools',
    message: 'How is this tool different from similar tools in PromptsGenie Pro?',
  },
};

/**
 * Get suggestions based on tool context
 */
export const getToolSuggestions = (toolId: string | undefined): string[] => {
  if (!toolId) {
    return [
      'Which tool should I use?',
      'Show me common workflows',
      'What are the tool categories?',
    ];
  }

  // Tool-specific suggestions
  const suggestions: Record<string, string[]> = {
    'mood-board': [
      'How many images work best?',
      'Help me pick keywords',
      'What themes work well together?',
    ],
    'style-tile': [
      'What makes a good brand description?',
      'How many adjectives should I use?',
      'Help me define my brand',
    ],
    'color-story': [
      'What are good color proportions?',
      'How do I choose a mood?',
      'Explain color psychology',
    ],
    'lookbook': [
      'How many pages should I create?',
      'Help me sequence my pages',
      'What makes a good lookbook?',
    ],
    'shot-list': [
      'How detailed should my shots be?',
      'What framing options exist?',
      'Help me plan my shoot',
    ],
    'storyboard-pro': [
      'How many frames do I need?',
      'Help me plan my story',
      'What info should each frame have?',
    ],
  };

  return suggestions[toolId] || [
    'How do I use this tool?',
    'What are best practices?',
    'Show me examples',
  ];
};

/**
 * Check if a message is a question
 */
export const isQuestion = (message: string): boolean => {
  return message.trim().endsWith('?') ||
         message.toLowerCase().startsWith('what') ||
         message.toLowerCase().startsWith('how') ||
         message.toLowerCase().startsWith('why') ||
         message.toLowerCase().startsWith('can') ||
         message.toLowerCase().startsWith('should') ||
         message.toLowerCase().startsWith('which');
};

/**
 * Extract tool name from message if mentioned
 */
export const extractToolMention = (message: string): string | null => {
  const lowerMessage = message.toLowerCase();
  const toolKeywords = [
    { id: 'mood-board', keywords: ['mood board', 'moodboard'] },
    { id: 'style-tile', keywords: ['style tile', 'styletile'] },
    { id: 'color-story', keywords: ['color story', 'colour story'] },
    { id: 'lookbook', keywords: ['lookbook', 'look book'] },
    { id: 'storyboard-pro', keywords: ['storyboard'] },
    { id: 'shot-list', keywords: ['shot list'] },
  ];

  for (const tool of toolKeywords) {
    for (const keyword of tool.keywords) {
      if (lowerMessage.includes(keyword)) {
        return tool.id;
      }
    }
  }

  return null;
};
