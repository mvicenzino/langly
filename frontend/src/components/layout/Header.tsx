interface Props {
  chatOpen: boolean;
  onToggleChat: () => void;
  onOpenSettings: () => void;
}

export function Header({ chatOpen, onToggleChat, onOpenSettings }: Props) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b border-cyan-500/10 px-6 py-4"
            style={{ background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-4">
        {/* Logo mark */}
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-sm" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/80">
            <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Brand */}
        <div>
          <div className="flex items-baseline gap-0">
            <h1 className="text-xl font-bold tracking-tight text-white glow-text-cyan">langly</h1>
            <span className="text-xl font-light text-cyan-400">.io</span>
          </div>
          <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-gray-500 mt-1">
            Your Personal Central Intelligence Agent
          </div>
        </div>

        {/* Status badge */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-ring" />
            <span className="text-[9px] font-medium uppercase tracking-widest text-emerald-400">
              28 agents
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden lg:inline text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          {new Date().toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' '}
          {new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-md border border-white/5 px-2.5 py-1.5 text-gray-500 hover:border-cyan-500/20 hover:text-cyan-400 transition-all"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Chat toggle */}
        <button
          onClick={onToggleChat}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] uppercase tracking-wider font-medium transition-all ${
            chatOpen
              ? 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5'
              : 'border-white/5 text-gray-500 hover:border-cyan-500/20 hover:text-cyan-400'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Ask Langly
        </button>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </header>
  );
}
