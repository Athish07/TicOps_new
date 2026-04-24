import type { TicketStatus } from '../../types';
import { cn } from '../../lib/utils';

const styles: Record<TicketStatus, string> = {
  OPEN: 'bg-ey-gray-100 text-ey-gray-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-brand-100 text-ey-gray-900',
  ON_HOLD: 'bg-orange-100 text-orange-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-ey-gray-200 text-ey-gray-700',
  REOPENED: 'bg-rose-100 text-rose-700',
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', styles[status])}>{status.replaceAll('_', ' ')}</span>;
}
