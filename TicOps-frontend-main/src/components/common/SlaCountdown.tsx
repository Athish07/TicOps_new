import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface SlaCountdownProps {
  dueAt?: string;
  status: string;
}

function getRemaining(dueAt: string) {
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'Breached', hours: 0, minutes: 0, isBreached: true, isWarning: false };

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const isWarning = hours < 2;

  let label: string;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    label = `${days}d ${hours % 24}h left`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m left`;
  } else {
    label = `${minutes}m left`;
  }

  return { label, hours, minutes, isBreached: false, isWarning };
}

const closedStatuses = new Set(['RESOLVED', 'CLOSED']);

export default function SlaCountdown({ dueAt, status }: SlaCountdownProps) {
  const [remaining, setRemaining] = useState(() => dueAt ? getRemaining(dueAt) : null);

  useEffect(() => {
    if (!dueAt || closedStatuses.has(status)) return;
    setRemaining(getRemaining(dueAt));
    const interval = setInterval(() => setRemaining(getRemaining(dueAt)), 60000);
    return () => clearInterval(interval);
  }, [dueAt, status]);

  if (!dueAt || closedStatuses.has(status) || !remaining) return null;

  const color = remaining.isBreached
    ? 'bg-rose-100 text-rose-700 border-rose-200'
    : remaining.isWarning
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${color}`}>
      <Clock size={16} className="shrink-0" />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide">SLA</div>
        <div className="text-sm font-bold">{remaining.label}</div>
      </div>
    </div>
  );
}
