import type { IngestedEmail, TicketListItem } from '../types';
import { apiClient } from './apiClient';

export const emailService = {
  /** Get all ingested emails, optionally filtered by status */
  async getIngested(status?: string): Promise<IngestedEmail[]> {
    const params = status ? { status } : {};
    const { data } = await apiClient.get<IngestedEmail[]>('/email/ingested', { params });
    return data;
  },

  /** Convert a pending email into a ticket */
  async convertToTicket(emailId: number): Promise<TicketListItem> {
    const { data } = await apiClient.post<TicketListItem>(`/email/ingested/${emailId}/convert`);
    return data;
  },

  /** Discard an ingested email */
  async discardEmail(emailId: number): Promise<void> {
    await apiClient.post(`/email/ingested/${emailId}/discard`);
  },
};
