import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import KpiCard from '../../components/common/KpiCard';
import EmptyState from '../../components/common/EmptyState';
import { dashboardService } from '../../services/dashboardService';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../lib/roles';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import { formatDate } from '../../lib/utils';
import type { DashboardMetrics, DashboardSummary, TicketListItem } from '../../types';

const colors = ['#ffe600', '#2e2e38', '#83838f', '#b0b0b8', '#ccb800', '#4e4e56'];

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'REQUESTOR';
  const fullAccess = permissions.canViewFullDashboard(role);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [myTickets, setMyTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches: Promise<void>[] = [];

    if (fullAccess) {
      fetches.push(
        Promise.all([dashboardService.getSummary(), dashboardService.getMetrics()])
          .then(([s, m]) => { setSummary(s); setMetrics(m); }),
      );
    }

    // Agents see their assigned tickets; Requestors see their submitted tickets
    fetches.push(
      ticketService.getTickets({}).then((tickets) => {
        let filtered = tickets;
        if (role === 'AGENT') {
          filtered = tickets.filter((t) => t.assignedTo === user?.id);
        } else if (role === 'REQUESTOR') {
          filtered = tickets.filter((t) => t.requesterEmail === user?.email);
        }
        setMyTickets(filtered);

        // Build summary from filtered tickets for non-full-access roles
        if (!fullAccess) {
          const now = Date.now();
          const openStatuses = new Set(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED']);
          const open = filtered.filter((t) => openStatuses.has(t.status));
          const thisWeek = now - 7 * 24 * 60 * 60 * 1000;
          setSummary({
            totalTickets: filtered.length,
            openTickets: open.length,
            overdueTickets: filtered.filter((t) => t.isOverdue).length,
            resolvedThisWeek: filtered.filter((t) => t.resolvedAt && +new Date(t.resolvedAt) >= thisWeek).length,
            averageAgeHours: open.length
              ? Number((open.reduce((sum, t) => sum + (now - +new Date(t.createdAt)) / 3600000, 0) / open.length).toFixed(1))
              : 0,
            averageResolutionHours: 0,
          });
        }
      }),
    );

    Promise.all(fetches).finally(() => setLoading(false));
  }, [fullAccess, role, user?.id, user?.email]);

  if (loading) return <div className="text-sm text-ey-gray-500">Loading dashboard...</div>;
  if (!summary) return <EmptyState title="Dashboard unavailable" description="Unable to load metrics right now." />;

  const pageTitle = role === 'REQUESTOR'
    ? 'My Requests'
    : role === 'AGENT'
      ? 'My Workload'
      : 'Operations Dashboard';

  const pageDesc = role === 'REQUESTOR'
    ? 'Overview of tickets you have submitted and their current status.'
    : role === 'AGENT'
      ? 'Track your assigned tickets, status updates, and workload at a glance.'
      : 'Monitor backlog, resolution trends, and ownership distribution across the support workflow.';

  return (
    <div>
      <PageHeader title={pageTitle} description={pageDesc} />

      {/* KPI Cards — shown for all roles with contextual data */}
      <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <KpiCard label="Total Tickets" value={summary.totalTickets} helper={role === 'REQUESTOR' ? 'Your submitted tickets' : role === 'AGENT' ? 'Assigned to you' : 'All tickets in the system'} />
        <KpiCard label="Open" value={summary.openTickets} helper="Requires action" />
        <KpiCard label="Overdue" value={summary.overdueTickets} helper="Past due threshold" />
        {fullAccess && (
          <>
            <KpiCard label="Resolved This Week" value={summary.resolvedThisWeek} helper="Operational throughput" />
            <KpiCard label="Average Age" value={`${summary.averageAgeHours}h`} helper="Current backlog age" />
            <KpiCard label="Avg. Resolution Time" value={`${summary.averageResolutionHours}h`} helper="Mean resolution duration" />
          </>
        )}
      </div>

      {/* Full charts — only for ADMIN/MANAGER */}
      {fullAccess && metrics && (
        <>
          <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
            <div className="card p-4 sm:p-6">
              <div className="mb-4 text-base font-semibold text-ey-gray-900 sm:text-lg">Status Distribution</div>
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.byStatus} dataKey="value" nameKey="label" innerRadius={75} outerRadius={110} paddingAngle={4}>
                      {metrics.byStatus.map((entry, index) => (
                        <Cell key={entry.label} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-4 sm:p-6">
              <div className="mb-4 text-base font-semibold text-ey-gray-900 sm:text-lg">Owner Workload</div>
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.byOwner} margin={{ left: 0, right: 20, top: 16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ffe600" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
            <div className="card p-4 sm:p-6">
              <div className="mb-4 text-base font-semibold text-ey-gray-900 sm:text-lg">Priority Mix</div>
              <div className="space-y-3">
                {metrics.byPriority.map((item, index) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm text-ey-gray-700">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-ey-gray-100">
                      <div
                        className="h-3 rounded-full"
                        style={{ width: `${Math.max(8, (item.value / Math.max(1, summary.totalTickets)) * 100)}%`, backgroundColor: colors[index % colors.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4 sm:p-6">
              <div className="mb-4 text-base font-semibold text-ey-gray-900 sm:text-lg">Source Mix</div>
              <div className="grid gap-3 grid-cols-2 sm:gap-4">
                {metrics.sourceMix.map((item, index) => (
                  <div key={item.label} className="rounded-2xl border border-ey-gray-200 p-5">
                    <div className="text-sm text-ey-gray-500">{item.label}</div>
                    <div className="mt-2 text-3xl font-bold" style={{ color: colors[index % colors.length] }}>{item.value}</div>
                    <div className="mt-2 text-sm text-ey-gray-500">Tickets captured via {item.label.toLowerCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent tickets list — for AGENT/REQUESTOR */}
      {!fullAccess && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ey-gray-900 sm:text-lg">
              {role === 'AGENT' ? 'My Assigned Tickets' : 'My Submitted Tickets'}
            </h2>
            <Link to="/tickets" className="flex items-center gap-1 text-sm font-medium text-ey-gray-600 hover:text-ey-gray-900">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {myTickets.length === 0 ? (
            <EmptyState title="No tickets yet" description={role === 'AGENT' ? 'No tickets are currently assigned to you.' : 'You have not submitted any tickets yet.'} />
          ) : (
            <div className="space-y-3">
              {myTickets.slice(0, 5).map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="card block p-4 transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ey-gray-900">{ticket.ticketNumber} · {ticket.title}</div>
                      <div className="mt-1 text-xs text-ey-gray-500">{ticket.requesterName} · {formatDate(ticket.createdAt)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
