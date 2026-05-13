import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Search, ArrowRight, Calendar, ChevronDown, ChevronRight,
  Ticket, CheckCircle2, Clock, XCircle, Ban
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminBookingService, type AdminBooking } from "../../services/admin-booking.service"

const BOOKING_STATUS_CONFIG: Record<string, {
  label: string
  badgeVariant: "default" | "secondary" | "destructive" | "outline"
  icon: React.ElementType
  color: string
}> = {
  Pending:   { label: "Chờ TT",    badgeVariant: "outline",      icon: Clock,         color: "text-yellow-500" },
  Confirmed: { label: "Đã xác nhận", badgeVariant: "secondary",  icon: CheckCircle2,  color: "text-green-500" },
  Cancelled: { label: "Đã hủy",    badgeVariant: "destructive",  icon: XCircle,       color: "text-red-500"    },
  Completed: { label: "Hoàn thành", badgeVariant: "default",     icon: CheckCircle2,  color: "text-blue-500"   },
}

const CLASS_PILL: Record<string, string> = {
  Economy:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Business:  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  FirstClass:"bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
}

function StatusBadge({ status }: { status: string }) {
  const cfg = BOOKING_STATUS_CONFIG[status] ?? BOOKING_STATUS_CONFIG.Pending
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.badgeVariant} className="gap-1">
      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      {cfg.label}
    </Badge>
  )
}

function BookingDetailPanel({ booking, onStatusChange, isUpdating }: {
  booking: AdminBooking
  onStatusChange: (status: string) => void
  isUpdating: boolean
}) {
  const nextStatuses = ["Confirmed", "Cancelled", "Completed"].filter(s => s !== booking.bookingStatus)

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <td colSpan={7} className="p-0">
        <div className="bg-muted/30 border-t border-b px-6 py-4 space-y-4">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-sm font-semibold">Chi tiết Booking #{booking.bookingId}</span>
              <span className="ml-2 text-xs text-muted-foreground">— {booking.ticketCount} vé · {booking.bookingType}</span>
            </div>
            <div className="flex items-center gap-2">
              {nextStatuses.map(s => {
                const cfg = BOOKING_STATUS_CONFIG[s]
                return (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "Cancelled" ? "destructive" : "outline"}
                    className="h-8 gap-1.5"
                    disabled={isUpdating}
                    onClick={() => onStatusChange(s)}
                  >
                    <cfg.icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Tickets */}
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground text-xs">
                  <th className="px-3 py-2 text-left">Hành khách</th>
                  <th className="px-3 py-2 text-left">Hãng bay</th>
                  <th className="px-3 py-2 text-left">Chuyến bay</th>
                  <th className="px-3 py-2 text-left">Ghế</th>
                  <th className="px-3 py-2 text-right">Giá</th>
                  <th className="px-3 py-2 text-left">Khởi hành</th>
                  <th className="px-3 py-2 text-left">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {booking.tickets.map(t => (
                  <tr key={t.ticketId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{t.passengerName}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{t.airlineCode}</span>
                      <span className="ml-1.5 text-muted-foreground text-xs">{t.airlineName}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-primary">{t.flightNumber}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {t.originCode}<ArrowRight className="w-2.5 h-2.5" />{t.destinationCode}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold mr-1.5">{t.seatNumber}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${CLASS_PILL[t.seatClass] ?? ""}`}>{t.seatClass}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(t.seatPrice)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(t.departureTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {t.checkInStatus === "CheckedIn" || t.checkInStatus === "Boarded"
                        ? <span className="text-green-600 font-medium">✅ {t.checkInStatus}</span>
                        : <span className="text-muted-foreground">{t.checkInStatus}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </td>
    </motion.tr>
  )
}

export default function BookingsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: adminBookingService.getAll,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminBookingService.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] })
      alert(`Cập nhật thành công: Booking đã chuyển sang "${BOOKING_STATUS_CONFIG[status]?.label}".`)
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Không thể cập nhật.")
    }
  })

  const filtered = useMemo(() => bookings.filter(b => {
    const matchSearch =
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingId.toString().includes(search) ||
      b.tickets.some(t => t.flightNumber.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === "all" || b.bookingStatus === statusFilter
    return matchSearch && matchStatus
  }), [bookings, search, statusFilter])

  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.bookingStatus === "Pending").length,
    confirmed: bookings.filter(b => b.bookingStatus === "Confirmed").length,
    cancelled: bookings.filter(b => b.bookingStatus === "Cancelled").length,
    revenue: bookings.filter(b => b.bookingStatus !== "Cancelled")
      .reduce((s, b) => s + b.totalAmount, 0),
  }), [bookings])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Đặt vé</h2>
        <p className="text-muted-foreground text-sm mt-1">Toàn bộ booking từ tất cả hãng trong hệ thống.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Chờ thanh toán", value: stats.pending,   color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800", icon: Clock },
          { label: "Đã xác nhận",   value: stats.confirmed, color: "text-green-500",  bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",   icon: CheckCircle2 },
          { label: "Đã hủy",        value: stats.cancelled, color: "text-red-500",    bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",           icon: Ban },
          {
            label: "Doanh thu",
            value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.revenue),
            color: "text-primary",
            bg: "bg-primary/5 border-primary/20",
            icon: Ticket
          },
        ].map(card => (
          <motion.div key={card.label} whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 border flex items-center gap-3 ${card.bg}`}>
            <card.icon className={`w-8 h-8 flex-shrink-0 ${card.color}`} />
            <div className="min-w-0">
              <p className="text-xl font-bold truncate">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm tên khách, email, mã booking..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Pending">Chờ thanh toán</SelectItem>
            <SelectItem value="Confirmed">Đã xác nhận</SelectItem>
            <SelectItem value="Cancelled">Đã hủy</SelectItem>
            <SelectItem value="Completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="self-center px-3 py-1.5 text-sm">
          {filtered.length} / {bookings.length} booking
        </Badge>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Mã booking</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Số vé</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  Không tìm thấy booking nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(booking => (
                <>
                  <TableRow
                    key={booking.bookingId}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedId(expandedId === booking.bookingId ? null : booking.bookingId)}
                  >
                    <TableCell className="text-muted-foreground pl-4">
                      {expandedId === booking.bookingId
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                      }
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-primary">#{booking.bookingId}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-xs">
                          {booking.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{booking.customerName}</div>
                          <div className="text-xs text-muted-foreground">{booking.customerEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{booking.ticketCount}</span>
                      <span className="text-muted-foreground text-xs ml-1">vé</span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(booking.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={booking.bookingStatus} />
                    </TableCell>
                  </TableRow>

                  <AnimatePresence>
                    {expandedId === booking.bookingId && (
                      <BookingDetailPanel
                        key={`detail-${booking.bookingId}`}
                        booking={booking}
                        onStatusChange={(status) => statusMutation.mutate({ id: booking.bookingId, status })}
                        isUpdating={statusMutation.isPending}
                      />
                    )}
                  </AnimatePresence>
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
