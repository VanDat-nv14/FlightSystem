import apiClient from "./apiClient";

export interface CustomerNotification {
  id: number;
  type: string;
  subject: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export const notificationService = {
  getMyNotifications: async (): Promise<CustomerNotification[]> => {
    const response = await apiClient.get<{ data: CustomerNotification[]; message: string }>("/CustomerNotifications");
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ data: number; message: string }>("/CustomerNotifications/unread-count");
    return response.data.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/CustomerNotifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put("/CustomerNotifications/read-all");
  },
};
