import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Category, CreateTicketPayload, TicketListItem, TicketPriority, TicketStatus, User } from '../../types';
import { permissions } from '../../lib/roles';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

interface TicketFormProps {
  categories: Category[];
  users: User[];
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
  submitting?: boolean;
}

const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses: TicketStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS'];

export default function TicketForm({ categories, users, onSubmit, submitting }: TicketFormProps) {
  const { user: authUser } = useAuth();
  const role = authUser?.role ?? 'REQUESTOR';
  const isStaff = permissions.canAssignTickets(role);

  const [form, setForm] = useState<CreateTicketPayload>({
    title: '',
    description: '',
    source: 'WEB',
    requesterName: role === 'REQUESTOR' ? (authUser?.name ?? '') : '',
    requesterEmail: role === 'REQUESTOR' ? (authUser?.email ?? '') : '',
    status: 'OPEN',
    priority: 'MEDIUM',
  });
  const [error, setError] = useState<string | null>(null);
  const [similar, setSimilar] = useState<TicketListItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchSimilar = useCallback((title: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (title.length < 5) { setSimilar([]); return; }
    debounceRef.current = setTimeout(() => {
      ticketService.findSimilarTickets(title).then(setSimilar);
    }, 400);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const activeAgents = useMemo(() => users.filter((user) => ['AGENT', 'MANAGER', 'ADMIN'].includes(user.role)), [users]);

  const handleChange = <K extends keyof CreateTicketPayload>(key: K, value: CreateTicketPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.title || !form.description || !form.requesterName || !form.requesterEmail) {
      setError('Please fill in all required fields.');
      return;
    }

    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Title *</label>
          <input className="input" value={form.title} onChange={(e) => { handleChange('title', e.target.value); searchSimilar(e.target.value); }} placeholder="Brief summary of the issue" />
          {similar.length > 0 && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-800">Possible duplicates found — check before submitting:</p>
              <div className="space-y-2">
                {similar.map((t) => (
                  <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center gap-3 rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm transition hover:bg-amber-50">
                    <span className="font-semibold text-ey-black">{t.ticketNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-ey-gray-700">{t.title}</span>
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="label">Description *</label>
          <textarea className="input min-h-32" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Describe the issue in detail" />
        </div>

        <div>
          <label className="label">Requester Name *</label>
          <input className="input" value={form.requesterName} onChange={(e) => handleChange('requesterName', e.target.value)} placeholder="Name of requester" readOnly={role === 'REQUESTOR'} />
        </div>

        <div>
          <label className="label">Requester Email *</label>
          <input className="input" type="email" value={form.requesterEmail} onChange={(e) => handleChange('requesterEmail', e.target.value)} placeholder="name@example.com" readOnly={role === 'REQUESTOR'} />
        </div>

        {isStaff && (
          <div>
            <label className="label">Source</label>
            <select className="input" value={form.source} onChange={(e) => handleChange('source', e.target.value as CreateTicketPayload['source'])}>
              <option value="WEB">WEB</option>
              <option value="EMAIL">EMAIL</option>
            </select>
          </div>
        )}

        {isStaff && (
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => handleChange('status', e.target.value as TicketStatus)}>
              {statuses.map((status) => (
                <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Category</label>
          <select className="input" value={form.categoryId || ''} onChange={(e) => handleChange('categoryId', e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {permissions.canSetPriority(role) && (
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => handleChange('priority', e.target.value as TicketPriority)}>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
        )}

        {isStaff && (
          <div className="md:col-span-2">
            <label className="label">Assign To</label>
            <select className="input" value={form.assignedTo || ''} onChange={(e) => handleChange('assignedTo', e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">Leave unassigned</option>
              {activeAgents.map((user) => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Ticket'}</button>

      </div>
    </form>
  );
}
