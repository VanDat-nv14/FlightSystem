import apiClient from './apiClient';

export interface Airport {
  id: number;
  code: string;
  name: string;
  city: string;
  country: string;
  terminal?: string;
  timezone?: string;
}

export const airportService = {
  getAll: async (): Promise<Airport[]> => {
    const response = await apiClient.get<{ data: Airport[], message: string }>('/Airport');
    return response.data.data;
  },

  getById: async (id: number): Promise<Airport> => {
    const response = await apiClient.get<{ data: Airport, message: string }>(`/Airport/${id}`);
    return response.data.data;
  },

  create: async (airport: Omit<Airport, 'id'>): Promise<Airport> => {
    const response = await apiClient.post<{ data: Airport, message: string }>('/Airport', airport);
    return response.data.data;
  },

  update: async (id: number, airport: Partial<Airport>): Promise<Airport> => {
    const response = await apiClient.put<{ data: Airport, message: string }>(`/Airport/${id}`, airport);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Airport/${id}`);
  }
};
