import apiClient from './apiClient';

export interface UpcomingFlight {
  flightId: number;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  departureTime: string;
  aircraftModel: string;
  totalSeats: number;
  bookedSeats: number;
  status: string;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  tickets: number;
}

export interface PartnerDashboard {
  totalRevenue: number;
  todayRevenue: number;
  totalTickets: number;
  todayTickets: number;
  totalFlights: number;
  todayFlights: number;
  totalAircrafts: number;
  loadFactor: number;
  upcomingFlights: UpcomingFlight[];
  revenueChart: DailyRevenue[];
  economyTickets: number;
  businessTickets: number;
  firstClassTickets: number;
}

export const partnerDashboardService = {
  getDashboard: async (): Promise<PartnerDashboard> => {
    const response = await apiClient.get<{ data: PartnerDashboard, message: string }>('/partner/dashboard');
    return response.data.data;
  }
};
