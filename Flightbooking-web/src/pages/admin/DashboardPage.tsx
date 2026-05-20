import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  TrendingUp, Plane, Users, Ticket, Clock, CheckCircle2, XCircle,
  ArrowRight, Building2, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { adminBookingService, type AdminBooking } from "../../services/admin-booking.service"
import { flightService, type Flight } from "../../services/flight.service"
import { userService, type UserListItem } from "../../services/user.service"
import { airlineService, type Airline } from "../../services/airline.service"

const VND = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const BOOKING_STATUS_VI: Record<string, string> = {
  Pending: "Chờ thanh toán", Confirmed: "Đã xác nhận",
  Cancelled: "Đã hủy", Completed: "Hoàn thành",
}
const FLIGHT_STATUS_VI: Record<string, string> = {
  Scheduled: "Lịch trình", Delayed: "Hoãn", Boarding: "Lên máy bay",
  InAir: "Đang bay", Landed: "Đã hạ cánh", Cancelled: "Đã hủy",
}

function KpiCard({
  label, value, sub, icon: Icon, colorClass, bgClass, delay = 0
}: {
  label: string; value: string; sub: string
  icon: React.ElementType; colorClass: string; bgClass: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border p-5 flex items-center gap-4 ${bgClass}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} bg-white/60 dark:bg-black/20 flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold truncate mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </motion.div>
  )
}

