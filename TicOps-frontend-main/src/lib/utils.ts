export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function getAgeLabel(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `${mins}m`;
}

export function humanizeKey(value: string) {
  return value.replaceAll('_', ' ');
}
