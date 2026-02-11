import { useState, useCallback } from 'react';
import { useContacts } from '../../hooks/useContacts';
import { fetchContact } from '../../api/contacts';
import type { ContactDetail } from '../../types/contacts';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function ContactsWidget() {
  const { contacts, loading, refresh, create, remove } = useContacts();
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      await create({ name: newName.trim(), company: newCompany.trim() });
      setNewName('');
      setNewCompany('');
      setShowAdd(false);
    }
  }, [newName, newCompany, create]);

  const viewDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await fetchContact(id);
      setDetail(data);
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const contactIcon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  // Detail view
  if (detail) {
    return (
      <WidgetPanel title="Contacts" accentColor="cyan" icon={contactIcon}
        headerRight={
          <button
            onClick={() => setDetail(null)}
            className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-cyan-400 transition-colors"
          >Back</button>
        }
      >
        <div className="p-3 space-y-3">
          {detailLoading ? (
            <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
          ) : (
            <>
              <div>
                <div className="text-sm font-medium text-gray-200">{detail.name}</div>
                {detail.company && <div className="text-[11px] text-gray-500">{detail.company}</div>}
              </div>

              {(detail.email || detail.phone) && (
                <div className="space-y-1">
                  {detail.email && (
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <span className="text-gray-600">Email</span> {detail.email}
                    </div>
                  )}
                  {detail.phone && (
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <span className="text-gray-600">Phone</span> {detail.phone}
                    </div>
                  )}
                </div>
              )}

              {detail.notes && (
                <div className="text-[11px] text-gray-500 border-t border-white/5 pt-2">{detail.notes}</div>
              )}

              {/* Mentioned in notes */}
              {detail.mentioned_in && detail.mentioned_in.length > 0 && (
                <div className="border-t border-white/5 pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 mb-1.5">
                    Mentioned in {detail.mentioned_in.length} note{detail.mentioned_in.length !== 1 ? 's' : ''}
                  </div>
                  <div className="space-y-1">
                    {detail.mentioned_in.map((n) => (
                      <div key={n.id} className="rounded bg-white/[0.02] border border-white/5 px-2.5 py-1.5">
                        <div className="text-[11px] text-gray-300 font-medium">{n.title}</div>
                        <div className="text-[10px] text-gray-600 truncate font-mono mt-0.5">
                          {n.content.slice(0, 80)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </WidgetPanel>
    );
  }

  return (
    <WidgetPanel title="Contacts" accentColor="cyan" icon={contactIcon}
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(!showAdd)} className="text-gray-600 hover:text-cyan-400 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button onClick={refresh} className="text-gray-600 hover:text-cyan-400 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )
      }
    >
      <div className="p-3 space-y-2">
        {/* Add contact form */}
        {showAdd && (
          <form onSubmit={handleCreate} className="space-y-1.5 border-b border-white/5 pb-2 mb-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name..."
              className="w-full rounded border border-cyan-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none transition-all"
              autoFocus
            />
            <input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Company (optional)..."
              className="w-full rounded border border-cyan-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-cyan-500/40 focus:outline-none transition-all"
            />
            <div className="flex gap-1.5">
              <button
                type="submit"
                disabled={!newName.trim()}
                className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 transition-all uppercase tracking-wider"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowAdd(false); setNewName(''); setNewCompany(''); }}
                className="rounded px-2.5 py-1 text-[10px] text-gray-600 hover:text-gray-400 transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
        )}

        <div className="space-y-1">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => viewDetail(contact.id)}
              className="group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-white/[0.02] border border-transparent hover:border-cyan-500/10"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-[10px] text-cyan-400 font-bold shrink-0 border border-cyan-500/20">
                  {contact.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-300 truncate">{contact.name}</span>
                    {contact.mention_count > 0 && (
                      <span className="shrink-0 rounded-full bg-purple-500/15 px-1.5 py-0 text-[8px] text-purple-400 border border-purple-500/20">
                        {contact.mention_count} mention{contact.mention_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {contact.company && (
                    <div className="text-[10px] text-gray-600 truncate">{contact.company}</div>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(contact.id);
                }}
                className="invisible text-gray-700 hover:text-red-400 group-hover:visible ml-2 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {contacts.length === 0 && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No contacts on file
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
