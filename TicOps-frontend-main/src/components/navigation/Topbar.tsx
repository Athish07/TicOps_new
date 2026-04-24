import { LogOut, Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../lib/roles';
import NotificationBell from './NotificationBell';

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'REQUESTOR';
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/tickets?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-ey-gray-200 bg-white/90 backdrop-blur">
      <div className="h-1 bg-ey-yellow" />
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-ey-gray-500 hover:bg-ey-gray-100 hover:text-ey-black md:hidden"
            onClick={onMenuToggle}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {permissions.canViewInternalMeta(role) && (
            <div className="relative hidden w-full max-w-md sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ey-gray-400" size={18} />
              <input className="input pl-10" placeholder="Search tickets, requestors, or owners" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearch} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <div className="hidden rounded-xl border border-ey-gray-200 px-4 py-2 text-right md:block">
            <div className="text-sm font-semibold text-ey-black">{user?.name}</div>
            <div className="text-xs text-ey-gray-500">{user?.role}</div>
          </div>
          <div className="rounded-lg px-2 py-1 text-right md:hidden">
            <div className="text-xs font-semibold text-ey-black">{user?.name}</div>
          </div>
          <button className="btn-secondary !px-2.5 sm:!px-3" type="button" onClick={logout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
