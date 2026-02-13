import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

export function LoginScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (!ok) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div
      className="flex h-screen w-screen items-center justify-center"
      style={{ background: '#030712' }}
    >
      {/* Subtle grid background */}
      <div className="bg-grid scan-line absolute inset-0 opacity-30" />

      <form
        onSubmit={handleSubmit}
        className={`relative z-10 flex w-[380px] flex-col items-center gap-6 rounded-2xl border border-white/10 p-10 backdrop-blur-xl ${error ? 'animate-shake' : ''}`}
        style={{ background: 'rgba(15, 23, 42, 0.7)' }}
      >
        {/* Logo area */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 text-2xl font-bold text-emerald-400">
            L
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Langly
          </h1>
          <p className="text-xs text-slate-400">
            Your Personal Central Intelligence Agent
          </p>
        </div>

        {/* Password input */}
        <div className="w-full">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
          />
          {error && (
            <p className="mt-2 text-xs text-red-400">
              Invalid password. Please try again.
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Authenticating...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
