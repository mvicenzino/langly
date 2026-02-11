import type { ToolCall } from '../../types/chat';

interface Props {
  toolCall: ToolCall;
}

const TOOL_COLORS: Record<string, string> = {
  Search: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
  Weather: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
  StockPrice: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  Todo: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  Notes: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
  Calculator: 'border-orange-500/30 text-orange-300 bg-orange-500/10',
  Wikipedia: 'border-gray-500/30 text-gray-300 bg-gray-500/10',
};

export function ToolBadge({ toolCall }: Props) {
  const colorClass = TOOL_COLORS[toolCall.tool] || 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10';

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${colorClass}`}>
      <span className="opacity-60">&gt;</span>
      {toolCall.tool}
    </span>
  );
}
