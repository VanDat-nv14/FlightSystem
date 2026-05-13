import apiClient from './apiClient';
export interface Flight {
  id: number;
  flightNumber: string;
  routeId: number;
  originCode: string;
  destinationCode: string;
  aircraftId: number;
  aircraftModel: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  basePrice: number;
  availableSeats: number;
}

export interface CreateFlightRequest {
  flightNumber: string;
  routeId: number;
  aircraftId: number;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
}

export interface UpdateFlightRequest {
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  status: string;
}

export interface FlightSeat {
  id: number;
  flightId: number;
  seatNumber: string;
  classType: number; // 0: Economy, 1: Business, 2: FirstClass
  status: number; // 0: Available, 1: Booked, 2: Reserved, 3: Blocked
  price: number;
}

export const flightService = {
  getAll: async (): Promise<Flight[]> => {
    const response = await apiClient.get<{ data: Flight[], message: string }>('/Flight');
    return response.data.data;
  },

  getByAirline: async (airlineId: number): Promise<Flight[]> => {
    const response = await apiClient.get<{ data: Flight[], message: string }>(`/Flight/by-airline/${airlineId}`);
    return response.data.data;
  },

  search: async (params: { originAirportId: number, destinationAirportId: number, departureDate: string, passengerCount: number }): Promise<Flight[]> => {
    const response = await apiClient.get<{ data: Flight[], message: string }>('/Flight/search', { params });
    return response.data.data;
  },

  getById: async (id: number): Promise<Flight> => {
    const response = await apiClient.get<{ data: Flight, message: string }>(`/Flight/${id}`);
    return response.data.data;
  },

  getSeats: async (flightId: number): Promise<FlightSeat[]> => {
    const response = await apiClient.get<{ data: FlightSeat[], message: string }>(`/Flight/${flightId}/seats`);
    return response.data.data;
  },

  create: async (request: CreateFlightRequest): Promise<Flight> => {
    const response = await apiClient.post<{ data: Flight, message: string }>('/Flight', request);
    return response.data.data;
  },

  update: async (id: number, request: UpdateFlightRequest): Promise<Flight> => {
    const response = await apiClient.put<{ data: Flight, message: string }>(`/Flight/${id}`, request);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Flight/${id}`);
  }
};
