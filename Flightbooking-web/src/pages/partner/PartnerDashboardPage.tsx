import { useMemo, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  Ticket,
  Plane,
  Users,
  ArrowRight,
  TrendingUp,
  Calendar,
  Armchair,
  AlertCircle,
  RefreshCw,
  Sun,
  Activity,
} from "lucide-react"
import { partnerDashboardService, type UpcomingFlight } from "../../services/partner-dashboard.service"
import { useAuthStore } from "../../stores/useAuthStore"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Helpers ────────────────────────────────────────────────────────────────

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n)

const formatDate = (date: Date) =>
  date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

const formatTime = (date: Date) =>
  date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

// ─── Status Config ───────────────────────────────────────────────────────────

const FLIGHT_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; dot: string }> = {
  Scheduled: { label: "Lịch trình",     variant: "secondary",    dot: "bg-blue-400" },
  Boarding:  { label: "Lên máy bay",    variant: "default",      dot: "bg-green-400" },
  InAir:     { label: "Đang bay",       variant: "default",      dot: "bg-indigo-400" },
  Landed:    { label: "Đã hạ cánh",     variant: "outline",      dot: "bg-gray-400" },
  Cancelled: { label: "Đã hủy",         variant: "destructive",  dot: "bg-red-400" },
  Delayed:   { label: "Hoãn",           variant: "outline",      dot: "bg-orange-400" },
}

// ─── Live Clock ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="text-right">
      <p className="text-xs text-muted-foreground capitalize">{formatDate(now)}</p>
      <p className="text-sm font-mono font-semibold text-foreground tabular-nums">{formatTime(now)}</p>
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  gradient: string
  iconBg: string
  delay: number
  loading?: boolean
}

