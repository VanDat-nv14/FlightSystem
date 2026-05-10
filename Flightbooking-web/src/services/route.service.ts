import apiClient from './apiClient';

export interface Route {
  id: number;
  originAirportId: number;
  originCode: string;
  originCity: string;
  destinationAirportId: number;
  destinationCode: string;
  destinationCity: string;
  distanceKm: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
}

export interface CreateRouteRequest {
  originAirportId: number;
  destinationAirportId: number;
  distanceKm: string;
  estimatedDurationMinutes: number;
}

export interface UpdateRouteRequest {
  distanceKm: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
}

export const routeService = {
  getAll: async (): Promise<Route[]> => {
    const response = await apiClient.get<{ data: Route[], message: string }>('/Route');
    return response.data.data;
  },

  getById: async (id: number): Promise<Route> => {
    const response = await apiClient.get<{ data: Route, message: string }>(`/Route/${id}`);
    return response.data.data;
  },

  create: async (request: CreateRouteRequest): Promise<Route> => {
    const response = await apiClient.post<{ data: Route, message: string }>('/Route', request);
    return response.data.data;
  },

  update: async (id: number, request: UpdateRouteRequest): Promise<Route> => {
    const response = await apiClient.put<{ data: Route, message: string }>(`/Route/${id}`, request);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Route/${id}`);
  }
};
