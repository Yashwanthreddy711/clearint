import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'peer';
  time: string;
}

interface ChatPanelProps {
  messages: Message[];
  onSend: (text: string) => void;
  onClose: () => void;
}

export const ChatPanel = ({ messages, onSend, onClose }: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="flex flex-col w-80 min-w-[320px] bg-zinc-900 border-l border-zinc-800 animate-slideInRight">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideInRight { animation: slideInRight 0.2s ease forwards; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
        <h2 className="text-white font-semibold text-sm tracking-wide">Messages</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 chat-scroll">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-8">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Send size={16} className="text-zinc-600" />
            </div>
            <p className="text-zinc-600 text-xs text-center leading-relaxed">
              No messages yet.<br />Say hello to get started.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'me'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm border border-zinc-700/50'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-zinc-600 text-[10px] mt-1 px-1">{msg.time}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-zinc-800 flex-shrink-0">
        <div className="flex items-end gap-2 bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-700 focus-within:border-zinc-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none leading-5 max-h-24 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0 mb-0.5"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
        <p className="text-zinc-700 text-[10px] mt-1.5 text-center">
          ↵ Send · Shift+↵ New line
        </p>
      </div>
    </aside>
  );
};