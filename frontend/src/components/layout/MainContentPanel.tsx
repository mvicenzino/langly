import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  commandTitle?: string;
  onBack: () => void;
}

export function MainContentPanel({ messages, isLoading, commandTitle, onBack }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Find the latest assistant message
  const latestAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  // Auto-scroll when content updates
  useEffect(() => {
    if (latestAssistant?.content) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [latestAssistant?.content]);

  return (
    <div className="animate-fade-in-up">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5"
           style={{ background: 'rgba(3, 7, 18, 0.5)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500 hover:text-cyan-400 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        {commandTitle && (
          <>
            <div className="h-3.5 w-px bg-white/10" />
            <h3 className="text-xs font-medium text-cyan-400 tracking-wide">{commandTitle}</h3>
          </>
        )}
        {isLoading && (
          <div className="ml-auto flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-[10px] uppercase tracking-wider text-cyan-400/70 animate-pulse">
              Processing...
            </span>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-6 md:p-8">
        {latestAssistant ? (
          <div className="max-w-4xl mx-auto">
            {/* Loading state while agent works */}
            {!latestAssistant.content && isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <LoadingSpinner size="lg" />
                <div className="text-xs text-gray-500 uppercase tracking-wider">
                  Fetching results...
                </div>
              </div>
            )}

            {/* Main response content */}
            {latestAssistant.content && (
              <div className="animate-fade-in-up">
                <MarkdownRenderer content={latestAssistant.content} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <LoadingSpinner size="lg" />
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Starting...
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
