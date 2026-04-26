import type { UserRole } from '../types';

export const permissions = {
  canViewFullDashboard: (role: UserRole) => ['ADMIN', 'MANAGER'].includes(role),
  canViewAllTickets: (role: UserRole) => ['ADMIN', 'MANAGER'].includes(role),
  canAssignTickets: (role: UserRole) => ['ADMIN', 'MANAGER'].includes(role),
  canChangeStatus: (role: UserRole) => ['ADMIN', 'MANAGER', 'AGENT'].includes(role),
  canAccessSettings: (role: UserRole) => role === 'ADMIN',
  canCreateTicket: (_role: UserRole) => true,
  canViewActivityTimeline: (role: UserRole) => ['ADMIN', 'MANAGER', 'AGENT'].includes(role),
  canSetPriority: (role: UserRole) => ['ADMIN', 'MANAGER', 'AGENT', 'REQUESTOR'].includes(role),
  canUseFilters: (role: UserRole) => ['ADMIN', 'MANAGER', 'AGENT'].includes(role),
  canViewInternalMeta: (role: UserRole) => ['ADMIN', 'MANAGER', 'AGENT'].includes(role),
  canCreateKbArticle: (role: UserRole) => ['ADMIN', 'AGENT'].includes(role),
} as const;