function KpiCard({ label, value, sub, icon: Icon, gradient, iconBg, delay, loading }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <div className={`absolute inset-0 opacity-[0.06] ${gradient}`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            {loading ? (
              <>
                <Skeleton className="mt-2 h-8 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </>
            ) : (
              <>
                <p className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
              </>
            )}
          </div>
          <div className={`ml-3 flex-shrink-0 rounded-xl p-2.5 ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Revenue Bar Chart ───────────────────────────────────────────────────────

interface BarChartProps {
  data: { date: string; revenue: number; tickets: number }[]
}

function RevenueBarChart({ data }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  const shortDate = (raw: string) => {
    const d = new Date(raw)
    return isNaN(d.getTime())
      ? raw.slice(5) // fallback: "MM-DD"
      : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
  }

  return (
    <div className="relative flex h-48 items-end justify-between gap-1.5 pt-6">
      {data.map((d, i) => {
        const heightPct = d.revenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, 4) : 0
        const isActive = hovered === i

        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center gap-1"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="pointer-events-none absolute bottom-full mb-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"
                >
                  <p className="font-semibold text-foreground">{VND(d.revenue)}</p>
                  <p className="text-muted-foreground">{d.tickets} vé</p>
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r bg-popover" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bar */}
            <div className="flex w-full flex-1 items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                className={`w-full rounded-t-md transition-colors duration-200 ${
                  isActive
                    ? "bg-primary"
                    : "bg-primary/40 hover:bg-primary/60"
                }`}
                style={{ minHeight: d.revenue > 0 ? 4 : 0 }}
              />
            </div>

            {/* Label */}
            <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              {shortDate(d.date)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Load Bar ────────────────────────────────────────────────────────────────

function LoadBar({ booked, total }: { booked: number; total: number }) {
  const pct = total > 0 ? Math.round((booked / total) * 100) : 0
  const color =
    pct > 85 ? "bg-emerald-500" : pct > 60 ? "bg-blue-500" : "bg-amber-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 flex-shrink-0 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
        {booked}/{total}
      </span>
      <span className="text-xs text-muted-foreground">({pct}%)</span>
    </div>
  )
}

// ─── Upcoming Flights Table ───────────────────────────────────────────────────

function UpcomingFlightsTable({ flights }: { flights: UpcomingFlight[] }) {
  if (flights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Plane className="mb-3 h-10 w-10 opacity-20" />
        <p className="text-sm">Không có chuyến bay sắp khởi hành.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Chuyến</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Tuyến</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Khởi hành</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Máy bay</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Tải</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Trạng thái</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flights.map((f, i) => {
          const cfg = FLIGHT_STATUS[f.status] ?? FLIGHT_STATUS.Scheduled
          const dep = new Date(f.departureTime)
          const isToday = dep.toDateString() === new Date().toDateString()
          const timeStr = dep.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          const dateStr = isToday
            ? `Hôm nay · ${timeStr}`
            : dep.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) + ` · ${timeStr}`

          return (
            <motion.tr
              key={f.flightId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-border/40 transition-colors hover:bg-muted/40"
            >
              <TableCell className="font-bold text-primary">{f.flightNumber}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 font-medium">
                  <span>{f.originCode}</span>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  <span>{f.destinationCode}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{dateStr}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{f.aircraftModel}</TableCell>
              <TableCell>
                {f.totalSeats > 0 ? (
                  <LoadBar booked={f.bookedSeats} total={f.totalSeats} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={cfg.variant} className="gap-1.5">
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </Badge>
              </TableCell>
            </motion.tr>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-48 items-end gap-1.5 pt-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <Skeleton className="w-full" style={{ height: `${30 + Math.random() * 60}%` }} />
          <Skeleton className="h-2.5 w-6" />
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PartnerDashboardPage() {
  const { user } = useAuthStore()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["partner-dashboard", user?.airlineId],
    queryFn: partnerDashboardService.getDashboard,
    enabled: !!user?.airlineId,
    refetchInterval: 60_000,
  })

  const classBreakdown = useMemo(() => {
    if (!data) return []
    const total = data.economyTickets + data.businessTickets + data.firstClassTickets || 1
    return [
      {
        label: "Phổ thông",
        count: data.economyTickets,
        pct: Math.round((data.economyTickets / total) * 100),
        gradient: "from-sky-500 to-blue-600",
        bg: "bg-sky-500",
        textColor: "text-sky-600 dark:text-sky-400",
      },
      {
        label: "Thương gia",
        count: data.businessTickets,
        pct: Math.round((data.businessTickets / total) * 100),
        gradient: "from-violet-500 to-purple-600",
        bg: "bg-violet-500",
        textColor: "text-violet-600 dark:text-violet-400",
      },
      {
        label: "Hạng nhất",
        count: data.firstClassTickets,
        pct: Math.round((data.firstClassTickets / total) * 100),
        gradient: "from-amber-400 to-orange-500",
        bg: "bg-amber-500",
        textColor: "text-amber-600 dark:text-amber-400",
      },
    ]
  }, [data])

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!user?.airlineId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            Tài khoản chưa được liên kết với Hãng bay.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">
          Không thể tải dữ liệu dashboard. Vui lòng thử lại.
        </span>
      </div>
    )
  }

  // ── KPI definitions ─────────────────────────────────────────────────────────

  const kpis = [
    {
      label: "Tổng doanh thu",
      value: data ? VND(data.totalRevenue) : "—",
      sub: data ? `Hôm nay: ${VND(data.todayRevenue)}` : "Đang tải...",
      icon: CreditCard,
      gradient: "bg-gradient-to-br from-emerald-400 to-green-600",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
      delay: 0,
    },
    {
      label: "Tổng vé bán",
      value: data ? data.totalTickets.toLocaleString("vi-VN") : "—",
      sub: data ? `Hôm nay: +${data.todayTickets} vé mới` : "Đang tải...",
      icon: Ticket,
      gradient: "bg-gradient-to-br from-blue-400 to-indigo-600",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
      delay: 0.08,
    },
    {
      label: "Tổng chuyến bay",
      value: data ? data.totalFlights.toLocaleString("vi-VN") : "—",
      sub: data ? `Hôm nay: ${data.todayFlights} chuyến · ${data.totalAircrafts} tàu bay` : "Đang tải...",
      icon: Plane,
      gradient: "bg-gradient-to-br from-violet-400 to-purple-600",
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
      delay: 0.16,
    },
    {
      label: "Load Factor",
      value: data ? `${data.loadFactor.toFixed(1)}%` : "—",
      sub: data ? `Trung bình tỷ lệ lấp đầy ghế` : "Đang tải...",
      icon: Users,
      gradient: "bg-gradient-to-br from-orange-400 to-rose-500",
      iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
      delay: 0.24,
    },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-none">
                {user?.fullName ?? "Hãng bay"}
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">Bảng điều khiển đối tác</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isFetching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Đang cập nhật...
            </motion.div>
          )}
          <LiveClock />
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      {/* ── Today's Stats Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.45 }}
      >
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sun className="h-4 w-4 text-amber-500" />
              Hoạt động hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Doanh thu hôm nay",
                    value: data ? VND(data.todayRevenue) : "—",
                    icon: CreditCard,
                    color: "text-emerald-500",
                    bg: "bg-emerald-50 dark:bg-emerald-900/20",
                  },
                  {
                    label: "Vé bán hôm nay",
                    value: data ? `${data.todayTickets} vé` : "—",
                    icon: Ticket,
                    color: "text-blue-500",
                    bg: "bg-blue-50 dark:bg-blue-900/20",
                  },
                  {
                    label: "Chuyến bay hôm nay",
                    value: data ? `${data.todayFlights} chuyến` : "—",
                    icon: Activity,
                    color: "text-violet-500",
                    bg: "bg-violet-50 dark:bg-violet-900/20",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-xl p-3 ${item.bg}`}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${item.color}`} />
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-bold text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid gap-4 lg:grid-cols-7">

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.45 }}
          className="lg:col-span-4"
        >
          <Card className="h-full">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Doanh thu 7 ngày qua
                </CardTitle>
                {data && (
                  <span className="text-xs font-medium text-muted-foreground">
                    Tổng:{" "}
                    <span className="text-foreground font-semibold">
                      {VND(data.revenueChart.reduce((s, d) => s + d.revenue, 0))}
                    </span>
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ChartSkeleton />
              ) : data && data.revenueChart.length > 0 ? (
                <RevenueBarChart data={data.revenueChart} />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  Chưa có dữ liệu doanh thu.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Seat Class Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.45 }}
          className="lg:col-span-3"
        >
          <Card className="h-full">
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Armchair className="h-4 w-4 text-primary" />
                Phân bổ hạng vé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {classBreakdown.map((cls) => (
                    <div key={cls.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${cls.bg}`} />
                          <span className="text-sm font-semibold">{cls.label}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${cls.textColor}`}>{cls.pct}%</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">({cls.count} vé)</span>
                        </div>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cls.pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
                          className={`h-full rounded-full bg-gradient-to-r ${cls.gradient}`}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tổng vé phân loại</span>
                      <span className="font-semibold text-foreground">
                        {data
                          ? (data.economyTickets + data.businessTickets + data.firstClassTickets).toLocaleString("vi-VN")
                          : "—"}{" "}
                        vé
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Upcoming Flights Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-primary" />
                Chuyến bay sắp khởi hành
              </CardTitle>
              {data && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {data.upcomingFlights.length} chuyến
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {isLoading ? (
              <div className="px-6 py-4">
                <TableSkeleton />
              </div>
            ) : (
              <UpcomingFlightsTable flights={data?.upcomingFlights ?? []} />
            )}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}
