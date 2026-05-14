import apiClient from "./apiClient";
import type { Airline } from "./airline.service";

export interface UpdatePartnerAirlineRequest {
  name: string;
  logoUrl?: string | null;
  country?: string | null;
  isActive: boolean;
}

export const partnerAirlineService = {
  getMine: async (): Promise<Airline> => {
    const response = await apiClient.get<{ data: Airline; message: string }>("/partner/airline");
    return response.data.data;
  },

  updateMine: async (data: UpdatePartnerAirlineRequest): Promise<Airline> => {
    const response = await apiClient.put<{ data: Airline; message: string }>("/partner/airline", data);
    return response.data.data;
  },
};
