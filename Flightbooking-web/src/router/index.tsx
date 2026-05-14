import { Routes, Route } from "react-router-dom"
import CustomerLayout from "../layouts/CustomerLayout"
import AdminLayout from "../layouts/AdminLayout"
import PartnerLayout from "../layouts/PartnerLayout"
import ProtectedRoute from "./ProtectedRoute"

// Customer Pages
import HomePage from "../pages/customer/HomePage"
import FlightListPage from "../pages/customer/FlightListPage"
import SeatSelectionPage from "../pages/customer/SeatSelectionPage"
import PassengerInfoPage from "../pages/customer/PassengerInfoPage"
import PaymentPage from "../pages/customer/PaymentPage"
import BookingConfirmPage from "../pages/customer/BookingConfirmPage"
import BookingHistoryPage from "../pages/customer/BookingHistoryPage"

// Auth Pages
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import PartnerRegisterPage from "../pages/auth/PartnerRegisterPage"
import GoogleCallbackPage from "../pages/auth/GoogleCallbackPage"
import ProfilePage from "../pages/account/ProfilePage"

// Admin Pages
import DashboardPage from "../pages/admin/DashboardPage"
import FlightsPage from "../pages/admin/FlightsPage"
import AirportsPage from "../pages/admin/AirportsPage"
import RoutesPage from "../pages/admin/RoutesPage"
import AircraftsPage from "../pages/admin/AircraftsPage"
import BookingsPage from "../pages/admin/BookingsPage"
import UsersPage from "../pages/admin/UsersPage"
import AirlinesManagementPage from "../pages/admin/AirlinesManagementPage"

// Partner Pages
import PartnerDashboardPage from "../pages/partner/PartnerDashboardPage"
import PartnerFlightsPage from "../pages/partner/PartnerFlightsPage"
import PartnerAircraftsPage from "../pages/partner/PartnerAircraftsPage"
import PartnerFaresPage from "../pages/partner/PartnerFaresPage"
import PartnerBookingsPage from "../pages/partner/PartnerBookingsPage"
import PartnerRoutesPage from "../pages/partner/PartnerRoutesPage"
import PartnerPromotionsPage from "../pages/partner/PartnerPromotionsPage"
import PartnerReportsPage from "../pages/partner/PartnerReportsPage"
import PartnerSettingsPage from "../pages/partner/PartnerSettingsPage"
import PartnerTeamPage from "../pages/partner/PartnerTeamPage"

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="partner-register" element={<PartnerRegisterPage />} />
        <Route path="auth/google-callback" element={<GoogleCallbackPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="flights" element={<FlightListPage />} />
        <Route path="seats" element={<SeatSelectionPage />} />
        <Route path="passenger-info" element={<PassengerInfoPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="booking-confirm" element={<BookingConfirmPage />} />
        <Route path="history" element={<BookingHistoryPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Admin", "Employee"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="flights" element={<FlightsPage />} />
          <Route path="airports" element={<AirportsPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="aircrafts" element={<AircraftsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="airlines" element={<AirlinesManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["AirlineManager"]} />}>
        <Route path="/partner" element={<PartnerLayout />}>
          <Route index element={<PartnerDashboardPage />} />
          <Route path="flights" element={<PartnerFlightsPage />} />
          <Route path="aircrafts" element={<PartnerAircraftsPage />} />
          <Route path="routes" element={<PartnerRoutesPage />} />
          <Route path="fares" element={<PartnerFaresPage />} />
          <Route path="bookings" element={<PartnerBookingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="promotions" element={<PartnerPromotionsPage />} />
          <Route path="reports" element={<PartnerReportsPage />} />
          <Route path="settings" element={<PartnerSettingsPage />} />
          <Route path="team" element={<PartnerTeamPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
