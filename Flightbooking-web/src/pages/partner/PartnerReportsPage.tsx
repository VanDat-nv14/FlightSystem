import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3, Download, Plane, Ticket, TrendingUp, Users,
  Calendar, ArrowRight, Clock, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { partnerDashboardService } from "../../services/partner-dashboard.service";
import { useAuthStore } from "../../stores/useAuthStore";

const VND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const SEAT_CLASS_VI: Record<string, string> = {
  Economy: "Phổ thông", Business: "Thương gia", FirstClass: "Hạng nhất",
};

// ── Revenue Bar Chart ────────────────────────────────────────────────────────
function RevenueBarChart({ data }: { data: { date: string; revenue: number; tickets: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-44 w-full pt-2">
      {data.map((d, i) => {
        const hPct = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 1);
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0 group relative">
            {/* Hover tooltip */}
            <div className="absolute bottom-[calc(100%-2px)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap pointer-events-none z-20 shadow-lg">
              <p className="font-semibold">{VND(d.revenue)}</p>
              <p className="text-[10px] opacity-80">{d.tickets} vé · {d.date}</p>
            </div>
            <motion.div
              initial={{ scaleY: 0, originY: 1 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: "easeOut" }}
              className={`w-full rounded-t-md cursor-default transition-colors ${
                d.revenue > 0 ? "bg-primary/75 hover:bg-primary" : "bg-muted"
              }`}
              style={{ height: `${hPct}%` }}
            />
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Load Factor Bar ──────────────────────────────────────────────────────────
function LoadBar({ booked, total }: { booked: number; total: number }) {
  const pct = total > 0 ? Math.round((booked / total) * 100) : 0;
  const color = pct > 85 ? "bg-green-500" : pct > 60 ? "bg-blue-500" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-9 text-right">{pct}%</span>
    </div>
  );
}

const FLIGHT_STATUS_CONF: Record<string, { label: string; cls: string }> = {
  Scheduled: { label: "Lịch trình", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  Delayed:   { label: "Hoãn",       cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  Boarding:  { label: "Lên máy bay",cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  InAir:     { label: "Đang bay",   cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  Landed:    { label: "Đã hạ cánh", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  Cancelled: { label: "Đã hủy",     cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

export default function PartnerReportsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-reports", user?.airlineId],
    queryFn: partnerDashboardService.getDashboard,
    enabled: !!user?.airlineId,
    refetchInterval: 60_000,
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const totalRev7 = data.revenueChart.reduce((s, d) => s + d.revenue, 0);
    const totalTix7 = data.revenueChart.reduce((s, d) => s + d.tickets, 0);
    const totalSeatTix = data.economyTickets + data.businessTickets + data.firstClassTickets || 1;
    const avgRevPerTicket = data.totalTickets > 0 ? data.totalRevenue / data.totalTickets : 0;
    const peakDay = data.revenueChart.reduce((a, b) => b.revenue > a.revenue ? b : a, data.revenueChart[0]);
    return { totalRev7, totalTix7, totalSeatTix, avgRevPerTicket, peakDay };
  }, [data]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Ngày", "Vé bán", "Doanh thu"],
      ...data.revenueChart.map(d => [d.date, d.tickets.toString(), d.revenue.toString()]),
      ["Tổng", stats?.totalTix7.toString() ?? "", stats?.totalRev7.toString() ?? ""],
    ];
    const csv = rows.map(r => r.map(c => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bao-cao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Đang tải báo cáo...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive gap-2">
        Không thể tải dữ liệu. Vui lòng thử lại.
      </div>
    );
  }

  const kpis = [
    {
      label: "Tổng doanh thu", value: VND(data.totalRevenue),
      sub: `Hôm nay: ${VND(data.todayRevenue)}`,
      icon: TrendingUp, color: "text-green-600",
      bg: "bg-green-50/60 border-green-100 dark:bg-green-950/20 dark:border-green-900",
    },
    {
      label: "Tổng vé đã bán", value: data.totalTickets.toLocaleString("vi-VN"),
      sub: `Hôm nay: ${data.todayTickets} vé mới`,
      icon: Ticket, color: "text-blue-600",
      bg: "bg-blue-50/60 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900",
    },
    {
      label: "Tổng chuyến bay", value: data.totalFlights.toLocaleString("vi-VN"),
      sub: `Hôm nay: ${data.todayFlights} chuyến · ${data.totalAircrafts} tàu bay`,
      icon: Plane, color: "text-purple-600",
      bg: "bg-purple-50/60 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900",
    },
    {
      label: "Load Factor", value: `${data.loadFactor}%`,
      sub: `TB/vé: ${VND(stats?.avgRevPerTicket ?? 0)}`,
      icon: Users, color: "text-orange-500",
      bg: "bg-orange-50/60 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900",
    },
  ];

  const seatClasses = [
    { key: "Economy",    label: "Phổ thông",   count: data.economyTickets,    color: "bg-blue-500"   },
    { key: "Business",   label: "Thương gia",  count: data.businessTickets,   color: "bg-purple-500" },
    { key: "FirstClass", label: "Hạng nhất",   count: data.firstClassTickets, color: "bg-amber-500"  },
  ];

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Báo cáo Kinh doanh</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Dữ liệu thực – cập nhật mỗi phút · {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Xuất CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl border p-5 flex items-start gap-4 ${kpi.bg}`}
          >
            <div className={`mt-0.5 ${kpi.color}`}><kpi.icon className="w-8 h-8" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold mt-0.5 truncate">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Today highlight row */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="grid gap-3 sm:grid-cols-3"
      >
        {[
          { label: "Doanh thu hôm nay", value: VND(data.todayRevenue), icon: TrendingUp, color: "text-emerald-600" },
          { label: "Vé bán hôm nay",    value: `${data.todayTickets} vé`, icon: Ticket, color: "text-sky-600" },
          { label: "Chuyến bay hôm nay",value: `${data.todayFlights} chuyến`, icon: Calendar, color: "text-violet-600" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Chart + Seat class row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5 text-muted-foreground" /> Doanh thu 7 ngày gần nhất
              </CardTitle>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{VND(stats?.totalRev7 ?? 0)}</p>
                <p className="text-xs text-muted-foreground">{stats?.totalTix7} vé trong 7 ngày</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={data.revenueChart} />
            {stats?.peakDay && stats.peakDay.revenue > 0 && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Ngày cao nhất: <span className="font-semibold">{stats.peakDay.date}</span> — {VND(stats.peakDay.revenue)} ({stats.peakDay.tickets} vé)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Seat class */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="w-5 h-5 text-muted-foreground" /> Cơ cấu hạng vé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {seatClasses.map(cls => {
              const pct = Math.round((cls.count / stats!.totalSeatTix) * 100);
              return (
                <div key={cls.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{cls.label}</span>
                    <span className="text-muted-foreground">{cls.count} vé ({pct}%)</span>
                  </div>
                  <ProgressBar pct={pct} color={cls.color} />
                </div>
              );
            })}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Tổng vé</span>
                <span className="font-bold">{data.economyTickets + data.businessTickets + data.firstClassTickets}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-muted-foreground" /> Chi tiết doanh thu 7 ngày
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead className="text-center">Vé bán</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="w-40">Tỷ trọng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.revenueChart.map(item => {
                const pct = stats!.totalRev7 > 0 ? (item.revenue / stats!.totalRev7) * 100 : 0;
                const isPeak = item.date === stats?.peakDay?.date && item.revenue > 0;
                return (
                  <TableRow key={item.date} className={isPeak ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">
                      {item.date} {isPeak && <Badge className="ml-1 text-[10px] h-4 px-1.5 bg-primary/20 text-primary border-0 hover:bg-primary/20">Cao nhất</Badge>}
                    </TableCell>
                    <TableCell className="text-center">{item.tickets}</TableCell>
                    <TableCell className="text-right font-semibold">{VND(item.revenue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 font-bold bg-muted/30">
                <TableCell>Tổng 7 ngày</TableCell>
                <TableCell className="text-center">{stats?.totalTix7}</TableCell>
                <TableCell className="text-right text-primary">{VND(stats?.totalRev7 ?? 0)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming flights */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="w-5 h-5 text-muted-foreground" /> Chuyến bay sắp khởi hành
            </CardTitle>
            <Badge variant="outline">{data.upcomingFlights.length} chuyến</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.upcomingFlights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Không có chuyến bay sắp tới.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chuyến</TableHead>
                  <TableHead>Tuyến</TableHead>
                  <TableHead>Khởi hành</TableHead>
                  <TableHead>Máy bay</TableHead>
                  <TableHead>Tải</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingFlights.map(f => {
                  const dep = new Date(f.departureTime);
                  const isToday = dep.toDateString() === new Date().toDateString();
                  const timeStr = dep.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                  const dateStr = isToday
                    ? `Hôm nay ${timeStr}`
                    : `${dep.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} ${timeStr}`;
                  const statusCfg = FLIGHT_STATUS_CONF[f.status] ?? { label: f.status, cls: "bg-gray-100 text-gray-700" };

                  return (
                    <TableRow key={f.flightId}>
                      <TableCell className="font-bold text-primary">{f.flightNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-mono text-sm">
                          <span>{f.originCode}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span>{f.destinationCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={isToday ? "text-primary font-semibold" : ""}>{dateStr}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.aircraftModel}</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{f.bookedSeats}/{f.totalSeats} chỗ</p>
                          <LoadBar booked={f.bookedSeats} total={f.totalSeats} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`border-0 text-xs ${statusCfg.cls}`}>{statusCfg.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
