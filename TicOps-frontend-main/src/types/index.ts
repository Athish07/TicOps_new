export type UserRole = 'REQUESTOR' | 'AGENT' | 'MANAGER' | 'ADMIN';
export type TicketSource = 'EMAIL' | 'WEB';
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActivityType = 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'PRIORITY_CHANGED' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  team?: string;
  isActive?: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  team?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  team?: string;
  isActive?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  source: TicketSource;
  requesterName: string;
  requesterEmail: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId?: number;
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  dueAt?: string;
  isOverdue?: boolean;
  channelReference?: string;
  satisfactionRating?: number;
  satisfactionComment?: string;
}

export interface TicketActivity {
  id: number;
  ticketId: number;
  activityType: ActivityType;
  oldValue?: string;
  newValue?: string;
  commentText?: string;
  changedBy?: number;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  commentText: string;
  visibility: 'INTERNAL' | 'PUBLIC';
  createdBy?: number;
  createdAt: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface ChatMessage {
  id: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  senderRole: UserRole;
  text: string;
  attachments: ChatAttachment[];
  createdAt: string;
}

export interface TicketListItem extends Ticket {
  category?: Category;
  assignee?: User;
  ageLabel: string;
}

export interface TicketDetail extends Ticket {
  category?: Category;
  assignee?: User;
  activities: TicketActivity[];
  comments: TicketComment[];
  chatMessages: ChatMessage[];
}

export interface DashboardSummary {
  totalTickets: number;
  openTickets: number;
  overdueTickets: number;
  resolvedThisWeek: number;
  averageAgeHours: number;
  averageResolutionHours: number;
}

export interface DistributionItem {
  label: string;
  value: number;
}

export interface DashboardMetrics {
  byStatus: DistributionItem[];
  byPriority: DistributionItem[];
  byOwner: DistributionItem[];
  sourceMix: DistributionItem[];
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface TicketFiltersState {
  search: string;
  status: string;
  priority: string;
  categoryId: string;
  assignedTo: string;
  source: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  source: TicketSource;
  requesterName: string;
  requesterEmail: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId?: number;
  assignedTo?: number;
}

export interface KbArticle {
  id: number;
  categoryId: number;
  title: string;
  body: string;
  tags: string[];
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  emailOnAssign: boolean;
  emailOnStatusChange: boolean;
  emailOnComment: boolean;
  emailOnResolved: boolean;
}

export interface AutoAssignRule {
  enabled: boolean;
  strategy: 'ROUND_ROBIN' | 'LOAD_BALANCED';
  categoryAgentMap: Record<number, number[]>; // categoryId -> eligible agent ids
}

export interface IngestedEmail {
  id: number;
  messageUid: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  bodyPreview: string;
  receivedAt: string;
  processedAt: string;
  ticketId: number | null;
  status: 'PENDING' | 'CONVERTED' | 'DISCARDED';
  detectedPriority: TicketPriority;
}

