import apiClient from './apiClient';
import type { User } from '../stores/useAuthStore';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export const authService = {
  login: async (data: any): Promise<AuthResponse> => {
    const response = await apiClient.post<{ data: AuthResponse, message: string }>('/Auth/login', data);
    return response.data.data;
  },
  
  register: async (data: any): Promise<AuthResponse> => {
    const response = await apiClient.post<{ data: AuthResponse, message: string }>('/Auth/register', data);
    return response.data.data;
  },

  registerPartner: async (data: any): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/Auth/register-partner', data);
    return response.data;
  },

  loginWithGoogle: () => {
    // Chuyển hướng người dùng sang endpoint xác thực của backend
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/Auth/login-google`;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/Auth/logout');
  }
};
