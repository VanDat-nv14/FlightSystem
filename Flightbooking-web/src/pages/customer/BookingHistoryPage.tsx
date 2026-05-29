import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plane, 
  Calendar, 
  ChevronRight, 
  Download, 
  AlertCircle,
  CheckCircle2,
  History,
  Loader2,
  Briefcase,
  Printer,
  User,
  Armchair,
  Info,
  Clock,
  FileCheck2,
  Wallet
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { bookingService, type BookingResponse } from "../../services/booking.service"
import { cancellationService, type CancellationPreview } from "../../services/cancellation.service"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

const AIRLINE_CONFIG: Record<string, { name: string; color: string }> = {
  VN: { name: "Vietnam Airlines", color: "#00559D" },
  VJ: { name: "VietJet Air", color: "#E31837" },
  BL: { name: "Bamboo Airways", color: "#00903A" },
  QH: { name: "Vietravel Airlines", color: "#F5A623" },
}

const BAGGAGE_STEPS = [
  { label: "Đăng ký", desc: "Đã tạo nhãn" },
  { label: "Ký gửi", desc: "Đã nhận tại quầy" },
  { label: "Lên máy bay", desc: "Đã bốc xếp" },
  { label: "Đến đích", desc: "Đã hạ cánh" },
  { label: "Đã nhận", desc: "Đã trả hành lý" }
]

const getBaggageStatusStep = (status: string) => {
  switch (status) {
    case "Registered": return 0;
    case "CheckedIn": return 1;
    case "Loaded": return 2;
    case "Arrived": return 3;
    case "Claimed": return 4;
    default: return 0;
  }
}

