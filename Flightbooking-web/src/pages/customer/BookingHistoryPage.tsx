import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plane, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Download, 
  CreditCard, 
  AlertCircle,
  CheckCircle2,
  History,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { bookingService, type BookingResponse } from "../../services/booking.service"

const AIRLINE_CONFIG: Record<string, { name: string; color: string }> = {
  VN: { name: "Vietnam Airlines", color: "#00559D" },
  VJ: { name: "VietJet Air", color: "#E31837" },
  BL: { name: "Bamboo Airways", color: "#00903A" },
  QH: { name: "Vietravel Airlines", color: "#F5A623" },
}

export default function BookingHistoryPage() {
  const [activeTab, setActiveTab] = useState("upcoming")

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: bookingService.getMyBookings
  })

  // Phân loại bookings
  const upcomingBookings = bookings.filter(b => 
    b.bookingStatus === "Pending" || b.bookingStatus === "Confirmed" || b.bookingStatus === "PartialPayment"
  )
  const pastBookings = bookings.filter(b => 
    b.bookingStatus === "Completed" || b.bookingStatus === "Cancelled" || b.bookingStatus === "Refunded"
  )

  const filteredHistory = activeTab === "upcoming" ? upcomingBookings : pastBookings

  const formatPrice = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n)
  
  const getStatusBadge = (status: string): React.ReactNode => {
    switch (status) {
      case "Confirmed": 
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã xác nhận</Badge>
      case "Pending": 
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0"><AlertCircle className="w-3 h-3 mr-1" /> Chờ thanh toán</Badge>
      case "PartialPayment": 
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0"><AlertCircle className="w-3 h-3 mr-1" /> Đã cọc (30%)</Badge>
      case "Completed": 
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"><History className="w-3 h-3 mr-1" /> Đã bay</Badge>
      case "Cancelled": 
        return <Badge variant="secondary" className="bg-red-50 text-red-600 border-0">Đã hủy</Badge>
      default: 
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="bg-[#f5f7fa] min-h-screen pb-12">
      {/* Header Section */}
      <div className="bg-white border-b pt-10 pb-6">
        <div className="container px-4 md:px-8 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Chuyến đi của tôi</h1>
              <p className="text-gray-500 mt-1">Quản lý và xem lại tất cả các hành trình của bạn</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full gap-2">
                <Download className="w-4 h-4" /> Xuất báo cáo
              </Button>
            </div>
          </div>

          <Tabs defaultValue="upcoming" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-full w-fit">
              <TabsTrigger value="upcoming" className="rounded-full px-8 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Sắp tới ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-full px-8 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Đã qua / Đã hủy ({pastBookings.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* List Content */}
      <div className="container px-4 md:px-8 max-w-5xl mx-auto mt-8">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-[#006CE4] animate-spin" />
              <p className="text-gray-500 font-medium">Đang tải lịch sử đặt vé...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center text-red-600">
               Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredHistory.length > 0 ? (
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {filteredHistory.map((booking) => (
                    <BookingCard key={booking.bookingId} booking={booking} formatPrice={formatPrice} getStatusBadge={getStatusBadge} />
                  ))}
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Không có chuyến đi nào</h3>
                  <p className="text-gray-500 mt-1 max-w-xs mx-auto">Bắt đầu lên kế hoạch cho hành trình tiếp theo của bạn ngay hôm nay!</p>
                  <Button className="mt-6 rounded-full px-8 bg-[#006CE4] hover:bg-[#0057B8]" onClick={() => window.location.href = "/"}>Tìm chuyến bay</Button>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}

function BookingCard({ booking, formatPrice, getStatusBadge }: { booking: BookingResponse, formatPrice: (n: number) => string, getStatusBadge: (s: string) => React.ReactNode }) {
  // Lấy thông tin chuyến bay từ vé đầu tiên
  const firstTicket = booking.tickets[0]
  if (!firstTicket) return null

  const airline = AIRLINE_CONFIG[firstTicket.airlineCode] || { name: "SkyBooking", color: "#6366F1" }
  const depTime = new Date(firstTicket.departureTime)
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
      <div className="flex flex-col lg:flex-row">
        {/* Main Info */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: airline.color }}
              >
                {firstTicket.airlineCode}
              </div>
              <div>
                <p className="font-bold text-gray-900">{airline.name}</p>
                <p className="text-xs text-gray-500">{firstTicket.flightNumber} • {firstTicket.seatClass}</p>
              </div>
            </div>
            {getStatusBadge(booking.bookingStatus)}
          </div>

          <div className="flex items-center gap-4 md:gap-12 relative py-4">
            {/* Departure */}
            <div className="text-center md:text-left">
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {depTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-sm font-bold text-[#006CE4] mt-2">{firstTicket.originCode}</p>
            </div>

            {/* Path */}
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <div className="w-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full border-2 border-gray-300" />
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                <Plane className="w-4 h-4 text-gray-300" />
                <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                <div className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1 font-medium uppercase tracking-wider">
                Bay thẳng
              </p>
            </div>

            {/* Arrival */}
            <div className="text-center md:text-right">
              {/* Giả định thời gian đến + 2h nếu DB không trả về trực tiếp trong summary */}
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {new Date(depTime.getTime() + 7200000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-sm font-bold text-[#006CE4] mt-2">{firstTicket.destinationCode}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-y-3 gap-x-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              {depTime.toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <span className="text-gray-400 font-normal">Mã đặt chỗ:</span> 
              <span className="bg-gray-100 px-2 py-0.5 rounded text-[#006CE4] font-mono">{booking.bookingId}</span>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="w-full lg:w-72 bg-gray-50 border-t lg:border-t-0 lg:border-l p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Ngày đặt</span>
              <span className="font-medium">{new Date(booking.bookingDate).toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Số hành khách</span>
              <span className="font-medium">{booking.ticketCount}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-end">
              <span className="text-sm text-gray-500">Tổng cộng</span>
              <span className="text-xl font-bold text-gray-900">{formatPrice(booking.totalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <Button variant="outline" className="w-full rounded-lg gap-2 text-sm">
              Chi tiết <ChevronRight className="w-4 h-4" />
            </Button>
            <Button className="w-full rounded-lg gap-2 text-sm bg-[#006CE4] hover:bg-[#0057B8]">
              <Download className="w-4 h-4" /> Vé điện tử
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
