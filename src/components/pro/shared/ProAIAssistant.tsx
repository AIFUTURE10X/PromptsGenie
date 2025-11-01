import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2, Trash2, Sparkles } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProAssistantButton } from './ProAssistantButton';
import {
  sendMessage,
  createUserMessage,
  createAssistantMessage,
  loadConversationHistory,
  saveConversationHistory,
  clearConversationHistory,
  getToolSuggestions,
  type ChatMessage as ChatMessageType,
} from '../../../services/proAssistant';
import { getToolById } from '../../../lib/proKnowledgeBase';
import { Button } from '../../ui/button';

interface ProAIAssistantProps {
  currentTool?: string;
  userInput?: Record<string, any>;
}

export const ProAIAssistant: React.FC<ProAIAssistantProps> = ({
  currentTool,
  userInput,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    const history = loadConversationHistory();
    if (history.length > 0) {
      setMessages(history);
      setShowSuggestions(false);
    }
  }, []);

  // Save conversation history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory(messages);
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send welcome message when tool changes
  useEffect(() => {
    if (currentTool && isOpen && messages.length === 0) {
      const tool = getToolById(currentTool);
      if (tool) {
        const welcomeMsg = createAssistantMessage(
          `**Welcome to ${tool.name}!** 🎨\n\n${tool.purpose}\n\nNeed help getting started?`,
          currentTool
        );
        setMessages([welcomeMsg]);
        setShowSuggestions(true);
      }
    }
  }, [currentTool, isOpen]);

  const handleSendMessage = async (content: string, images?: string[]) => {
    if ((!content.trim() && !images?.length) || isLoading) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Add user message
    const userMsg = createUserMessage(content, currentTool, images);
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Send to AI
      const response = await sendMessage({
        message: content,
        images,
        context: {
          currentTool,
          userInput,
          conversationHistory: messages,
        },
        conversationHistory: messages,
      });

      // Add assistant response
      const assistantMsg = createAssistantMessage(
        response.message,
        currentTool
      );
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg = createAssistantMessage(
        'Sorry, I encountered an error. Please try again.',
        currentTool
      );
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all conversation history?')) {
      setMessages([]);
      clearConversationHistory();
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const suggestions = getToolSuggestions(currentTool);

  return (
    <>
      {/* Floating Button */}
      <ProAssistantButton
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        hasNotification={!isOpen && messages.length === 0}
      />

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed ${
                isMinimized ? 'bottom-24 right-6 w-80 h-16' : 'md:bottom-6 md:right-6 md:w-[400px] md:h-[600px] inset-0 md:inset-auto'
              } bg-gray-900 border border-gray-700 md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-accent to-orange-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      PromptsGenie Pro AI
                    </h3>
                    <p className="text-white/80 text-xs">
                      {currentTool ? `${getToolById(currentTool)?.name}` : 'Ask me anything'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Minimize button (desktop only) */}
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="hidden md:flex p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4 text-white" />
                    ) : (
                      <Minimize2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                  {/* Close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-4">
                        <Sparkles className="w-12 h-12 text-brand-accent mb-4" />
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Hi! I'm your AI Assistant
                        </h4>
                        <p className="text-sm mb-4">
                          I know everything about PromptsGenie Pro's 16 tools and can help you:
                        </p>
                        <ul className="text-sm text-left space-y-2 mb-6">
                          <li>✨ Choose the right tool for your project</li>
                          <li>🎨 Optimize your inputs and keywords</li>
                          <li>🔄 Suggest multi-tool workflows</li>
                          <li>💡 Provide creative inspiration</li>
                        </ul>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                      ))
                    )}

                    {/* Suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">
                          Suggested questions:
                        </p>
                        <div className="grid gap-2">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              disabled={isLoading}
                              className="text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isLoading && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <div className="flex gap-1">
                          <motion.div
                            className="w-2 h-2 bg-brand-accent rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-brand-accent rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-brand-accent rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                        <span>Thinking...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Clear button */}
                  {messages.length > 0 && (
                    <div className="px-4 pb-2">
                      <Button
                        onClick={handleClearChat}
                        variant="ghost"
                        size="sm"
                        className="w-full text-gray-400 hover:text-white text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear conversation
                      </Button>
                    </div>
                  )}

                  {/* Input */}
                  <ChatInput
                    onSend={handleSendMessage}
                    disabled={isLoading}
                    placeholder={
                      currentTool
                        ? `Ask about ${getToolById(currentTool)?.name}...`
                        : 'Ask me anything about PromptsGenie Pro...'
                    }
                  />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