export default function BookingHistoryPage() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null)

  const queryClient = useQueryClient()
  const [cancelingBookingId, setCancelingBookingId] = useState<number | null>(null)
  const [cancelPreview, setCancelPreview] = useState<CancellationPreview | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null)

  const handleOpenCancelPreview = async (bookingId: number) => {
    setCancelingBookingId(bookingId)
    setIsPreviewLoading(true)
    setCancelError(null)
    setCancelSuccessMsg(null)
    setCancelPreview(null)
    setCancelReason("")
    try {
      const preview = await cancellationService.getCancelPreview(bookingId)
      setCancelPreview(preview)
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || err?.message || "Không thể tải thông tin xem trước hủy vé.")
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelingBookingId) return
    setIsCancelSubmitting(true)
    setCancelError(null)
    try {
      const result = await cancellationService.cancelBooking(cancelingBookingId, cancelReason)
      if (result.success) {
        setCancelSuccessMsg(result.message)
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] })
        setTimeout(() => {
          setCancelingBookingId(null)
          setCancelPreview(null)
        }, 3000)
      } else {
        setCancelError(result.message)
      }
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || err?.message || "Hủy vé thất bại. Vui lòng thử lại.")
    } finally {
      setIsCancelSubmitting(false)
    }
  }

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
      case "Refunded": 
        return <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-0">Đã hoàn tiền</Badge>
      default: 
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-[#f5f7fa] min-h-screen pb-12 print:bg-white">
      {/* Printable Area - Hidden on screen, shown during print */}
      {selectedBooking && (
        <div className="hidden print:block p-8 bg-white text-black font-sans min-h-screen w-full">
          <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">VÉ ĐIỆN TỬ & XÁC NHẬN HÀNH TRÌNH</h1>
              <p className="text-gray-500 text-sm mt-1">Hệ thống đặt vé máy bay SkyBooking</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Mã đặt chỗ (PNR)</p>
              <p className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                {selectedBooking.bookingCode || selectedBooking.bookingId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6">
            <div>
              <h2 className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-2">Hãng bay & Chuyến bay</h2>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-lg text-gray-800">
                  {AIRLINE_CONFIG[selectedBooking.tickets[0]?.airlineCode]?.name || "SkyBooking"}
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded font-mono font-bold">
                  {selectedBooking.tickets[0]?.flightNumber}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Khởi hành: {new Date(selectedBooking.tickets[0]?.departureTime).toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-2">Hành trình</h2>
              <p className="text-2xl font-black text-gray-900">
                {selectedBooking.tickets[0]?.originCode} → {selectedBooking.tickets[0]?.destinationCode}
              </p>
              <p className="text-sm text-gray-500 mt-1">Giờ cất cánh: {new Date(selectedBooking.tickets[0]?.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm uppercase font-bold tracking-wider text-gray-500 mb-4 border-b pb-1">Hành khách & Vé ghế</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-sm font-bold text-gray-500">
                  <th className="py-2">Tên hành khách</th>
                  <th className="py-2">Hạng ghế</th>
                  <th className="py-2">Số ghế</th>
                  <th className="py-2">Mã vé</th>
                </tr>
              </thead>
              <tbody>
                {selectedBooking.tickets.map(ticket => (
                  <tr key={ticket.ticketId} className="border-b text-sm text-gray-800">
                    <td className="py-3 font-bold uppercase">{ticket.passengerName}</td>
                    <td className="py-3">{{ Economy: 'Phổ thông', Business: 'Thương gia', FirstClass: 'Hạng nhất' }[ticket.seatClass] || ticket.seatClass}</td>
                    <td className="py-3 font-mono font-bold text-blue-600">{ticket.seatNumber}</td>
                    <td className="py-3 font-mono text-gray-500">{ticket.ticketId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedBooking.tickets.some(t => t.baggageTags?.length > 0) && (
            <div className="mb-6">
              <h2 className="text-sm uppercase font-bold tracking-wider text-gray-500 mb-4 border-b pb-1">Chi tiết hành lý ký gửi</h2>
              <div className="grid grid-cols-2 gap-4">
                {selectedBooking.tickets.flatMap(ticket => (ticket.baggageTags ?? []).map(tag => (
                  <div key={tag.id} className="border p-4 rounded-xl flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold">{tag.tagCode}</p>
                      <p className="text-xs text-gray-500 mt-1">Khách hàng: {ticket.passengerName}</p>
                      <p className="text-xs text-gray-500">Khối lượng: {tag.weight}kg</p>
                    </div>
                    <QRCodeSVG value={tag.tagCode} size={48} />
                  </div>
                )))}
              </div>
            </div>
          )}

          <div className="border-t-2 border-gray-200 pt-6 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Trạng thái thanh toán</p>
              <p className="text-sm font-medium text-gray-700">
                {selectedBooking.bookingStatus === "Confirmed" || selectedBooking.bookingStatus === "Completed" ? "Đã thanh toán" : "Chờ xử lý / Trả sau"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase">Tổng số tiền</p>
              <p className="text-3xl font-black text-blue-600">{formatPrice(selectedBooking.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-12 text-center text-xs text-gray-400 border-t pt-4">
            <p>Cảm ơn bạn đã lựa chọn SkyBooking. Vui lòng có mặt tại sân bay ít nhất 2 tiếng trước giờ khởi hành để làm thủ tục.</p>
          </div>
        </div>
      )}

      {/* Screen Layout - Hidden during print */}
      <div className="print:hidden">
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
                      <BookingCard 
                        key={booking.bookingId} 
                        booking={booking} 
                        formatPrice={formatPrice} 
                        getStatusBadge={getStatusBadge} 
                        onShowDetails={() => setSelectedBooking(booking)}
                        onCancelBooking={handleOpenCancelPreview}
                      />
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

      {/* Modern, Premium Ticket Details Modal Dialog */}
      <Dialog open={selectedBooking !== null} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-slate-100 shadow-2xl">
          {selectedBooking && (
            <div className="flex flex-col">
              {/* Header Box */}
              <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-1 rounded">
                    Thông Tin Vé Chi Tiết
                  </span>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 mt-1">
                    Mã đặt chỗ: <span className="font-mono text-blue-400 text-2xl tracking-wide">{selectedBooking.bookingCode || selectedBooking.bookingId}</span>
                  </DialogTitle>
                  <p className="text-xs text-slate-400">
                    Ngày đặt vé: {new Date(selectedBooking.bookingDate).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBooking.bookingStatus)}
                  <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white rounded-full p-2 h-9 w-9" onClick={handlePrint}>
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Main Contents */}
              <div className="p-6 space-y-6">
                
                {/* Route Map Header */}
                {selectedBooking.tickets[0] && (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs"
                          style={{ backgroundColor: AIRLINE_CONFIG[selectedBooking.tickets[0].airlineCode]?.color || "#006CE4" }}
                        >
                          {selectedBooking.tickets[0].airlineCode}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{AIRLINE_CONFIG[selectedBooking.tickets[0].airlineCode]?.name || "SkyBooking"}</p>
                          <p className="text-xs text-slate-500 font-medium">{selectedBooking.tickets[0].flightNumber} • Bay thẳng</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 flex items-center gap-1 font-semibold text-xs py-1 px-2.5">
                        <FileCheck2 className="w-3.5 h-3.5" /> Vé điện tử hợp lệ
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between py-2 relative">
                      {/* Origin */}
                      <div className="space-y-1 z-10">
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{selectedBooking.tickets[0].originCode}</p>
                        <p className="text-xs text-slate-500 font-medium">Khởi hành</p>
                        <p className="text-sm font-bold text-slate-800">
                          {new Date(selectedBooking.tickets[0].departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(selectedBooking.tickets[0].departureTime).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Travel Line */}
                      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
                        <div className="w-full flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 bg-white" />
                          <div className="flex-1 border-t-2 border-dashed border-slate-200" />
                          <Plane className="w-5 h-5 text-blue-600 rotate-90 my-1 animate-pulse" />
                          <div className="flex-1 border-t-2 border-dashed border-slate-200" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                          <Clock className="w-3 h-3 text-slate-400" />
                          2h 00m
                        </div>
                      </div>

                      {/* Destination */}
                      <div className="text-right space-y-1 z-10">
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{selectedBooking.tickets[0].destinationCode}</p>
                        <p className="text-xs text-slate-500 font-medium">Điểm đến</p>
                        <p className="text-sm font-bold text-slate-800">
                          {new Date(new Date(selectedBooking.tickets[0].departureTime).getTime() + 7200000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(new Date(selectedBooking.tickets[0].departureTime).getTime() + 7200000).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passenger & Ticket List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b pb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Danh sách hành khách & Vé</span>
                  </div>

                  <div className="grid gap-4">
                    {selectedBooking.tickets.map((ticket, index) => (
                      <div key={ticket.ticketId} className="border border-slate-100 shadow-sm rounded-xl overflow-hidden bg-white">
                        <div className="bg-slate-50/70 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-bold text-slate-800 uppercase tracking-wide text-sm">
                              {ticket.passengerName}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-white text-[11px] font-semibold text-slate-600 shadow-sm">
                            Mã vé: #{ticket.ticketId}
                          </Badge>
                        </div>

                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs">Hạng ghế</p>
                            <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                              <Armchair className="w-3.5 h-3.5 text-blue-500" />
                              {{ Economy: 'Phổ thông', Business: 'Thương gia', FirstClass: 'Hạng nhất' }[ticket.seatClass] || ticket.seatClass}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Số ghế</p>
                            <p className="font-mono font-bold text-blue-600 mt-0.5 text-base bg-blue-50/50 px-2 py-0.5 rounded w-fit">
                              {ticket.seatNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Thủ tục bay</p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold mt-1 ${
                              ticket.checkInStatus === "CheckedIn" || ticket.checkInStatus === "Boarded"
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              {{ NotCheckedIn: 'Chưa check-in', CheckedIn: 'Đã check-in', Boarded: 'Đã lên máy bay' }[ticket.checkInStatus] || ticket.checkInStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Giá vé</p>
                            <p className="font-bold text-slate-800 mt-0.5">
                              {formatPrice(ticket.seatPrice)}
                            </p>
                          </div>
                        </div>

                        {/* Baggage Section for this ticket */}
                        {ticket.baggageTags && ticket.baggageTags.length > 0 && (
                          <div className="border-t border-slate-50 p-4 bg-slate-50/20">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                              Theo dõi hành lý ký gửi
                            </p>

                            <div className="space-y-4">
                              {ticket.baggageTags.map(tag => {
                                const currentStep = getBaggageStatusStep(tag.status)
                                return (
                                  <div key={tag.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                          <Briefcase className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <p className="font-mono text-sm font-bold text-slate-800 tracking-tight">{tag.tagCode}</p>
                                          <p className="text-xs text-slate-400">Khối lượng hành lý: <span className="font-bold text-slate-700">{tag.weight} kg</span></p>
                                        </div>
                                      </div>
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 text-xs py-0.5 px-2">
                                        {{
                                          Registered: "Đã đăng ký nhãn",
                                          CheckedIn: "Đã nhận ký gửi",
                                          Loaded: "Đã bốc xếp lên khoang",
                                          Arrived: "Hành lý đã đến đích",
                                          Claimed: "Khách đã nhận hành lý",
                                        }[tag.status] || tag.status}
                                      </Badge>
                                    </div>

                                    {/* Timeline Step UI */}
                                    <div className="relative mt-2 mb-1 flex items-center justify-between">
                                      <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-100 z-0" />
                                      <div 
                                        className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-blue-500 transition-all duration-500 z-0" 
                                        style={{ width: `${(currentStep / 4) * 100}%` }}
                                      />
                                      {BAGGAGE_STEPS.map((step, idx) => {
                                        const isCompleted = idx <= currentStep
                                        const isCurrent = idx === currentStep
                                        return (
                                          <div key={step.label} className="relative z-10 flex flex-col items-center">
                                            <div 
                                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                                                isCompleted 
                                                  ? 'bg-blue-600 text-white ring-4 ring-blue-50' 
                                                  : 'bg-white text-slate-400 border-2 border-slate-200'
                                              }`}
                                            >
                                              {isCompleted && !isCurrent ? "✓" : idx + 1}
                                            </div>
                                            <p className={`text-[10px] font-semibold mt-1.5 ${isCompleted ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                                              {step.label}
                                            </p>
                                            <p className="text-[8px] text-slate-400 hidden sm:block mt-0.5 font-medium">{step.desc}</p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt Details & Payment status */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-slate-800 font-bold text-sm flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-blue-500" />
                      Thông tin thanh toán
                    </p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Hình thức đặt:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedBooking.bookingType === "OneWay" ? "Vé một chiều" : "Vé khứ hồi / Khác"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phương thức thanh toán:</span>
                        <span className="font-semibold text-slate-800">Thẻ tín dụng / Thẻ Visa</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:text-right flex flex-col justify-end md:items-end">
                    <p className="text-xs text-slate-400 font-semibold uppercase">TỔNG TIỀN PHẢI TRẢ</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatPrice(selectedBooking.totalAmount)}
                    </p>
                    <p className="text-[10px] text-slate-400">Đã bao gồm thuế giá trị gia tăng & phí sân bay</p>
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-100 flex justify-between items-center gap-3 print:hidden">
                <div>
                  {(selectedBooking.bookingStatus === "Pending" || selectedBooking.bookingStatus === "Confirmed" || selectedBooking.bookingStatus === "PartialPayment") && (
                    <Button 
                      variant="ghost" 
                      className="rounded-xl px-5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 font-bold"
                      onClick={() => {
                        setSelectedBooking(null);
                        handleOpenCancelPreview(selectedBooking.bookingId);
                      }}
                    >
                      Hủy đặt chỗ
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-xl px-5 text-slate-600 border-slate-200" onClick={() => setSelectedBooking(null)}>
                    Đóng lại
                  </Button>
                  <Button className="rounded-xl px-5 bg-blue-600 hover:bg-blue-700 gap-2" onClick={handlePrint}>
                    <Printer className="w-4.5 h-4.5" /> In vé điện tử
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancellation Modal Dialog */}
      <Dialog open={cancelingBookingId !== null} onOpenChange={(open) => !open && !isCancelSubmitting && setCancelingBookingId(null)}>
        <DialogContent className="max-w-md p-0 rounded-2xl bg-white border border-slate-100 shadow-2xl">
          <div className="flex flex-col">
            {/* Header */}
            <div className="bg-red-50 text-red-900 p-6 rounded-t-2xl flex items-center gap-3 border-b border-red-100">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <DialogTitle className="text-lg font-bold text-red-900">
                Yêu cầu hủy đặt vé
              </DialogTitle>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {isPreviewLoading && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                  <p className="text-sm text-slate-500 font-medium">Đang tính toán chính sách hoàn tiền...</p>
                </div>
              )}

              {cancelError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-4 rounded-xl flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              {cancelSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <p className="font-bold">Yêu cầu hoàn tất!</p>
                  <span>{cancelSuccessMsg}</span>
                </div>
              )}

              {!isPreviewLoading && cancelPreview && !cancelSuccessMsg && (
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 text-sm space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã đặt chỗ:</span>
                      <span className="font-mono font-bold text-slate-800">{cancelPreview.bookingCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số tiền đã thanh toán:</span>
                      <span className="font-bold text-slate-800">{formatPrice(cancelPreview.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phí hủy vé:</span>
                      <span className="font-bold text-red-600">{formatPrice(cancelPreview.cancellationFee)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-bold text-slate-800">Số tiền hoàn trả dự kiến:</span>
                      <span className="font-black text-emerald-600">{formatPrice(cancelPreview.refundAmount)}</span>
                    </div>
                  </div>

                  {/* Policy Info */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-2.5 items-start text-xs text-blue-800">
                    <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-bold mb-0.5">Chính sách áp dụng</p>
                      <p>{cancelPreview.policyDescription}</p>
                    </div>
                  </div>

                  {!cancelPreview.canCancel ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start text-xs text-amber-800 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>{cancelPreview.cannotCancelReason || "Không thể hủy vé này."}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="reason" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Lý do hủy vé (Không bắt buộc)
                        </label>
                        <textarea
                          id="reason"
                          rows={2}
                          className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50/50"
                          placeholder="Vui lòng cho biết lý do hủy vé để chúng tôi cải thiện dịch vụ..."
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        * Bằng cách bấm "Xác nhận hủy", tất cả các vé của bạn trong hành trình này sẽ bị hủy vĩnh viễn và không thể khôi phục.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => setCancelingBookingId(null)}
                disabled={isCancelSubmitting}
              >
                Hủy bỏ
              </Button>
              {cancelPreview?.canCancel && !cancelSuccessMsg && (
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 font-bold px-6"
                  onClick={handleConfirmCancel}
                  disabled={isCancelSubmitting}
                >
                  {isCancelSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận hủy"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BookingCard({ 
  booking, 
  formatPrice, 
  getStatusBadge,
  onShowDetails,
  onCancelBooking
}: { 
  booking: BookingResponse, 
  formatPrice: (n: number) => string, 
  getStatusBadge: (s: string) => React.ReactNode,
  onShowDetails: () => void,
  onCancelBooking: (bookingId: number) => void
}) {
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
                <p className="text-xs text-gray-500">{firstTicket.flightNumber} • {{ Economy: 'Phổ thông', Business: 'Thương gia', FirstClass: 'Hạng nhất' }[firstTicket.seatClass] || firstTicket.seatClass}</p>
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
              <span className="bg-gray-100 px-2 py-0.5 rounded text-[#006CE4] font-mono">{booking.bookingCode || booking.bookingId}</span>
            </div>
          </div>

          {booking.tickets.some(t => t.baggageTags?.length > 0) && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold text-blue-800">
                <Briefcase className="h-4 w-4" />
                Hành lý ký gửi
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {booking.tickets.flatMap(ticket => (ticket.baggageTags ?? []).map(tag => (
                  <div key={tag.id} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                    <QRCodeSVG value={tag.tagCode} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-bold text-[#006CE4]">{tag.tagCode}</div>
                      <div className="text-xs text-gray-500">{ticket.passengerName} · {tag.weight}kg</div>
                      <Badge variant="outline" className="mt-1 text-[11px]">
                        {{ Pending: 'Đang chờ', Checked: 'Đã check-in', Loaded: 'Lên tàu bay', Delivered: 'Đã giao' }[tag.status] || tag.status}
                      </Badge>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          )}
        </div>

        {/* Action Sidebar */}
        <div className="w-full lg:w-72 bg-gray-50 border-t lg:border-t-0 lg:border-l p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-3 text-center">
              <QRCodeSVG value={booking.bookingCode || String(booking.bookingId)} size={92} className="mx-auto" />
              <div className="mt-2 text-xs text-gray-500">QR check-in</div>
              <div className="font-mono text-sm font-bold text-[#006CE4]">{booking.bookingCode || booking.bookingId}</div>
            </div>
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

          <div className="space-y-2">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <Button variant="outline" className="w-full rounded-lg gap-2 text-sm" onClick={onShowDetails}>
                Chi tiết <ChevronRight className="w-4 h-4" />
              </Button>
              <Button className="w-full rounded-lg gap-2 text-sm bg-[#006CE4] hover:bg-[#0057B8]" onClick={onShowDetails}>
                <Download className="w-4 h-4" /> Vé điện tử
              </Button>
            </div>
            {(booking.bookingStatus === "Pending" || booking.bookingStatus === "Confirmed" || booking.bookingStatus === "PartialPayment") && (
              <Button 
                variant="ghost" 
                className="w-full rounded-lg gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-dashed border-transparent hover:border-red-100 font-semibold"
                onClick={() => onCancelBooking(booking.bookingId)}
              >
                Hủy đặt chỗ
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
