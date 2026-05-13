import apiClient from './apiClient';

export interface Airline {
  id: number;
  name: string;
  code: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
  status: string; // Pending | Approved | Rejected | Suspended
  aircraftCount: number;
}

export const airlineService = {
  getAll: async (): Promise<Airline[]> => {
    const response = await apiClient.get<{ data: Airline[], message: string }>('/Airline');
    return response.data.data;
  },

  getById: async (id: number): Promise<Airline> => {
    const response = await apiClient.get<{ data: Airline, message: string }>(`/Airline/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.patch(`/Airline/${id}/status`, { status });
  }
};

