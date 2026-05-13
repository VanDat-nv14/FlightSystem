import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  CreditCard, Ticket, Plane, Users, ArrowRight, TrendingUp,
  Calendar, Armchair, AlertCircle
} from "lucide-react"
import { partnerDashboardService, type UpcomingFlight } from "../../services/partner-dashboard.service"
import { useAuthStore } from "../../stores/useAuthStore"

const VND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

const FLIGHT_STATUS: Record<string, { label: string; color: string }> = {
  Scheduled:  { label: "Lên lịch",   color: "text-blue-500"   },
  Boarding:   { label: "Boarding",   color: "text-green-500"  },
  Departed:   { label: "Đã cất cánh", color: "text-purple-500" },
  Arrived:    { label: "Đã hạ cánh", color: "text-gray-500"   },
  Cancelled:  { label: "Đã hủy",     color: "text-red-500"    },
  Delayed:    { label: "Trễ",        color: "text-orange-500" },
}

function LoadBar({ booked, total }: { booked: number; total: number }) {
  const pct = total > 0 ? Math.round(booked / total * 100) : 0
  const color = pct > 85 ? "bg-green-500" : pct > 60 ? "bg-blue-500" : "bg-orange-400"
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-10 text-right">{pct}%</span>
    </div>
  )
}

function UpcomingFlightRow({ flight }: { flight: UpcomingFlight }) {
  const cfg = FLIGHT_STATUS[flight.status] ?? FLIGHT_STATUS.Scheduled
  const dep = new Date(flight.departureTime)
  const isToday = dep.toDateString() === new Date().toDateString()
  const timeStr = dep.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = isToday ? `Hôm nay ${timeStr}` : dep.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ` ${timeStr}`

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Plane className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <span className="text-primary">{flight.flightNumber}</span>
            <span className="text-muted-foreground font-normal flex items-center gap-1">
              <span>{flight.originCode}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{flight.destinationCode}</span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {flight.aircraftModel}
            {flight.totalSeats > 0 && (
              <LoadBar booked={flight.bookedSeats} total={flight.totalSeats} />
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-4">
        <div className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
          <Calendar className="w-3 h-3" />
          {dateStr}
        </div>
      </div>
    </div>
  )
}

// Simple SVG bar chart — no external chart library needed
function RevenueChart({ data }: { data: { date: string; revenue: number; tickets: number }[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="flex items-end justify-between gap-1 h-40 pt-4">
      {data.map((d, i) => {
        const h = Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 4 : 0)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10">
              {VND(d.revenue)} · {d.tickets} vé
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="w-full rounded-t-md bg-primary/70 hover:bg-primary transition-colors cursor-default"
              style={{ minHeight: d.revenue > 0 ? 4 : 0 }}
            />
            <span className="text-[10px] text-muted-foreground">{d.date}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function PartnerDashboardPage() {
  const { user } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-dashboard", user?.airlineId],
    queryFn: partnerDashboardService.getDashboard,
    enabled: !!user?.airlineId,
    refetchInterval: 60_000, // refresh every 1 min
  })

  const classBreakdown = useMemo(() => {
    if (!data) return []
    const total = data.economyTickets + data.businessTickets + data.firstClassTickets || 1
    return [
      { label: "Economy",    count: data.economyTickets,    pct: Math.round(data.economyTickets / total * 100),    color: "bg-blue-500" },
      { label: "Business",   count: data.businessTickets,   pct: Math.round(data.businessTickets / total * 100),   color: "bg-purple-500" },
      { label: "First Class",count: data.firstClassTickets, pct: Math.round(data.firstClassTickets / total * 100), color: "bg-amber-500" },
    ]
  }, [data])

  if (!user?.airlineId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Tài khoản chưa được liên kết với Hãng bay.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center gap-3 text-destructive">
        <AlertCircle className="w-5 h-5" />
        <span>Không thể tải dữ liệu dashboard. Vui lòng thử lại.</span>
      </div>
    )
  }

  const kpis = [
    {
      label: "Tổng doanh thu",
      value: data ? VND(data.totalRevenue) : "—",
      sub: data ? `Hôm nay: ${VND(data.todayRevenue)}` : "Đang tải...",
      icon: CreditCard,
      color: "text-green-500",
      bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
    },
    {
      label: "Tổng vé đã bán",
      value: data ? data.totalTickets.toLocaleString() : "—",
      sub: data ? `Hôm nay: ${data.todayTickets} vé mới` : "Đang tải...",
      icon: Ticket,
      color: "text-blue-500",
      bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
    },
    {
      label: "Tổng chuyến bay",
      value: data ? data.totalFlights.toLocaleString() : "—",
      sub: data ? `Hôm nay: ${data.todayFlights} chuyến` : "Đang tải...",
      icon: Plane,
      color: "text-purple-500",
      bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
    },
    {
      label: "Load Factor",
      value: data ? `${data.loadFactor}%` : "—",
      sub: data ? `${data.totalAircrafts} tàu bay trong đội` : "Đang tải...",
      icon: Users,
      color: "text-orange-500",
      bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tổng quan hãng bay</h2>
          <p className="text-muted-foreground text-sm mt-1">Dữ liệu cập nhật theo thời gian thực.</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            Đang tải...
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 border ${kpi.bg}`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1 truncate">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
              <kpi.icon className={`w-8 h-8 flex-shrink-0 ml-2 ${kpi.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-card rounded-xl border shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Doanh thu 7 ngày qua
            </h3>
            {data && (
              <span className="text-xs text-muted-foreground">
                Tổng: {VND(data.revenueChart.reduce((s, d) => s + d.revenue, 0))}
              </span>
            )}
          </div>
          {data ? (
            <RevenueChart data={data.revenueChart} />
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              <div className="animate-pulse">Đang tải biểu đồ...</div>
            </div>
          )}
        </motion.div>

        {/* Seat Class Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-card rounded-xl border shadow-sm p-5"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Armchair className="w-4 h-4 text-primary" /> Phân bổ hạng vé
          </h3>
          {data ? (
            <div className="space-y-4">
              {classBreakdown.map(cls => (
                <div key={cls.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{cls.label}</span>
                    <span className="text-muted-foreground">{cls.count} vé ({cls.pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cls.pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${cls.color}`}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t text-sm text-muted-foreground">
                Tổng: {data.economyTickets + data.businessTickets + data.firstClassTickets} vé
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-pulse">
              {["Economy", "Business", "First Class"].map(c => (
                <div key={c}>
                  <div className="h-4 bg-muted rounded mb-2 w-2/3" />
                  <div className="h-2.5 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Upcoming Flights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl border shadow-sm p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Chuyến bay sắp khởi hành
          </h3>
          <span className="text-xs text-muted-foreground">5 chuyến tiếp theo</span>
        </div>
        {data ? (
          data.upcomingFlights.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Không có chuyến bay sắp khởi hành.</p>
          ) : (
            <div>
              {data.upcomingFlights.map(f => (
                <UpcomingFlightRow key={f.flightId} flight={f} />
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
