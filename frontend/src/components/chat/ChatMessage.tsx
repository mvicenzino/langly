import type { ChatMessage as ChatMessageType } from '../../types/chat';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { ThinkingSteps } from './ThinkingStep';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        {!isUser && (
          <div className="absolute inset-0 rounded-full bg-cyan-500/15 blur-[2px]" />
        )}
        <div
          className={`relative flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold tracking-wider ${
            isUser
              ? 'border border-blue-500/30 bg-blue-500/10 text-blue-400'
              : 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
          }`}
        >
          {isUser ? 'M' : 'AI'}
        </div>
      </div>

      {/* Message body */}
      <div className={`max-w-[80%] space-y-1 ${isUser ? 'text-right' : ''}`}>
        {/* Thinking / tools */}
        {!isUser && (
          <ThinkingSteps
            steps={message.thinkingSteps || []}
            toolCalls={message.toolCalls || []}
          />
        )}

        {/* Content */}
        <div
          className={`rounded-xl px-4 py-2.5 ${
            isUser
              ? 'border border-blue-500/20 bg-blue-500/10 text-blue-50'
              : 'border border-white/5 text-gray-200'
          }`}
          style={!isUser ? { background: 'rgba(15, 23, 42, 0.6)' } : undefined}
        >
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2 py-1">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-cyan-400/60 cursor-blink">Processing</span>
            </div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Timestamp */}
        <div className="text-[10px] text-gray-600 px-1 font-mono">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
