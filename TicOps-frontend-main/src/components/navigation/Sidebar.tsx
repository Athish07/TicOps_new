import { BookOpen, ChevronLeft, ChevronRight, Inbox, LayoutDashboard, PlusSquare, Settings, Ticket, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { env } from '../../config/env';
import { cn } from '../../lib/utils';
import { permissions } from '../../lib/roles';
import { useAuth } from '../../context/AuthContext';

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { to: '/tickets', label: 'Tickets', icon: Ticket, roles: null },
  { to: '/tickets/new', label: 'Create Ticket', icon: PlusSquare, roles: null },
  { to: '/email-inbox', label: 'Email Inbox', icon: Inbox, roles: 'staff' as const },
  { to: '/kb', label: 'Knowledge Base', icon: BookOpen, roles: null },
  { to: '/settings', label: 'Settings', icon: Settings, roles: 'settings' as const },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const navItems = useMemo(() => {
    if (!user) return [];
    return allNavItems.filter((item) => {
      if (item.roles === null) return true;
      if (item.roles === 'settings') return permissions.canAccessSettings(user.role);
      if (item.roles === 'staff') return permissions.canViewInternalMeta(user.role);
      return false;
    });
  }, [user]);

  /* ── Shared sidebar inner content ───────────────────────────────── */
  const renderContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col py-6" style={{ paddingLeft: isCollapsed ? '0.75rem' : '1.25rem', paddingRight: isCollapsed ? '0.75rem' : '1.25rem' }}>
      {/* Brand area — logo always fully visible */}
      <div className={cn('mb-8', isCollapsed ? 'flex flex-col items-center' : 'flex items-start justify-between')}>
        <div className={cn(isCollapsed && 'flex flex-col items-center')}>
          {/* Full logo when expanded, cropped to show only "EY" part when collapsed */}
          <div className={cn('overflow-hidden', isCollapsed ? 'h-10 w-8' : 'h-8 w-auto')}>
            <img
              src="/ey-logo.png"
              alt="EY"
              className={cn(
                isCollapsed
                  ? 'h-10 w-auto max-w-none object-cover object-left'
                  : 'h-8 w-auto',
              )}
            />
          </div>
          {!isCollapsed && (
            <>
              <div className="mt-2 text-2xl font-bold tracking-tight text-white">{env.appName}</div>
              <p className="mt-2 text-sm text-ey-gray-400">Smart ticketing system for issue tracking and management.</p>
            </>
          )}
        </div>
        {/* Mobile close button */}
        <button
          className="mt-1 rounded-lg p-1 text-ey-gray-400 hover:bg-ey-gray-800 hover:text-white md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-xl text-sm font-medium transition',
                  isCollapsed ? 'justify-center px-2.5 py-3' : 'gap-3 px-4 py-3',
                  isActive
                    ? 'bg-ey-yellow text-ey-black'
                    : 'text-ey-gray-300 hover:bg-ey-gray-800 hover:text-white',
                )
              }
            >
              <Icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        className="mt-6 hidden items-center justify-center rounded-xl border border-ey-gray-700 py-2 text-ey-gray-400 transition hover:bg-ey-gray-800 hover:text-white md:flex"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!isCollapsed && <span className="ml-2 text-xs">Collapse</span>}
      </button>

      <div className={cn('mt-auto border-t border-ey-gray-700 pt-4 text-xs text-ey-gray-500', isCollapsed && 'text-center')}>
        {isCollapsed ? '© EY' : `© ${new Date().getFullYear()} EY. All rights reserved.`}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 bg-ey-black transition-all duration-300 md:sticky md:top-0 md:block md:h-screen',
          collapsed ? 'w-[72px]' : 'w-72',
        )}
      >
        {renderContent(collapsed)}
      </aside>

      {/* Mobile overlay — always expanded */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-ey-black shadow-xl">
            {renderContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
//         </div>
//       )}
//     </>
//   );
// }