// Inline bar chart
function MiniBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <motion.div
            className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors cursor-default"
            style={{ height: `${Math.max((d.value / max) * 100, 3)}px` }}
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            title={`${d.label}: ${VND(d.value)}`}
          />
          <span className="text-[9px] text-muted-foreground truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: bookings = [], isLoading: bLoading } = useQuery<AdminBooking[]>({
    queryKey: ["dash-bookings"], queryFn: adminBookingService.getAll,
  })
  const { data: flights = [], isLoading: fLoading } = useQuery<Flight[]>({
    queryKey: ["dash-flights"], queryFn: flightService.getAll,
  })
  const { data: users = [], isLoading: uLoading } = useQuery<UserListItem[]>({
    queryKey: ["dash-users"], queryFn: userService.getAll,
  })
  const { data: airlines = [], isLoading: aLoading } = useQuery<Airline[]>({
    queryKey: ["dash-airlines"], queryFn: airlineService.getAll,
  })

  const isLoading = bLoading || fLoading || uLoading || aLoading

  const stats = useMemo(() => {
    const today = new Date()

    // Revenue
    const totalRevenue = bookings
      .filter(b => b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed")
      .reduce((s, b) => s + b.totalAmount, 0)

    // This month bookings
    const thisMonth = bookings.filter(b => {
      const d = new Date(b.bookingDate)
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    })
    const lastMonth = bookings.filter(b => {
      const d = new Date(b.bookingDate)
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
    })

    // Pending airlines
    const pendingAirlines = airlines.filter(a => a.status === "Pending")
    const approvedAirlines = airlines.filter(a => a.status === "Approved").length

    // Booking status
    const pending = bookings.filter(b => b.bookingStatus === "Pending").length
    const confirmed = bookings.filter(b => b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed").length
    const cancelled = bookings.filter(b => b.bookingStatus === "Cancelled").length

    // Flight status
    const inAir = flights.filter(f => f.status === "InAir").length
    const scheduled = flights.filter(f => f.status === "Scheduled").length
    const delayed = flights.filter(f => f.status === "Delayed").length

    // Revenue last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return d
    })
    const revenueChart = days.map(day => {
      const label = day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
      const value = bookings
        .filter(b => {
          const bd = new Date(b.bookingDate)
          return bd.getDate() === day.getDate() && bd.getMonth() === day.getMonth() &&
            bd.getFullYear() === day.getFullYear() &&
            (b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed")
        })
        .reduce((s, b) => s + b.totalAmount, 0)
      return { label, value }
    })

    // Recent bookings (last 8)
    const recentBookings = [...bookings]
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
      .slice(0, 8)

    // Recent flights (upcoming)
    const upcomingFlights = [...flights]
      .filter(f => new Date(f.departureTime) > new Date() && f.status !== "Cancelled")
      .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
      .slice(0, 6)

    // Customers
    const customers = users.filter(u => u.role === "Customer").length
    const newCustomers = users.filter(u => {
      const d = new Date(u.createdAt)
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    }).length

    const monthPct = lastMonth.length > 0
      ? (((thisMonth.length - lastMonth.length) / lastMonth.length) * 100).toFixed(1)
      : "N/A"

    return {
      totalRevenue, totalBookings: bookings.length, customers, newCustomers,
      totalFlights: flights.length, inAir, scheduled, delayed,
      pendingAirlines, approvedAirlines,
      pending, confirmed, cancelled,
      revenueChart, recentBookings, upcomingFlights,
      thisMonthCount: thisMonth.length, monthPct,
    }
  }, [bookings, flights, users, airlines])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tổng quan</h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Pending Airlines Alert */}
      {stats.pendingAirlines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <span className="font-semibold">{stats.pendingAirlines.length} hãng hàng không</span> đang chờ phê duyệt:{" "}
            {stats.pendingAirlines.map(a => a.name).join(", ")}
          </p>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Tổng doanh thu" value={VND(stats.totalRevenue)}
          sub={`Từ ${stats.confirmed} đơn thành công`}
          icon={TrendingUp} colorClass="text-blue-600"
          bgClass="bg-blue-50/60 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900" delay={0}
        />
        <KpiCard
          label="Tổng chuyến bay" value={stats.totalFlights.toLocaleString("vi-VN")}
          sub={`${stats.inAir} đang bay · ${stats.delayed} hoãn`}
          icon={Plane} colorClass="text-purple-600"
          bgClass="bg-purple-50/60 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900" delay={0.07}
        />
        <KpiCard
          label="Khách hàng" value={stats.customers.toLocaleString("vi-VN")}
          sub={`+${stats.newCustomers} mới tháng này`}
          icon={Users} colorClass="text-green-600"
          bgClass="bg-green-50/60 border-green-100 dark:bg-green-950/20 dark:border-green-900" delay={0.14}
        />
        <KpiCard
          label="Tổng đặt vé" value={stats.totalBookings.toLocaleString("vi-VN")}
          sub={`${stats.pending} đang chờ xử lý`}
          icon={Ticket} colorClass="text-orange-500"
          bgClass="bg-orange-50/60 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900" delay={0.21}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" /> Doanh thu 7 ngày gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBar data={stats.revenueChart} />
            <div className="flex gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/70" />
                <span>Doanh thu (VNĐ)</span>
              </div>
              <span className="ml-auto font-semibold text-foreground text-sm">
                Tổng: {VND(stats.revenueChart.reduce((s, d) => s + d.value, 0))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Booking status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="w-4 h-4 text-muted-foreground" /> Trạng thái đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { label: "Chờ thanh toán", value: stats.pending, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
              { label: "Xác nhận/Hoàn thành", value: stats.confirmed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
              { label: "Đã hủy", value: stats.cancelled, icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${item.bg}`}>
                <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}

            <div className="pt-2 border-t mt-1 space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Chuyến bay hôm nay</p>
              <div className="flex gap-2 flex-wrap">
                <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 dark:bg-blue-900/40 dark:text-blue-300">
                  <Plane className="w-3 h-3" /> {stats.scheduled} lịch trình
                </Badge>
                <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-0 dark:bg-green-900/40 dark:text-green-300">
                  <Plane className="w-3 h-3" /> {stats.inAir} đang bay
                </Badge>
                {stats.delayed > 0 && (
                  <Badge className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0 dark:bg-yellow-900/40 dark:text-yellow-300">
                    <Clock className="w-3 h-3" /> {stats.delayed} hoãn
                  </Badge>
                )}
              </div>
            </div>

            <div className="pt-2 border-t space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Hãng bay</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-green-600" />
                  <span>Đang hoạt động</span>
                </div>
                <span className="font-bold">{stats.approvedAirlines}</span>
              </div>
              {stats.pendingAirlines.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Chờ duyệt</span>
                  </div>
                  <span className="font-bold text-yellow-600">{stats.pendingAirlines.length}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings + Upcoming flights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="w-4 h-4 text-muted-foreground" /> Đơn đặt vé gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn đặt vé</p>
            ) : (
              <div className="space-y-2">
                {stats.recentBookings.map((b, i) => {
                  const statusColor = {
                    Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
                    Confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                    Completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
                    Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                  }[b.bookingStatus] ?? "bg-gray-100 text-gray-700"

                  return (
                    <motion.div
                      key={b.bookingId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 py-2 border-b last:border-b-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.customerName}</p>
                        <p className="text-xs text-muted-foreground">{b.bookingCode} · {b.ticketCount} vé</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-primary">{VND(b.totalAmount)}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 ${statusColor}`}>
                          {BOOKING_STATUS_VI[b.bookingStatus] ?? b.bookingStatus}
                        </Badge>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="w-4 h-4 text-muted-foreground" /> Chuyến bay sắp khởi hành
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingFlights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Không có chuyến bay sắp tới</p>
            ) : (
              <div className="space-y-2">
                {stats.upcomingFlights.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-2 border-b last:border-b-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Plane className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="font-mono text-primary">{f.originCode}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-primary">{f.destinationCode}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.flightNumber} · {f.airlineName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium">
                        {new Date(f.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(f.departureTime).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
