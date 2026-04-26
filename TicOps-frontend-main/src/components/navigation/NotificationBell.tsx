import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import type { Notification } from '../../types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    // Initial load
    ticketService.getNotifications(user.id).then(setItems);
    // Poll every 10 seconds for new notifications
    const interval = setInterval(() => {
      ticketService.getNotifications(user.id).then(setItems);
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await ticketService.markAllNotificationsRead(user.id);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      await ticketService.markNotificationRead(notif.id);
      setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn-secondary !px-2.5 sm:!px-3 relative"
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-ey-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ey-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-ey-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs text-ey-gray-500 hover:text-ey-black">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-ey-gray-400">No notifications</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full px-4 py-3 text-left transition hover:bg-ey-gray-50 ${!n.read ? 'bg-ey-yellow/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ey-yellow" />}
                    <div className={!n.read ? '' : 'pl-4'}>
                      <p className="text-sm text-ey-gray-800">{n.message}</p>
                      <p className="mt-0.5 text-xs text-ey-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
