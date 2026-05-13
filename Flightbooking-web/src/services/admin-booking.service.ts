import apiClient from './apiClient';

export interface AdminTicketSummary {
  ticketId: number;
  flightNumber: string;
  airlineName: string;
  airlineCode: string;
  originCode: string;
  destinationCode: string;
  departureTime: string;
  seatNumber: string;
  seatClass: string;
  seatPrice: number;
  passengerName: string;
  checkInStatus: string;
}

export interface AdminBooking {
  bookingId: number;
  bookingStatus: string;
  bookingType: string;
  bookingDate: string;
  totalAmount: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  ticketCount: number;
  tickets: AdminTicketSummary[];
}

export const adminBookingService = {
  getAll: async (): Promise<AdminBooking[]> => {
    const response = await apiClient.get<{ data: AdminBooking[], message: string }>('/admin/bookings');
    return response.data.data;
  },

  getById: async (id: number): Promise<AdminBooking> => {
    const response = await apiClient.get<{ data: AdminBooking, message: string }>(`/admin/bookings/${id}`);
    return response.data.data;
  },

  updateStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.patch(`/admin/bookings/${id}/status`, { status });
  }
};
