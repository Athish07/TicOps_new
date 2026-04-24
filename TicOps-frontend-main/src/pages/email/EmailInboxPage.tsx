import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Mail, ArrowRight, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import PriorityBadge from '../../components/common/PriorityBadge';
import { emailService } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { IngestedEmail } from '../../types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function EmailInboxPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<IngestedEmail[]>([]);
  const [selected, setSelected] = useState<IngestedEmail | null>(null);
  const [converting, setConverting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONVERTED' | 'DISCARDED'>('ALL');

  const fetchEmails = useCallback(async () => {
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const data = await emailService.getIngested(status);
      setEmails(data);
    } catch {
      addToast('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  const handleRefresh = async () => {
    setPolling(true);
    try {
      await fetchEmails();
      addToast('Email list refreshed');
    } catch {
      addToast('Failed to refresh emails');
    } finally {
      setPolling(false);
    }
  };

  const convertToTicket = async (email: IngestedEmail) => {
    if (!user) return;
    setConverting(true);
    try {
      const ticket = await emailService.convertToTicket(email.id);
      addToast(`Ticket ${ticket.ticketNumber} created from email`);
      setSelected(null);
      await fetchEmails();
      navigate(`/tickets/${ticket.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Conversion failed';
      addToast(msg);
    } finally {
      setConverting(false);
    }
  };

  const discardEmail = async (emailId: number) => {
    try {
      await emailService.discardEmail(emailId);
      addToast('Email discarded');
      if (selected?.id === emailId) setSelected(null);
      await fetchEmails();
    } catch {
      addToast('Failed to discard email');
    }
  };

  const pendingCount = emails.filter((e) => e.status === 'PENDING').length;

  return (
    <div>
      <PageHeader
        title="Email Inbox"
        description={`Email intake — convert incoming emails into tickets. ${pendingCount} pending.`}
      />

      {/* Polling status bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary flex items-center gap-2"
          onClick={handleRefresh}
          disabled={polling}
        >
          <RefreshCw size={16} className={polling ? 'animate-spin' : ''} />
          {polling ? 'Refreshing…' : 'Refresh Inbox'}
        </button>



        {/* Filter tabs */}
        <div className="ml-auto flex rounded-lg border border-ey-gray-200 bg-white text-xs font-medium">
          {(['ALL', 'PENDING', 'CONVERTED', 'DISCARDED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 transition ${filter === f ? 'bg-ey-yellow text-ey-black' : 'text-ey-gray-500 hover:bg-ey-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        {/* Email list */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-ey-gray-100 bg-ey-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-ey-gray-700">
                <Inbox size={16} />
                Inbox ({emails.length})
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-ey-gray-400">Loading…</div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center text-sm text-ey-gray-400">
                {filter === 'ALL' ? 'No emails ingested yet. Click "Check for New Emails" to poll your IMAP inbox.' : `No ${filter.toLowerCase()} emails.`}
              </div>
            ) : (
              <div className="divide-y divide-ey-gray-100 max-h-[600px] overflow-y-auto">
                {emails.map((email) => (
                  <button
                    key={email.id}
                    type="button"
                    onClick={() => setSelected(email)}
                    className={`w-full px-4 py-3 text-left transition hover:bg-ey-gray-50 ${selected?.id === email.id ? 'bg-ey-yellow/10 border-l-2 border-l-ey-yellow' : ''} ${email.status === 'PENDING' ? 'bg-white' : 'bg-ey-gray-50/50'}`}
                  >
                    <div className="flex items-start gap-2">
                      {email.status === 'CONVERTED' ? (
                        <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      ) : email.status === 'DISCARDED' ? (
                        <Trash2 size={16} className="mt-0.5 shrink-0 text-ey-gray-400" />
                      ) : (
                        <Mail size={16} className="mt-0.5 shrink-0 text-ey-yellow" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${email.status === 'PENDING' ? 'font-bold text-ey-black' : 'font-medium text-ey-gray-700'}`}>
                            {email.fromName || email.fromEmail}
                          </span>
                          <span className="shrink-0 text-xs text-ey-gray-400">{timeAgo(email.receivedAt)}</span>
                        </div>
                        <div className={`mt-0.5 truncate text-sm ${email.status === 'PENDING' ? 'font-semibold text-ey-gray-900' : 'text-ey-gray-600'}`}>
                          {email.subject}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="truncate text-xs text-ey-gray-400">{email.bodyPreview?.slice(0, 80)}…</span>
                          {email.status !== 'PENDING' && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${email.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-ey-gray-100 text-ey-gray-500'}`}>
                              {email.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email detail / preview */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-ey-gray-900">{selected.subject}</h2>
                  <div className="mt-1 text-sm text-ey-gray-500">
                    From: <strong>{selected.fromName}</strong> &lt;{selected.fromEmail}&gt;
                  </div>
                  <div className="mt-0.5 text-xs text-ey-gray-400">
                    Received: {new Date(selected.receivedAt).toLocaleString()}
                  </div>
                </div>
                <PriorityBadge priority={selected.detectedPriority} />
              </div>

              <div className="mt-5 whitespace-pre-line rounded-xl border border-ey-gray-100 bg-ey-gray-50 p-4 text-sm leading-relaxed text-ey-gray-700">
                {selected.bodyPreview}
              </div>

              {selected.status === 'PENDING' && (
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => convertToTicket(selected)}
                    disabled={converting}
                  >
                    {converting ? 'Creating ticket…' : 'Convert to Ticket'}
                    <ArrowRight size={16} className="ml-2" />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-rose-600 hover:bg-rose-50"
                    onClick={() => discardEmail(selected.id)}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Discard
                  </button>
                </div>
              )}

              {selected.status === 'CONVERTED' && selected.ticketId && (
                <div className="mt-5">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => navigate(`/tickets/${selected.ticketId}`)}
                  >
                    View Ticket
                    <ArrowRight size={16} className="ml-2" />
                  </button>
                </div>
              )}

              {selected.status === 'DISCARDED' && (
                <div className="mt-5 rounded-lg bg-ey-gray-50 p-3 text-sm text-ey-gray-500">
                  This email was discarded and will not be converted to a ticket.
                </div>
              )}

              <div className="mt-4 rounded-xl border border-ey-gray-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-ey-gray-400">Auto-detected fields</div>
                <div className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <div className="min-w-0">
                    <span className="block text-ey-gray-500 text-xs">Requester:</span>
                    <span className="block font-medium truncate">{selected.fromName}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-ey-gray-500 text-xs">Email:</span>
                    <span className="block font-medium truncate">{selected.fromEmail}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-ey-gray-500 text-xs mb-0.5">Priority:</span>
                    <PriorityBadge priority={selected.detectedPriority} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-ey-gray-500 text-xs mb-0.5">Source:</span>
                    <span className="rounded-full bg-ey-gray-100 px-2 py-0.5 text-xs font-semibold">EMAIL</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-ey-gray-500 text-xs">Status:</span>
                    <span className="block font-medium">{selected.status}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-ey-gray-500 text-xs">Message UID:</span>
                    <span className="block font-mono text-xs truncate" title={selected.messageUid}>{selected.messageUid?.slice(0, 30)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center p-12 text-center">
              <Mail size={40} className="mb-3 text-ey-gray-300" />
              <p className="text-sm text-ey-gray-500">Select an email from the inbox to preview and convert to a ticket.</p>
              <p className="mt-2 text-xs text-ey-gray-400">
                Emails are ingested automatically via Power Automate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
