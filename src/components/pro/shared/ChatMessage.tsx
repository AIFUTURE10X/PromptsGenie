import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../../services/proAssistant';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Format message content with basic markdown support
  const formatContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/```(\w*)\n([\s\S]*?)```/g);

    return parts.map((part, index) => {
      // Code block
      if (index % 3 === 2) {
        return (
          <pre key={index} className="bg-gray-900 rounded p-3 my-2 overflow-x-auto text-sm">
            <code>{part}</code>
          </pre>
        );
      }

      // Regular text with inline formatting
      if (index % 3 === 0) {
        return (
          <span key={index} dangerouslySetInnerHTML={{
            __html: part
              .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/`(.+?)`/g, '<code class="bg-gray-900/50 px-1 py-0.5 rounded text-sm">$1</code>')
              .replace(/\n/g, '<br />')
          }} />
        );
      }

      return null;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-brand-accent to-orange-600 text-white'
              : 'bg-gray-800 text-gray-100'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {formatContent(message.content)}
          </div>
        </div>

        {/* Metadata */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>

          {/* Copy button for assistant messages */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
