import type { DashboardMetrics, DashboardSummary } from '../types';
import { apiClient } from './apiClient';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return data;
  },

  async getMetrics(): Promise<DashboardMetrics> {
    const { data } = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
    return data;
  },
};
