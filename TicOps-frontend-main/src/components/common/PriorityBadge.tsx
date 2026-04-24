import type { TicketPriority } from '../../types';
import { cn } from '../../lib/utils';

const styles: Record<TicketPriority, string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-rose-100 text-rose-700',
};

export default function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', styles[priority])}>{priority}</span>;
}
