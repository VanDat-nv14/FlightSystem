import apiClient from './apiClient';

export interface CancellationPreview {
  bookingId: number;
  bookingCode: string;
  totalPaid: number;
  cancellationFee: number;
  refundAmount: number;
  refundPercentage: number;
  daysBeforeDeparture: number;
  policyDescription: string;
  canCancel: boolean;
  cannotCancelReason?: string | null;
}

export interface CancellationResult {
  success: boolean;
  bookingCode: string;
  refundAmount: number;
  message: string;
  cancelledAt: string;
}

export const cancellationService = {
  getCancelPreview: async (bookingId: number): Promise<CancellationPreview> => {
    const response = await apiClient.get<{ data: CancellationPreview, message: string }>(`/Booking/${bookingId}/cancel-preview`);
    return response.data.data;
  },

  cancelBooking: async (bookingId: number, reason: string): Promise<CancellationResult> => {
    const response = await apiClient.post<{ data: CancellationResult, message: string }>(`/Booking/${bookingId}/cancel`, { reason });
    return response.data.data;
  }
};
