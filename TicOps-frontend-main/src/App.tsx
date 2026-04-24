import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { permissions } from './lib/roles';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TicketListPage from './pages/tickets/TicketListPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import SettingsPage from './pages/settings/SettingsPage';
import KnowledgeBasePage from './pages/kb/KnowledgeBasePage';
import EmailInboxPage from './pages/email/EmailInboxPage';
import NotFoundPage from './pages/NotFoundPage';
import AppLayout from './layouts/AppLayout';
import type { UserRole } from './types';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-ey-gray-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function RoleGuard({ allowed, children }: { allowed: (role: UserRole) => boolean; children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || !allowed(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/new" element={<CreateTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="kb" element={<KnowledgeBasePage />} />
        <Route path="email-inbox" element={<RoleGuard allowed={permissions.canViewInternalMeta}><EmailInboxPage /></RoleGuard>} />
        <Route path="settings" element={<RoleGuard allowed={permissions.canAccessSettings}><SettingsPage /></RoleGuard>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
