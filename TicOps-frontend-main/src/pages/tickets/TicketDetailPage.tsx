import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import SlaCountdown from '../../components/common/SlaCountdown';
import ActivityTimeline from '../../components/tickets/ActivityTimeline';
import ChatPanel from '../../components/tickets/ChatPanel';
import SatisfactionRating from '../../components/tickets/SatisfactionRating';
import EmptyState from '../../components/common/EmptyState';
import { categoryService } from '../../services/categoryService';
import { ticketService } from '../../services/ticketService';
import { userService } from '../../services/userService';
import { formatDate } from '../../lib/utils';
import type { Category, ChatAttachment, TicketDetail, TicketStatus, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { permissions } from '../../lib/roles';

const statuses: TicketStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REOPENED'];

export default function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const { user } = useAuth();
  const { addToast } = useToast();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [detail, categoryData, userData] = await Promise.all([
      ticketService.getTicketById(ticketId),
      categoryService.getCategories(),
      userService.getUsers(),
    ]);
    setTicket(detail);
    setCategories(categoryData);
    setUsers(userData);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [ticketId]);

  const assignees = useMemo(() => users.filter((entry) => ['AGENT', 'MANAGER', 'ADMIN'].includes(entry.role)), [users]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setSaving(true);
    await ticketService.updateStatus(ticket.id, status);
    await load();
    setSaving(false);
    addToast(`Status updated to ${status.replaceAll('_', ' ')}`);
  };

  const handleAssign = async (assignedTo: number) => {
    if (!ticket) return;
    setSaving(true);
    await ticketService.assignTicket(ticket.id, assignedTo);
    await load();
    setSaving(false);
    addToast('Ticket reassigned successfully');
  };

  const handleComment = async (text: string, attachments: ChatAttachment[]) => {
    if (!ticket || !user || (!text.trim() && attachments.length === 0)) return;
    setSaving(true);
    await ticketService.sendChatMessage(ticket.id, user.id, user.name, user.role, text, attachments);
    await load();
    setSaving(false);
    addToast('Message sent');
  };

  const role = user?.role ?? 'REQUESTOR';

  if (loading) return <div className="text-sm text-ey-gray-500">Loading ticket details...</div>;
  if (!ticket) return <EmptyState title="Ticket not found" description="The selected ticket could not be loaded." />;

  return (
    <div>
      <PageHeader
        title={`${ticket.ticketNumber} · ${ticket.title}`}
        description={role === 'REQUESTOR'
          ? 'View your ticket details and communicate with the support team.'
          : 'Review issue details, update workflow status, and capture resolution activity.'}
      />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="card p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {permissions.canViewInternalMeta(role) && (
                <span className="rounded-full bg-ey-gray-100 px-2.5 py-1 text-xs font-semibold text-ey-gray-600">{ticket.source}</span>
              )}
              {ticket.isOverdue ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Overdue</span> : null}
              {permissions.canViewInternalMeta(role) && (
                <SlaCountdown dueAt={ticket.dueAt} status={ticket.status} />
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-ey-gray-500">Requester</div>
                <div className="mt-1 text-base font-semibold text-ey-gray-900">{ticket.requesterName}</div>
                <div className="text-sm text-ey-gray-500">{ticket.requesterEmail}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-ey-gray-500">Category</div>
                <div className="mt-1 text-base font-semibold text-ey-gray-900">{ticket.category?.name || categories.find((item) => item.id === ticket.categoryId)?.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-ey-gray-500">Assigned To</div>
                <div className="mt-1 text-base font-semibold text-ey-gray-900">{ticket.assignee?.name || 'Unassigned'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-ey-gray-500">Created</div>
                <div className="mt-1 text-base font-semibold text-ey-gray-900">{formatDate(ticket.createdAt)}</div>
              </div>
            </div>

            <div className="mt-6 border-t border-ey-gray-200 pt-6">
              <div className="text-sm font-medium text-ey-gray-500">Description</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ey-gray-700">{ticket.description}</p>
            </div>
          </div>

          {permissions.canViewActivityTimeline(role) && (
            <ActivityTimeline activities={ticket.activities} users={users} />
          )}
          <ChatPanel messages={ticket.chatMessages || []} currentUserId={user?.id ?? 0} onSend={handleComment} sending={saving} userRole={role} />
        </div>

        <div className="space-y-6">
          {/* Update panel — only for staff roles */}
          {permissions.canChangeStatus(user?.role ?? 'REQUESTOR') && (
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-ey-gray-900">Update Ticket</h3>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={ticket.status} onChange={(e) => handleStatusChange(e.target.value as TicketStatus)} disabled={saving}>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {permissions.canAssignTickets(user?.role ?? 'REQUESTOR') && (
                  <div>
                    <label className="label">Assignee</label>
                    <select className="input" value={ticket.assignedTo || ''} onChange={(e) => handleAssign(Number(e.target.value))} disabled={saving}>
                      <option value="">Unassigned</option>
                      {assignees.map((entry) => (
                        <option key={entry.id} value={entry.id}>{entry.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-ey-gray-900">Meta</h3>
            <div className="mt-5 space-y-4 text-sm text-ey-gray-700">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ey-gray-500">Updated At</span>
                <span className="font-medium">{formatDate(ticket.updatedAt)}</span>
              </div>
              {permissions.canViewInternalMeta(role) && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ey-gray-500">Due At</span>
                  <span className="font-medium">{formatDate(ticket.dueAt)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-ey-gray-500">Resolved At</span>
                <span className="font-medium">{formatDate(ticket.resolvedAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ey-gray-500">Closed At</span>
                <span className="font-medium">{formatDate(ticket.closedAt)}</span>
              </div>
            </div>
          </div>

          {/* Satisfaction rating — REQUESTOR only, after resolution */}
          {role === 'REQUESTOR' && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
            <SatisfactionRating
              ticketId={ticket.id}
              existingRating={ticket.satisfactionRating}
              existingComment={ticket.satisfactionComment}
              onSubmit={load}
            />
          )}

          {/* Satisfaction display — Staff can see the rating if given */}
          {role !== 'REQUESTOR' && ticket.satisfactionRating && (
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-ey-gray-900">Customer Feedback</h3>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`h-5 w-5 ${star <= ticket.satisfactionRating! ? 'fill-ey-yellow text-ey-yellow' : 'text-ey-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm font-medium text-ey-gray-600">{ticket.satisfactionRating}/5</span>
              </div>
              {ticket.satisfactionComment && (
                <p className="mt-2 text-sm italic text-ey-gray-500">"{ticket.satisfactionComment}"</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
