import type { MutableRefObject } from 'react';
import { useEffect, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WidgetPanel } from '../layout/WidgetPanel';

interface Props {
  onChatDone?: () => void;
  onSendRef?: MutableRefObject<((msg: string) => void) | null>;
}

export function ChatPanel({ onChatDone, onSendRef }: Props) {
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    sessions,
    activeSessionId,
    startNewSession,
    switchSession,
    deleteSession,
  } = useChat();
  const [showHistory, setShowHistory] = useState(false);

  // Expose sendMessage to parent via ref so skills can inject prompts
  useEffect(() => {
    if (onSendRef) {
      onSendRef.current = sendMessage;
    }
  }, [onSendRef, sendMessage]);

  const lastMsg = messages[messages.length - 1];
  const prevStreamingRef = { current: true };
  if (lastMsg && !lastMsg.isStreaming && prevStreamingRef.current) {
    prevStreamingRef.current = false;
    onChatDone?.();
  }
  if (lastMsg?.isStreaming) {
    prevStreamingRef.current = true;
  }

  return (
    <WidgetPanel
      title="Neural Link"
      accentColor="cyan"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
      headerRight={
        <div className="flex items-center gap-2">
          <button
            onClick={startNewSession}
            title="New chat"
            className="text-gray-600 hover:text-cyan-400 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="Chat history"
            className={`transition-colors ${showHistory ? 'text-cyan-400' : 'text-gray-600 hover:text-cyan-400'}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-cyan-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      <div className="flex h-full flex-col">
        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="text-[9px] font-medium uppercase tracking-widest text-gray-600 mb-2">
              Recent Sessions
            </div>
            {sessions.length === 0 && (
              <p className="text-[11px] text-gray-600 text-center py-8">No chat history</p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer transition-all ${
                  s.id === activeSessionId
                    ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400'
                    : 'border-white/5 text-gray-400 hover:border-cyan-500/10 hover:text-gray-300'
                }`}
                onClick={() => {
                  switchSession(s.id);
                  setShowHistory(false);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">{s.title}</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">
                    {new Date(s.updated_at).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  className="ml-2 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <MessageList messages={messages} onQuickAction={sendMessage} />
        )}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </WidgetPanel>
  );
}
