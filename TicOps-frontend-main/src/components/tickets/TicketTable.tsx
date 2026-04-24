import { Link } from 'react-router-dom';
import type { TicketListItem } from '../../types';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../lib/roles';

interface TicketTableProps {
  tickets: TicketListItem[];
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
}

export default function TicketTable({ tickets, selectedIds, onSelectionChange }: TicketTableProps) {
  const { user } = useAuth();
  const role = user?.role ?? 'REQUESTOR';
  const showInternal = permissions.canViewInternalMeta(role);
  const selectable = !!onSelectionChange && !!selectedIds;

  const toggleOne = (id: number) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!onSelectionChange || !selectedIds) return;
    if (selectedIds.size === tickets.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(tickets.map((t) => t.id)));
    }
  };

  return (
    <>
      {/* Mobile card view */}
      <div className="space-y-3 lg:hidden">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="card block p-4 transition hover:shadow-md">
            <div className="flex items-start gap-3">
              {selectable && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(ticket.id)}
                  onChange={() => toggleOne(ticket.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-ey-gray-300 accent-ey-yellow"
                />
              )}
              <Link to={`/tickets/${ticket.id}`} className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ey-black">{ticket.ticketNumber}</div>
                    <div className="mt-1 truncate font-medium text-ey-gray-900">{ticket.title}</div>
                    {showInternal && <div className="mt-1 text-xs text-ey-gray-500">{ticket.requesterName}</div>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ey-gray-500">
                  <span>{ticket.category?.name || '-'}</span>
                  {showInternal && <span>{ticket.assignee?.name || 'Unassigned'}</span>}
                  <span>{formatDate(ticket.createdAt)}</span>
                  {ticket.isOverdue && <span className="font-semibold text-rose-600">{ticket.ageLabel}</span>}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="card hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ey-gray-200 text-sm">
            <thead className="bg-ey-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-ey-gray-500">
              <tr>
                {selectable && (
                  <th className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === tickets.length && tickets.length > 0}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-ey-gray-300 accent-ey-yellow"
                    />
                  </th>
                )}
                <th className="px-5 py-4">Ticket</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Category</th>
                {showInternal && <th className="px-5 py-4">Owner</th>}
                {showInternal && <th className="px-5 py-4">Source</th>}
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ey-gray-100 bg-white">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-ey-gray-50/80">
                  {selectable && (
                    <td className="px-3 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ticket.id)}
                        onChange={() => toggleOne(ticket.id)}
                        className="h-4 w-4 rounded border-ey-gray-300 accent-ey-yellow"
                      />
                    </td>
                  )}
                  <td className="px-5 py-4 align-top">
                    <Link to={`/tickets/${ticket.id}`} className="font-semibold text-ey-black hover:text-ey-gray-700">
                      {ticket.ticketNumber}
                    </Link>
                    <div className="mt-1 font-medium text-ey-gray-900">{ticket.title}</div>
                    {showInternal && <div className="mt-1 text-xs text-ey-gray-500">{ticket.requesterName} · {ticket.requesterEmail}</div>}
                  </td>
                  <td className="px-5 py-4 align-top"><StatusBadge status={ticket.status} /></td>
                  <td className="px-5 py-4 align-top"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-5 py-4 align-top text-ey-gray-700">{ticket.category?.name || '-'}</td>
                  {showInternal && <td className="px-5 py-4 align-top text-ey-gray-700">{ticket.assignee?.name || 'Unassigned'}</td>}
                  {showInternal && <td className="px-5 py-4 align-top text-ey-gray-700">{ticket.source}</td>}
                  <td className="px-5 py-4 align-top text-ey-gray-700">{formatDate(ticket.createdAt)}</td>
                  <td className="px-5 py-4 align-top">
                    <span className={ticket.isOverdue ? 'font-semibold text-rose-600' : 'text-ey-gray-700'}>{ticket.ageLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
