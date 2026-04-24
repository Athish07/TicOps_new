import type { Category } from '../types';
import { apiClient } from './apiClient';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>('/categories');
    return data;
  },

  async createCategory(payload: { name: string; description?: string }): Promise<Category> {
    const { data } = await apiClient.post<Category>('/categories', payload);
    return data;
  },

  async updateCategory(id: number, payload: { name?: string; description?: string }): Promise<Category> {
    const { data } = await apiClient.put<Category>(`/categories/${id}`, payload);
    return data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
