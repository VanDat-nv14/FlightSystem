import apiClient from './apiClient';

export interface UserListItem {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  createdAt: string;
  isLocked: boolean;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  fullName: string;
  phoneNumber?: string;
  role: string;
}

export const userService = {
  getAll: async (): Promise<UserListItem[]> => {
    const response = await apiClient.get<{ data: UserListItem[]; message: string }>('/Users');
    return response.data.data;
  },

  create: async (data: CreateUserRequest): Promise<UserListItem> => {
    const response = await apiClient.post<{ data: UserListItem; message: string }>('/Users', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<boolean> => {
    const response = await apiClient.put<{ data: boolean; message: string }>(`/Users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<boolean> => {
    const response = await apiClient.delete<{ data: boolean; message: string }>(`/Users/${id}`);
    return response.data.data;
  },

  toggleLock: async (id: number): Promise<boolean> => {
    const response = await apiClient.patch<{ data: boolean; message: string }>(`/Users/${id}/toggle-lock`);
    return response.data.data;
  },
};
