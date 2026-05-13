import apiClient from './apiClient';

export interface TicketSummary {
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

export interface BookingResponse {
  bookingId: number;
  bookingStatus: string;
  bookingType: string;
  bookingDate: string;
  totalAmount: number;
  customerId: number;
  ticketCount: number;
  tickets: TicketSummary[];
}

export const bookingService = {
  getMyBookings: async (): Promise<BookingResponse[]> => {
    const response = await apiClient.get<{ data: BookingResponse[], message: string }>('/Booking/my-bookings');
    return response.data.data;
  },

  createBooking: async (data: any): Promise<any> => {
    const response = await apiClient.post<{ data: any, message: string }>('/Booking/create', data);
    return response.data.data;
  },
};
