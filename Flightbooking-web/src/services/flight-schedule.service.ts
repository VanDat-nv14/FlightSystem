import apiClient from './apiClient';

export interface FlightSchedule {
  id: number;
  flightNumber: string;
  daysOfWeek: string; // e.g. "1,3,5" (0=Sunday, 1=Monday, ..., 6=Saturday)
  startDate: string;  // ISO Date string
  endDate?: string | null;
  routeId: number;
  originCode: string;
  destinationCode: string;
  aircraftId: number;
  aircraftModel: string;
  departureTime: string; // "HH:mm"
  arrivalTime: string;   // "HH:mm"
  basePrice: number;
  isActive: boolean;
  airlineId?: number | null;
  airlineName?: string;
  flightsGenerated: number;
}

export interface CreateFlightScheduleRequest {
  flightNumber: string;
  daysOfWeek: string;
  startDate: string;
  endDate?: string | null;
  routeId: number;
  aircraftId: number;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
}

export interface UpdateFlightScheduleRequest {
  daysOfWeek: string;
  startDate: string;
  endDate?: string | null;
  routeId: number;
  aircraftId: number;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  isActive: boolean;
}

export const flightScheduleService = {
  getAll: async (): Promise<FlightSchedule[]> => {
    const response = await apiClient.get<{ data: FlightSchedule[], message: string }>('/FlightSchedule');
    return response.data.data;
  },

  getByAirline: async (airlineId: number): Promise<FlightSchedule[]> => {
    const response = await apiClient.get<{ data: FlightSchedule[], message: string }>(`/FlightSchedule/by-airline/${airlineId}`);
    return response.data.data;
  },

  create: async (request: CreateFlightScheduleRequest): Promise<FlightSchedule> => {
    const response = await apiClient.post<{ data: FlightSchedule, message: string }>('/FlightSchedule', request);
    return response.data.data;
  },

  update: async (id: number, request: UpdateFlightScheduleRequest): Promise<boolean> => {
    const response = await apiClient.put<{ data: boolean, message: string }>(`/FlightSchedule/${id}`, request);
    return response.data.data;
  },

  delete: async (id: number): Promise<boolean> => {
    const response = await apiClient.delete<{ data: boolean, message: string }>(`/FlightSchedule/${id}`);
    return response.data.data;
  },

  generateToday: async (): Promise<number> => {
    const response = await apiClient.post<{ data: number, message: string }>('/FlightSchedule/generate-today');
    return response.data.data;
  },

  generateNext30Days: async (): Promise<number> => {
    const response = await apiClient.post<{ data: number, message: string }>('/FlightSchedule/generate-next-30');
    return response.data.data;
  }
};
