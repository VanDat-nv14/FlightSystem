import apiClient from './apiClient';

export interface Airline {
  id: number;
  name: string;
  code: string;
  country: string;
  logoUrl?: string;
}

export const airlineService = {
  getAll: async (): Promise<Airline[]> => {
    const response = await apiClient.get<{ data: Airline[], message: string }>('/Airline');
    return response.data.data;
  },

  getById: async (id: number): Promise<Airline> => {
    const response = await apiClient.get<{ data: Airline, message: string }>(`/Airline/${id}`);
    return response.data.data;
  }
};
