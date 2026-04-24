import type { AutoAssignRule, ChatAttachment, ChatMessage, CreateTicketPayload, KbArticle, Notification, NotificationPreferences, TicketComment, TicketDetail, TicketFiltersState, TicketListItem, TicketStatus } from '../types';
import { apiClient } from './apiClient';

export const ticketService = {
  async getTickets(filters?: Partial<TicketFiltersState>): Promise<TicketListItem[]> {
    const { data } = await apiClient.get<TicketListItem[]>('/tickets', { params: filters });
    return data;
  },

  async getTicketById(id: number): Promise<TicketDetail> {
    const { data } = await apiClient.get<TicketDetail>(`/tickets/${id}`);
    return data;
  },

  async createTicket(payload: CreateTicketPayload): Promise<TicketListItem> {
    const { data } = await apiClient.post<TicketListItem>('/tickets', payload);
    return data;
  },

  async updateStatus(id: number, status: TicketStatus) {
    const { data } = await apiClient.patch<TicketListItem>(`/tickets/${id}/status`, { status });
    return data;
  },

  async assignTicket(id: number, assignedTo: number) {
    const { data } = await apiClient.patch<TicketListItem>(`/tickets/${id}/assign`, { assignedTo });
    return data;
  },

  async addComment(id: number, commentText: string): Promise<TicketComment> {
    const { data } = await apiClient.post<TicketComment>(`/tickets/${id}/comments`, { commentText });
    return data;
  },

  async sendChatMessage(ticketId: number, _senderId: number, _senderName: string, _senderRole: string, text: string, attachments: ChatAttachment[]): Promise<ChatMessage> {
    const { data } = await apiClient.post<ChatMessage>(`/tickets/${ticketId}/chat`, { text, attachments });
    return data;
  },

  async submitRating(ticketId: number, rating: number, comment?: string) {
    const { data } = await apiClient.post(`/tickets/${ticketId}/rating`, { rating, comment });
    return data;
  },

  async bulkUpdateStatus(ids: number[], status: TicketStatus) {
    const { data } = await apiClient.patch('/tickets/bulk/status', { ids, status });
    return data;
  },

  async bulkAssign(ids: number[], assignedTo: number) {
    const { data } = await apiClient.patch('/tickets/bulk/assign', { ids, assignedTo });
    return data;
  },

  // --- Knowledge Base ---
  async getKbArticles(): Promise<KbArticle[]> {
    const { data } = await apiClient.get<KbArticle[]>('/kb/articles');
    return data;
  },

  async createKbArticle(article: Omit<KbArticle, 'id'>): Promise<KbArticle> {
    const { data } = await apiClient.post<KbArticle>('/kb/articles', article);
    return data;
  },

  // --- Notifications ---
  async getNotifications(userId: number): Promise<Notification[]> {
    const { data } = await apiClient.get<Notification[]>('/notifications', { params: { userId } });
    return data;
  },

  async markNotificationRead(notifId: number) {
    return apiClient.patch(`/notifications/${notifId}/read`);
  },

  async markAllNotificationsRead(userId: number) {
    return apiClient.patch('/notifications/read-all', { userId });
  },

  async getNotificationPrefs(userId: number): Promise<NotificationPreferences> {
    const { data } = await apiClient.get<NotificationPreferences>(`/notifications/prefs/${userId}`);
    return data;
  },

  async saveNotificationPrefs(userId: number, prefs: NotificationPreferences) {
    const { data } = await apiClient.put(`/notifications/prefs/${userId}`, prefs);
    return data;
  },

  // --- Auto-Assignment ---
  async getAutoAssignRule(): Promise<AutoAssignRule> {
    const { data } = await apiClient.get<AutoAssignRule>('/settings/auto-assign');
    return data;
  },

  async saveAutoAssignRule(rule: AutoAssignRule) {
    const { data } = await apiClient.put('/settings/auto-assign', rule);
    return data;
  },

  // --- Duplicate detection ---
  async findSimilarTickets(title: string): Promise<TicketListItem[]> {
    const { data } = await apiClient.get<TicketListItem[]>('/tickets/similar', { params: { title } });
    return data;
  },
};
