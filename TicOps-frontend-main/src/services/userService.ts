import type { CreateUserPayload, UpdateUserPayload, User } from '../types';
import { apiClient } from './apiClient';

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const { data } = await apiClient.put<User>(`/users/${id}`, payload);
    return data;
  },
};
