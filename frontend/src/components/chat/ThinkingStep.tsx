import { useState } from 'react';
import type { ThinkingStep as ThinkingStepType, ToolCall } from '../../types/chat';
import { ToolBadge } from './ToolBadge';

interface Props {
  steps: ThinkingStepType[];
  toolCalls: ToolCall[];
}

export function ThinkingSteps({ steps, toolCalls }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0 && toolCalls.length === 0) return null;

  return (
    <div className="mb-2 animate-fade-in-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-cyan-400/70 hover:text-cyan-400 transition-colors"
      >
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {toolCalls.length > 0 && (
          <span className="uppercase tracking-wider">
            {toolCalls.length} tool{toolCalls.length !== 1 ? 's' : ''} used
          </span>
        )}
        {toolCalls.length > 0 && (
          <span className="flex gap-1 ml-1">
            {toolCalls.map((tc, i) => (
              <ToolBadge key={i} toolCall={tc} />
            ))}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 border-l border-cyan-500/20 pl-3">
          {toolCalls.map((tc, i) => (
            <div key={i} className="text-xs animate-fade-in-up">
              <div className="flex items-center gap-2">
                <ToolBadge toolCall={tc} />
                <span className="text-gray-500 truncate max-w-xs font-mono text-[10px]">{tc.input}</span>
              </div>
              {tc.output && (
                <pre className="mt-1 rounded-md border border-white/5 p-2 text-[11px] text-gray-400 overflow-x-auto max-h-32 overflow-y-auto"
                     style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                  {tc.output.slice(0, 500)}
                  {tc.output.length > 500 ? '...' : ''}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
