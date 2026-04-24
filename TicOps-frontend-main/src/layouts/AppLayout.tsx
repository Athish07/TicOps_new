import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Topbar from '../components/navigation/Topbar';

const COLLAPSE_KEY = 'ticops-sidebar-collapsed';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-ey-gray-50">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapse} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
