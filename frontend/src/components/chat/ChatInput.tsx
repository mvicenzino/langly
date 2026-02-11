import { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-white/5 p-3" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Processing...' : 'Enter command...'}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-cyan-500/15 bg-slate-900/60 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-40 transition-all"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          {disabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-[42px] w-[42px] items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/50 disabled:opacity-30 disabled:hover:bg-cyan-500/10 glow-border-cyan"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
