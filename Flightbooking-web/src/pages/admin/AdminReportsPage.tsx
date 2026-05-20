import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3, Download, Plane, Ticket, TrendingUp, Users, CheckCircle2, XCircle, Clock, ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { adminBookingService, type AdminBooking } from "../../services/admin-booking.service"
import { flightService, type Flight } from "../../services/flight.service"
import { userService, type UserListItem } from "../../services/user.service"
import { airlineService, type Airline } from "../../services/airline.service"

const VND = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v)

const FLIGHT_STATUS_VI: Record<string, string> = {
  Scheduled: "Lịch trình", Delayed: "Hoãn", Boarding: "Lên máy bay",
  InAir: "Đang bay", Landed: "Đã hạ cánh", Cancelled: "Đã hủy",
}
const BOOKING_STATUS_VI: Record<string, string> = {
  Pending: "Chờ thanh toán", Confirmed: "Đã xác nhận",
  Cancelled: "Đã hủy", Completed: "Hoàn thành",
}

function StatCard({
  label, value, sub, icon: Icon, colorClass, bgClass,
}: {
  label: string; value: string; sub?: string
  icon: React.ElementType; colorClass: string; bgClass: string
}) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} className={`rounded-xl border p-5 flex items-center gap-4 ${bgClass}`}>
      <Icon className={`w-9 h-9 flex-shrink-0 ${colorClass}`} />
      <div className="min-w-0">
        <p className="text-2xl font-bold truncate">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

