import type { AuthUser, LoginRequest } from '../types';
import { apiClient } from './apiClient';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthUser> {
    const { data } = await apiClient.post<AuthUser>('/auth/login', payload);
    return data;
  },
};
