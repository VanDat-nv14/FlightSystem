import { Routes, Route } from "react-router-dom"
import CustomerLayout from "../layouts/CustomerLayout"
import AdminLayout from "../layouts/AdminLayout"
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

// Admin Pages
import DashboardPage from "../pages/admin/DashboardPage"
import FlightsPage from "../pages/admin/FlightsPage"
import AirportsPage from "../pages/admin/AirportsPage"
import RoutesPage from "../pages/admin/RoutesPage"
import AircraftsPage from "../pages/admin/AircraftsPage"
import BookingsPage from "../pages/admin/BookingsPage"
import UsersPage from "../pages/admin/UsersPage"

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="flights" element={<FlightListPage />} />
        <Route path="seats" element={<SeatSelectionPage />} />
        <Route path="passenger-info" element={<PassengerInfoPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="booking-confirm" element={<BookingConfirmPage />} />
        <Route path="history" element={<BookingHistoryPage />} />
        {/* Add more customer routes here later */}
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
          {/* Add more admin routes here later */}
        </Route>
      </Route>
    </Routes>
  )
}
