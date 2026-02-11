import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types/chat';
import { ChatMessage } from './ChatMessage';

interface Props {
  messages: ChatMessageType[];
  onQuickAction?: (prompt: string) => void;
}

const quickActions = [
  { label: 'Weather', prompt: "What's the weather in Morristown, NJ?" },
  { label: 'Stocks', prompt: 'How are my stocks doing today?' },
  { label: 'Date & Time', prompt: 'What is the current date and time?' },
  { label: 'My Todos', prompt: 'Show me my todo list' },
  { label: 'Web Search', prompt: 'Search the web for the latest AI news today' },
  { label: 'Add Todo', prompt: 'Add "Review weekly goals" to my todos' },
];

export function MessageList({ messages, onQuickAction }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-5 px-4">
          {/* Animated logo */}
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-xl animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
              <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">
              Welcome to <span className="text-cyan-400 font-medium glow-text-cyan">langly</span>
            </p>
            <p className="text-[11px] text-gray-600">
              28 tools at your disposal. Try a quick action:
            </p>
          </div>

          {/* Quick actions */}
          <div className="space-y-1.5 max-w-[280px] mx-auto">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => onQuickAction?.(qa.prompt)}
                className="w-full flex items-center gap-2.5 rounded-lg border border-white/5 px-3 py-2 text-left transition-all hover:border-cyan-500/20 hover:bg-cyan-500/5 group"
                style={{ background: 'rgba(15, 23, 42, 0.3)' }}
              >
                <svg className="h-3.5 w-3.5 text-gray-600 group-hover:text-cyan-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors truncate">
                  {qa.prompt}
                </span>
              </button>
            ))}
          </div>

          {/* Tool badges */}
          <div className="flex flex-wrap gap-1.5 justify-center max-w-xs mx-auto pt-2">
            {['Weather', 'Stocks', 'Search', 'Calculator', 'Todos', 'Notes', 'Wikipedia'].map(
              (t) => (
                <span key={t} className="rounded border border-cyan-500/10 bg-cyan-500/5 px-2 py-0.5 text-[9px] text-cyan-400/60 tracking-wide uppercase">
                  {t}
                </span>
              )
            )}
            <span className="rounded border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[9px] text-gray-500 tracking-wide">
              +21 more
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
