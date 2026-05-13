import apiClient from './apiClient';

export interface PartnerTicket {
  ticketId: number;
  bookingId: number;
  flightId: number;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  seatNumber: string;
  seatClass: string;
  seatPrice: number;
  passengerName: string;
  passengerPassport: string;
  passengerNationality: string;
  checkInStatus: string;
}

export const partnerBookingService = {
  getMyTickets: async (): Promise<PartnerTicket[]> => {
    const response = await apiClient.get<{ data: PartnerTicket[], message: string }>('/partner/bookings');
    return response.data.data;
  }
};