// Simple bar chart using CSS
function BarChartSimple({ data }: { data: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-36 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
            {d.sub ?? d.value}
          </span>
          <motion.div
            className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors cursor-default"
            style={{ height: `${Math.max((d.value / max) * 112, 4)}px` }}
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            title={`${d.label}: ${d.sub ?? d.value}`}
          />
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminReportsPage() {
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<AdminBooking[]>({
    queryKey: ["admin-bookings-report"],
    queryFn: adminBookingService.getAll,
  })

  const { data: flights = [], isLoading: flightsLoading } = useQuery<Flight[]>({
    queryKey: ["admin-flights-report"],
    queryFn: flightService.getAll,
  })

  const { data: users = [], isLoading: usersLoading } = useQuery<UserListItem[]>({
    queryKey: ["admin-users-report"],
    queryFn: userService.getAll,
  })

  const { data: airlines = [], isLoading: airlinesLoading } = useQuery<Airline[]>({
    queryKey: ["admin-airlines-report"],
    queryFn: airlineService.getAll,
  })

  const isLoading = bookingsLoading || flightsLoading || usersLoading || airlinesLoading

  // ── Booking Stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue = bookings
      .filter(b => b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed")
      .reduce((s, b) => s + b.totalAmount, 0)

    const pending = bookings.filter(b => b.bookingStatus === "Pending").length
    const confirmed = bookings.filter(b => b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed").length
    const cancelled = bookings.filter(b => b.bookingStatus === "Cancelled").length

    // Last 7 days revenue chart
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return d
    })
    const revenueChart = days.map(day => {
      const dayStr = day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
      const rev = bookings
        .filter(b => {
          const bd = new Date(b.bookingDate)
          return bd.getDate() === day.getDate() &&
            bd.getMonth() === day.getMonth() &&
            bd.getFullYear() === day.getFullYear() &&
            (b.bookingStatus === "Confirmed" || b.bookingStatus === "Completed")
        })
        .reduce((s, b) => s + b.totalAmount, 0)
      return { label: dayStr, value: rev, sub: rev > 0 ? VND(rev) : "0" }
    })

    // Seat class distribution from tickets
    const allTickets = bookings.flatMap(b => b.tickets)
    const economy = allTickets.filter(t => t.seatClass === "Economy").length
    const business = allTickets.filter(t => t.seatClass === "Business").length
    const firstClass = allTickets.filter(t => t.seatClass === "FirstClass").length

    // Top routes from flights
    const routeMap: Record<string, { count: number; origin: string; dest: string }> = {}
    flights.forEach(f => {
      const key = `${f.originCode}-${f.destinationCode}`
      routeMap[key] = routeMap[key] ?? { count: 0, origin: f.originCode, dest: f.destinationCode }
      routeMap[key].count++
    })
    const topRoutes = Object.entries(routeMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)

    // Airline distribution from flights
    const airlineMap: Record<string, { name: string; flights: number; revenue: number }> = {}
    flights.forEach(f => {
      const key = f.airlineName
      airlineMap[key] = airlineMap[key] ?? { name: f.airlineName, flights: 0, revenue: 0 }
      airlineMap[key].flights++
    })
    // also aggregate booking revenue by airline
    bookings.forEach(b => {
      b.tickets.forEach(t => {
        const f = flights.find(fl => fl.flightNumber === t.flightNumber)
        if (f) {
          airlineMap[f.airlineName] = airlineMap[f.airlineName] ?? { name: f.airlineName, flights: 0, revenue: 0 }
          airlineMap[f.airlineName].revenue += t.seatPrice
        }
      })
    })
    const topAirlines = Object.values(airlineMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // Flight status breakdown
    const flightStatus = {
      Scheduled: flights.filter(f => f.status === "Scheduled").length,
      Delayed: flights.filter(f => f.status === "Delayed").length,
      InAir: flights.filter(f => f.status === "InAir").length,
      Landed: flights.filter(f => f.status === "Landed").length,
      Cancelled: flights.filter(f => f.status === "Cancelled").length,
    }

    // Users breakdown
    const totalUsers = users.filter(u => u.role === "Customer").length
    const totalManagers = users.filter(u => u.role === "AirlineManager").length

    // Airlines breakdown
    const approvedAirlines = airlines.filter(a => a.status === "Approved").length
    const pendingAirlines = airlines.filter(a => a.status === "Pending").length

    return {
      totalRevenue, pending, confirmed, cancelled,
      total: bookings.length,
      revenueChart, economy, business, firstClass,
      topRoutes, topAirlines, flightStatus,
      totalFlights: flights.length,
      totalUsers, totalManagers,
      approvedAirlines, pendingAirlines,
    }
  }, [bookings, flights, users, airlines])

  // CSV Export
  function exportCsv() {
    const rows = [
      ["Mã đặt vé", "Trạng thái", "Ngày đặt", "Khách hàng", "Email", "Số vé", "Tổng tiền"],
      ...bookings.map(b => [
        b.bookingCode,
        BOOKING_STATUS_VI[b.bookingStatus] ?? b.bookingStatus,
        new Date(b.bookingDate).toLocaleDateString("vi-VN"),
        b.customerName,
        b.customerEmail,
        b.ticketCount.toString(),
        b.totalAmount.toString(),
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `bao_cao_dat_ve_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Đang tải dữ liệu báo cáo...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Báo cáo & Thống kê</h2>
          <p className="text-muted-foreground mt-1 text-sm">Tổng quan toàn hệ thống – dữ liệu thực từ API</p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Xuất CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng doanh thu" value={VND(stats.totalRevenue)}
          sub={`Từ ${stats.confirmed} đơn thành công`}
          icon={TrendingUp} colorClass="text-blue-600"
          bgClass="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900"
        />
        <StatCard
          label="Tổng đặt vé" value={stats.total.toLocaleString("vi-VN")}
          sub={`${stats.pending} đang chờ xử lý`}
          icon={Ticket} colorClass="text-green-600"
          bgClass="bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900"
        />
        <StatCard
          label="Tổng chuyến bay" value={stats.totalFlights.toLocaleString("vi-VN")}
          sub={`${stats.flightStatus.Scheduled} lịch trình, ${stats.flightStatus.InAir} đang bay`}
          icon={Plane} colorClass="text-purple-600"
          bgClass="bg-purple-50/50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900"
        />
        <StatCard
          label="Khách hàng" value={stats.totalUsers.toLocaleString("vi-VN")}
          sub={`${stats.approvedAirlines} hãng hoạt động, ${stats.pendingAirlines} chờ duyệt`}
          icon={Users} colorClass="text-orange-500"
          bgClass="bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900"
        />
      </div>

      {/* Revenue Chart + Booking Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-muted-foreground" /> Doanh thu 7 ngày gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartSimple data={stats.revenueChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="w-5 h-5 text-muted-foreground" /> Trạng thái đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Chờ thanh toán", value: stats.pending, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
              { label: "Đã xác nhận / Hoàn thành", value: stats.confirmed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
              { label: "Đã hủy", value: stats.cancelled, icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="font-bold text-base">{item.value}</span>
              </div>
            ))}

            <div className="border-t pt-3 mt-1">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Hạng vé đã bán</p>
              {[
                { label: "Phổ thông", value: stats.economy, color: "bg-blue-400" },
                { label: "Thương gia", value: stats.business, color: "bg-purple-500" },
                { label: "Hạng nhất", value: stats.firstClass, color: "bg-amber-500" },
              ].map(item => {
                const total = stats.economy + stats.business + stats.firstClass
                const pct = total > 0 ? (item.value / total) * 100 : 0
                return (
                  <div key={item.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Routes + Top Airlines + Flight Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRight className="w-5 h-5 text-muted-foreground" /> Tuyến bay phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-2">
                {stats.topRoutes.map(([key, r], i) => (
                  <div key={key} className="flex items-center gap-3 py-1.5 border-b last:border-b-0">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <Badge variant="outline" className="font-mono text-xs px-2">{r.origin}</Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" className="font-mono text-xs px-2">{r.dest}</Badge>
                    <span className="ml-auto text-sm font-semibold">{r.count} CB</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="w-5 h-5 text-muted-foreground" /> Doanh thu theo hãng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topAirlines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {stats.topAirlines.map((a, i) => {
                  const maxRev = stats.topAirlines[0].revenue || 1
                  const pct = (a.revenue / maxRev) * 100
                  return (
                    <div key={a.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate flex-1 pr-2">
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>{a.name}
                        </span>
                        <span className="text-primary font-semibold">{VND(a.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-muted-foreground" /> Trạng thái chuyến bay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(Object.entries({
              Scheduled: { label: "Lịch trình", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
              Delayed: { label: "Hoãn", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
              InAir: { label: "Đang bay", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
              Landed: { label: "Đã hạ cánh", color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800/50" },
              Cancelled: { label: "Đã hủy", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
            }) as [keyof typeof stats.flightStatus, { label: string; color: string; bg: string }][]).map(([status, cfg]) => (
              <div key={status} className={`flex items-center justify-between rounded-lg px-3 py-2 ${cfg.bg}`}>
                <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="font-bold">{stats.flightStatus[status]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
