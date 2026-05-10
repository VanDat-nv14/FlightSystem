import apiClient from './apiClient';

export interface Aircraft {
  id: number;
  registrationNumber: string;
  model: string;
  totalSeats: number;
  airlineId: number;
  airlineName: string;
  isActive: boolean;
}

export interface CreateAircraftRequest {
  registrationNumber: string;
  model: string;
  totalSeats: number;
  airlineId: number;
}

export interface UpdateAircraftRequest {
  model: string;
  totalSeats: number;
  isActive: boolean;
}

export const aircraftService = {
  getAll: async (): Promise<Aircraft[]> => {
    const response = await apiClient.get<{ data: Aircraft[], message: string }>('/Aircraft');
    return response.data.data;
  },

  getById: async (id: number): Promise<Aircraft> => {
    const response = await apiClient.get<{ data: Aircraft, message: string }>(`/Aircraft/${id}`);
    return response.data.data;
  },

  create: async (request: CreateAircraftRequest): Promise<Aircraft> => {
    const response = await apiClient.post<{ data: Aircraft, message: string }>('/Aircraft', request);
    return response.data.data;
  },

  update: async (id: number, request: UpdateAircraftRequest): Promise<Aircraft> => {
    const response = await apiClient.put<{ data: Aircraft, message: string }>(`/Aircraft/${id}`, request);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Aircraft/${id}`);
  }
};
