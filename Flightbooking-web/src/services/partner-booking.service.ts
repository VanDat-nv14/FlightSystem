import apiClient from './apiClient';

export interface PartnerTicket {
  ticketId: number;
  bookingId: number;
  bookingCode: string;
  bookingStatus: string;
  bookingDate: string;
  bookingTotalAmount: number;
  bookerName: string;
  bookerEmail: string;
  bookerPhoneNumber?: string | null;
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
  passengerDateOfBirth?: string | null;
  passengerGender: string;
  checkInStatus: string;
  baggageTags: PartnerBaggageTag[];
}

export interface PartnerBaggageTag {
  id: number;
  tagCode: string;
  weight: number;
  extraFee: number;
  status: string;
  createdAt: string;
  checkedInAt?: string | null;
  loadedAt?: string | null;
  arrivedAt?: string | null;
  claimedAt?: string | null;
}

export const partnerBookingService = {
  getMyTickets: async (): Promise<PartnerTicket[]> => {
    const response = await apiClient.get<{ data: PartnerTicket[], message: string }>('/partner/bookings');
    return response.data.data;
  },

  lookupByBookingCode: async (bookingCode: string): Promise<PartnerTicket[]> => {
    const response = await apiClient.get<{ data: PartnerTicket[], message: string }>(
      `/partner/bookings/lookup/${encodeURIComponent(bookingCode.trim())}`
    );
    return response.data.data;
  },

  updateCheckInStatus: async (ticketId: number, checkInStatus: string): Promise<PartnerTicket> => {
    const response = await apiClient.patch<{ data: PartnerTicket, message: string }>(
      `/partner/bookings/tickets/${ticketId}/check-in-status`,
      { checkInStatus }
    );
    return response.data.data;
  },

  updateBaggageTagStatus: async (tagId: number, status: string): Promise<PartnerBaggageTag> => {
    const response = await apiClient.patch<{ data: PartnerBaggageTag, message: string }>(
      `/partner/bookings/baggage-tags/${tagId}/status`,
      { status }
    );
    return response.data.data;
  }
};
