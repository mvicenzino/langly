import { useState, useCallback } from 'react';
import { useContacts } from '../../hooks/useContacts';
import { fetchContact } from '../../api/contacts';
import type { ContactDetail } from '../../types/contacts';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const TYPE_COLORS: Record<string, { dot: string; badge: string; label: string }> = {
  recruiter:          { dot: 'bg-purple-400', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', label: 'Recruiter' },
  internal_recruiter: { dot: 'bg-purple-400', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/20', label: 'Internal Recruiter' },
  hiring_manager:     { dot: 'bg-amber-400',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',   label: 'Hiring Manager' },
  interviewer:        { dot: 'bg-cyan-400',   badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',     label: 'Interviewer' },
  employee:           { dot: 'bg-cyan-400',   badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',     label: 'Employee' },
  former_employee:    { dot: 'bg-gray-400',   badge: 'bg-gray-500/15 text-gray-400 border-gray-500/20',     label: 'Former Employee' },
  referral:           { dot: 'bg-green-400',  badge: 'bg-green-500/15 text-green-400 border-green-500/20',   label: 'Referral' },
  networking:         { dot: 'bg-blue-400',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',     label: 'Networking' },
  mentor:             { dot: 'bg-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20', label: 'Mentor' },
  other:              { dot: 'bg-gray-400',   badge: 'bg-gray-500/15 text-gray-400 border-gray-500/20',     label: 'Other' },
};

function getTypeInfo(contactType: string | null) {
  if (!contactType) return null;
  return TYPE_COLORS[contactType] ?? TYPE_COLORS.other;
}

function StarRating({ value }: { value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`h-3 w-3 ${i <= value ? 'text-amber-400' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ContactsWidget() {
  const { contacts, loading, refresh, create, remove } = useContacts();
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      await create({
        name: newName.trim(),
        company: newCompany.trim() || undefined,
        title: newTitle.trim() || undefined,
      });
      setNewName('');
      setNewCompany('');
      setNewTitle('');
      setShowAdd(false);
    }
  }, [newName, newCompany, newTitle, create]);

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
    const typeInfo = getTypeInfo(detail.contactType);
    const overdue = isOverdue(detail.nextFollowupDate);

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
              {/* Name + type badge */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{detail.name}</span>
                  {typeInfo && (
                    <span className={`rounded-full px-1.5 py-0 text-[8px] border ${typeInfo.badge}`}>
                      {typeInfo.label}
                    </span>
                  )}
                </div>
                {(detail.title || detail.companyName) && (
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {detail.title}{detail.title && detail.companyName ? ' at ' : ''}{detail.companyName}
                  </div>
                )}
              </div>

              {/* Relationship strength */}
              {detail.relationshipStrength && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Strength</span>
                  <StarRating value={detail.relationshipStrength} />
                </div>
              )}

              {/* Contact info */}
              {(detail.email || detail.phone || detail.linkedinUrl) && (
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
                  {detail.linkedinUrl && (
                    <div className="text-[11px] flex items-center gap-1.5">
                      <span className="text-gray-600">LinkedIn</span>
                      <a
                        href={detail.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors truncate"
                      >
                        {detail.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || 'View Profile'}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              {(detail.lastContactDate || detail.nextFollowupDate) && (
                <div className="space-y-1 border-t border-white/5 pt-2">
                  {detail.lastContactDate && (
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <span className="text-gray-600">Last contact</span> {formatDate(detail.lastContactDate)}
                    </div>
                  )}
                  {detail.nextFollowupDate && (
                    <div className={`text-[11px] flex items-center gap-1.5 ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                      <span className={overdue ? 'text-red-500' : 'text-gray-600'}>
                        {overdue ? 'Overdue followup' : 'Next followup'}
                      </span>
                      {formatDate(detail.nextFollowupDate)}
                    </div>
                  )}
                </div>
              )}

              {/* How we met */}
              {detail.howWeMet && (
                <div className="border-t border-white/5 pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 mb-1">How we met</div>
                  <div className="text-[11px] text-gray-500">{detail.howWeMet}</div>
                </div>
              )}

              {/* Notes */}
              {detail.notes && (
                <div className="border-t border-white/5 pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 mb-1">Notes</div>
                  <div className="text-[11px] text-gray-500">{detail.notes}</div>
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
      insightPrompt="Review my contacts. Identify networking opportunities, overdue follow-ups, and relationship management suggestions."
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
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title (optional)..."
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
                onClick={() => { setShowAdd(false); setNewName(''); setNewCompany(''); setNewTitle(''); }}
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
          {contacts.map((contact) => {
            const typeInfo = getTypeInfo(contact.contactType);
            return (
              <div
                key={contact.id}
                onClick={() => viewDetail(contact.id)}
                className="group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-white/[0.02] border border-transparent hover:border-cyan-500/10"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/15 text-[10px] text-cyan-400 font-bold shrink-0 border border-cyan-500/20 relative">
                    {contact.name.charAt(0)}
                    {typeInfo && (
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${typeInfo.dot} border border-slate-900`} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-300 truncate block">{contact.name}</span>
                    {(contact.title || contact.companyName) && (
                      <div className="text-[10px] text-gray-600 truncate">
                        {contact.title}{contact.title && contact.companyName ? ' · ' : ''}{contact.companyName}
                      </div>
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
            );
          })}
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
