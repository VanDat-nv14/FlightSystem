import apiClient from './apiClient';

export interface SeatConfiguration {
  id: number;
  aircraftId: number;
  seatNumber: string;
  priceMultiplier: number;
  classType: string;
  position: string;
}

export interface ClassConfigurationRequest {
  classType: string;
  numberOfSeats: number;
  priceMultiplier: number;
}

export interface BulkCreateSeatConfigRequest {
  aircraftId: number;
  seatsPerRow: number;
  classes: ClassConfigurationRequest[];
}

export const seatConfigService = {
  getByAircraft: async (aircraftId: number): Promise<SeatConfiguration[]> => {
    const response = await apiClient.get<{ data: SeatConfiguration[], message: string }>(`/SeatConfiguration/by-aircraft/${aircraftId}`);
    return response.data.data;
  },

  bulkCreate: async (request: BulkCreateSeatConfigRequest): Promise<void> => {
    await apiClient.post(`/SeatConfiguration/bulk-create`, request);
  },

  clearByAircraft: async (aircraftId: number): Promise<void> => {
    await apiClient.delete(`/SeatConfiguration/by-aircraft/${aircraftId}`);
  }
};
