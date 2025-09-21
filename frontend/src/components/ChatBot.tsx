'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import useApi from '../hooks/useApi';

// Types aligned with backend
interface ChatBotResponse {
  response: string;
  session_id: string;
  intent?: string;
  conversation_state?: string;
  disclaimer?: string;
  suggestions?: string[];
}

interface ChatBotMessageBody {
  user_id: string;
  message: string;
  session_id?: string;
  [key: string]: unknown;
}

// Local message representation for UI
interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  text: string;
}

const CHATBOT_BASE = '/chatbot'; // adjust if your backend mounts the router under a different prefix
const STORAGE_KEYS = {
  sessionId: 'chatbot_session_id',
  userId: 'chatbot_user_id',
};

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Two API hooks so loading/error states don't clash
  const messageApi = useApi<ChatBotResponse>();
  const endSessionApi = useApi<{ message: string; session_id: string }>();

  const listRef = useRef<HTMLDivElement>(null);

  // Generate or retrieve a stable anonymous user id
  const userId = useMemo(() => {
    if (typeof window === 'undefined') return 'anonymous';
    const existing = localStorage.getItem(STORAGE_KEYS.userId);
    if (existing) return existing;
    const generated = 'anon_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(STORAGE_KEYS.userId, generated);
    return generated;
  }, []);

  // Load persisted session id on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEYS.sessionId);
    if (saved) setSessionId(saved);
  }, []);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          text: "Hi, I'm your Care Compass assistant. How can I help you find care today?",
        },
      ]);
    }
  }, [messages.length]);

  const minimizeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;

    // Optimistically add user message
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const body: ChatBotMessageBody = {
        user_id: userId,
        message: content,
        ...(sessionId ? { session_id: sessionId } : {}),
      };

      const res = await messageApi.post(`${CHATBOT_BASE}/message`, body);

      // Persist session id if first time
      if (!sessionId && res.session_id) {
        setSessionId(res.session_id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.sessionId, res.session_id);
        }
      }

      setDisclaimer(res.disclaimer);
      setSuggestions(res.suggestions || []);

      // Append bot response
      const botMsg: ChatMessage = { id: `b_${Date.now()}`, role: 'bot', text: res.response };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errText = messageApi.error || 'Something went wrong. Please try again.';
      setMessages(prev => [
        ...prev,
        { id: `e_${Date.now()}`, role: 'system', text: errText },
      ]);
    }
  }, [input, messageApi, sessionId, userId]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await endSessionApi.delete(`${CHATBOT_BASE}/session/${sessionId}`);
    } catch {
      // Non-fatal; we still clear local state
    }
    // Clear local session and messages
    setSessionId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.sessionId);
    }
    setMessages([{
      id: `ended_${Date.now()}`,
      role: 'system',
      text: 'Session ended. You can start a new chat anytime.',
    }]);
    setSuggestions([]);
    setDisclaimer(undefined);
  }, [endSessionApi, sessionId]);

  const handleCloseAndEnd = useCallback(async () => {
    await endSession();
    setIsOpen(false);
  }, [endSession]);

  const renderMessage = (msg: ChatMessage) => {
    const base = 'px-2 py-1.5 rounded-lg max-w-[85%] whitespace-pre-wrap';
    if (msg.role === 'user') {
      return (
        <div key={msg.id} className="flex justify-end">
          <div className={`${base} bg-blue-600 text-white text-sm leading-tight`}>{msg.text}</div>
        </div>
      );
    }
    if (msg.role === 'system') {
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded">
            {msg.text}
          </div>
        </div>
      );
    }
    return (
      <div key={msg.id} className="flex items-start gap-2">
        <div className="mt-0.5 text-blue-600">
          <Bot className="h-3 w-3" />
        </div>
        <div className={`${base} bg-gray-100 text-gray-800 prose-xs max-w-none leading-tight`}>
          <div className="text-xs leading-tight">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1.5 text-xs leading-tight">{children}</p>,
                ul: ({ children }) => <ul className="mb-1.5 ml-3 list-disc text-xs leading-tight">{children}</ul>,
                ol: ({ children }) => <ol className="mb-1.5 ml-3 list-decimal text-xs leading-tight">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5 text-xs leading-tight">{children}</li>,
              }}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        aria-label="Open chat"
        onClick={openChat}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Care Assistant</div>
                <div className="text-xs text-gray-500">Here to help 24/7</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sessionId && (
                <button
                  onClick={endSession}
                  className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded px-2 py-1"
                >
                  End chat
                </button>
              )}
              <button
                aria-label="Minimize chat"
                onClick={minimizeChat}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="h-80 overflow-y-auto px-4 py-3 space-y-3 bg-white">
            {messages.map(renderMessage)}
            {messageApi.loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
            {messageApi.error && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="h-4 w-4" />
                {messageApi.error}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          {disclaimer && (
            <div className="px-4 py-2 bg-yellow-50 text-yellow-800 text-xs border-t border-yellow-100">
              {disclaimer}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-4 pt-2 pb-1 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={`${s}-${idx}`}
                  onClick={() => handleSend(s)}
                  className="text-xs bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-700 text-gray-700 px-2 py-1 rounded-full"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Message"
            />
            <button
              type="submit"
              disabled={messageApi.loading}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md px-3 py-2"
              aria-label="Send message"
            >
              {messageApi.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          {/* Footer controls */}
          {sessionId && (
            <div className="px-4 py-2 bg-gray-50 text-right border-t border-gray-200">
              <button
                onClick={handleCloseAndEnd}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Close and end session
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;