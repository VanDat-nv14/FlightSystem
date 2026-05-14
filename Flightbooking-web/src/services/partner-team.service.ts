import apiClient from "./apiClient";
import type { CreateUserRequest, UpdateUserRequest, UserListItem } from "./user.service";

export const partnerTeamService = {
  getAll: async (): Promise<UserListItem[]> => {
    const response = await apiClient.get<{ data: UserListItem[]; message: string }>("/partner/team");
    return response.data.data;
  },

  create: async (data: CreateUserRequest): Promise<UserListItem> => {
    const response = await apiClient.post<{ data: UserListItem; message: string }>("/partner/team", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateUserRequest): Promise<boolean> => {
    const response = await apiClient.put<{ data: boolean; message: string }>(`/partner/team/${id}`, data);
    return response.data.data;
  },

  toggleLock: async (id: number): Promise<boolean> => {
    const response = await apiClient.patch<{ data: boolean; message: string }>(`/partner/team/${id}/toggle-lock`);
    return response.data.data;
  },
};
