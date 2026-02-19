import { useState, useEffect } from 'react';

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
}

export function ImportantEmailsWidget() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImportantEmails();
    // Refresh every 5 minutes
    const interval = setInterval(fetchImportantEmails, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchImportantEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emails/important?limit=8');
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      setEmails(data.emails || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/5 p-4 animate-pulse"
           style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-white/5 rounded" />
          <div className="h-2 w-3/4 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  // Show setup instructions if error or no emails
  if (error || (emails.length === 0 && !loading)) {
    return (
      <div className="rounded-xl border border-blue-500/20 overflow-hidden"
           style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">Important Emails</span>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-[10px] text-gray-400">Star important emails in Gmail to see them here.</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            💡 <strong>Tip:</strong> In Gmail, click the star icon on emails from VCs, job leads, or key contacts to flag them as important.
          </p>
          <p className="text-[9px] text-gray-700 mt-2">This widget will auto-refresh every 5 minutes and show your starred emails.</p>
        </div>
      </div>
    );
  }

  // Render email list
  return (
    <div className="rounded-xl border border-blue-500/20 overflow-hidden"
         style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">Important Emails</span>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {emails.map((email) => (
            <a
              key={email.id}
              href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group rounded-lg border border-white/5 px-3 py-2 hover:border-blue-400/30 hover:bg-blue-400/5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                    {email.subject || '(no subject)'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{email.from}</div>
                </div>
                {email.isStarred && (
                  <svg className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <div className="text-[10px] text-gray-600 mt-1 line-clamp-1">{email.snippet}</div>
              <div className="text-[9px] text-gray-700 mt-1">
                {email.date}
                {email.isUnread && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
