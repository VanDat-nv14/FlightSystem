import apiClient from './apiClient';

export interface AdditionalService {
    id: number;
    serviceName: string;
    description?: string;
    price: number;
    serviceType: string;
}

export interface BaggageAllowance {
    id: number;
    classType: number; // enum (e.g. 0: Economy, 1: Business, etc)
    maxWeight: number;
    maxPieces: number;
    additionalFee: number;
}

export const bookingExtrasService = {
    getAdditionalServices: async () => {
        const response = await apiClient.get<{ data: AdditionalService[], message: string }>('/Services/additional-services');
        return response.data.data;
    },
    getBaggageAllowances: async () => {
        const response = await apiClient.get<{ data: BaggageAllowance[], message: string }>('/Services/baggage-allowances');
        return response.data.data;
    }
};
