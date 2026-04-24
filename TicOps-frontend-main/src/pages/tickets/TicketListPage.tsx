import { Link, useSearchParams } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { useEffect, useMemo, useCallback, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import TicketFilters from '../../components/tickets/TicketFilters';
import TicketTable from '../../components/tickets/TicketTable';
import EmptyState from '../../components/common/EmptyState';
import { ticketService } from '../../services/ticketService';
import { categoryService } from '../../services/categoryService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { permissions } from '../../lib/roles';
import type { Category, TicketFiltersState, TicketListItem, User } from '../../types';

const initialFilters: TicketFiltersState = {
  search: '',
  status: '',
  priority: '',
  categoryId: '',
  assignedTo: '',
  source: '',
};

export default function TicketListPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const role = user?.role ?? 'REQUESTOR';
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<TicketFiltersState>(() => ({
    ...initialFilters,
    search: searchParams.get('search') || '',
  }));
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([categoryService.getCategories(), userService.getUsers()]).then(([categoryData, userData]) => {
      setCategories(categoryData);
      setUsers(userData);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    ticketService.getTickets(filters).then((all) => {
      let filtered = all;
      if (role === 'AGENT') {
        filtered = all.filter((t) => t.assignedTo === user?.id);
      } else if (role === 'REQUESTOR') {
        filtered = all.filter((t) => t.requesterEmail === user?.email);
      }
      setTickets(filtered);
    }).finally(() => setLoading(false));
  }, [filters, role, user?.id, user?.email]);

  const exportCsv = useCallback(() => {
    const headers = ['Ticket', 'Title', 'Status', 'Priority', 'Category', 'Requester', 'Owner', 'Created'];
    const rows = tickets.map((t) => [
      t.ticketNumber,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.category?.name || '',
      t.requesterName,
      t.assignee?.name || 'Unassigned',
      t.createdAt,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    addToast(`Exported ${tickets.length} tickets to CSV`);
  }, [tickets, addToast]);

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.size === 0) return;
    await ticketService.bulkUpdateStatus(Array.from(selectedIds), status as TicketListItem['status']);
    setSelectedIds(new Set());
    addToast(`Updated ${selectedIds.size} ticket(s) to ${status.replaceAll('_', ' ')}`);
    // Reload
    setLoading(true);
    ticketService.getTickets(filters).then((all) => {
      let filtered = all;
      if (role === 'AGENT') filtered = all.filter((t) => t.assignedTo === user?.id);
      else if (role === 'REQUESTOR') filtered = all.filter((t) => t.requesterEmail === user?.email);
      setTickets(filtered);
    }).finally(() => setLoading(false));
  };

  const handleBulkAssign = async (assignedTo: number) => {
    if (selectedIds.size === 0) return;
    await ticketService.bulkAssign(Array.from(selectedIds), assignedTo);
    setSelectedIds(new Set());
    addToast(`Assigned ${selectedIds.size} ticket(s)`);
    setLoading(true);
    ticketService.getTickets(filters).then((all) => {
      let filtered = all;
      if (role === 'AGENT') filtered = all.filter((t) => t.assignedTo === user?.id);
      else if (role === 'REQUESTOR') filtered = all.filter((t) => t.requesterEmail === user?.email);
      setTickets(filtered);
    }).finally(() => setLoading(false));
  };

  const actions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        {permissions.canViewAllTickets(role) && tickets.length > 0 && (
          <button type="button" className="btn-secondary" onClick={exportCsv}>
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        )}
        <Link to="/tickets/new" className="btn-primary">
          <Plus size={16} className="mr-2" />
          Create Ticket
        </Link>
      </div>
    ),
    [role, tickets.length, exportCsv],
  );

  const pageTitle = role === 'REQUESTOR' ? 'My Tickets' : role === 'AGENT' ? 'Assigned Tickets' : 'Ticket Queue';
  const pageDesc = role === 'REQUESTOR'
    ? 'View and track the tickets you have submitted.'
    : role === 'AGENT'
      ? 'Manage tickets assigned to you. Update status and add comments.'
      : 'Track operational workload, triage issues, and manage ownership.';

  return (
    <div>
      <PageHeader title={pageTitle} description={pageDesc} actions={actions} />

      {permissions.canViewAllTickets(role) && (
        <TicketFilters filters={filters} onChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))} categories={categories} users={users} />
      )}

      {/* Basic filters for AGENT — search + status only */}
      {role === 'AGENT' && (
        <div className="card mb-4 p-3 sm:mb-6 sm:p-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
            <div>
              <label className="label">Search</label>
              <input value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} className="input" placeholder="Ticket number or subject" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} className="input">
                <option value="">All</option>
                {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REOPENED'].map((s) => (
                  <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={filters.priority} onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))} className="input">
                <option value="">All</option>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Simple search for REQUESTOR */}
      {role === 'REQUESTOR' && (
        <div className="card mb-4 p-3 sm:mb-6 sm:p-4">
          <div>
            <label className="label">Search your tickets</label>
            <input value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} className="input" placeholder="Search by ticket number or subject" />
          </div>
        </div>
      )}

      {/* Bulk action toolbar — only for ADMIN / MANAGER */}
      {permissions.canAssignTickets(role) && selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-ey-yellow/60 bg-ey-yellow/10 px-4 py-3">
          <span className="text-sm font-semibold text-ey-black">{selectedIds.size} selected</span>
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) handleBulkStatusChange(e.target.value); e.target.value = ''; }}
            className="input w-auto py-1.5 text-sm"
          >
            <option value="" disabled>Change status…</option>
            {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map((s) => (
              <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
            ))}
          </select>
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) handleBulkAssign(Number(e.target.value)); e.target.value = ''; }}
            className="input w-auto py-1.5 text-sm"
          >
            <option value="" disabled>Assign to…</option>
            {users.filter((u) => u.role !== 'REQUESTOR').map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button type="button" className="text-sm text-ey-gray-500 hover:text-ey-gray-700" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-ey-gray-500">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets found" description={role === 'REQUESTOR' ? 'You haven\'t submitted any tickets yet. Create one to get started.' : role === 'AGENT' ? 'No tickets are assigned to you right now.' : 'Try changing your filters or create a new ticket to get started.'} />
      ) : (
        <TicketTable
          tickets={tickets}
          {...(permissions.canAssignTickets(role) ? { selectedIds, onSelectionChange: setSelectedIds } : {})}
        />
      )}
    </div>
  );
}
