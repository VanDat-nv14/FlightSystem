import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, Plane, Ticket, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { partnerDashboardService } from "../../services/partner-dashboard.service";
import { useAuthStore } from "../../stores/useAuthStore";

const VND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export default function PartnerReportsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-reports", user?.airlineId],
    queryFn: partnerDashboardService.getDashboard,
    enabled: !!user?.airlineId,
  });

  const totalChartRevenue = useMemo(() => data?.revenueChart.reduce((sum, item) => sum + item.revenue, 0) ?? 0, [data]);
  const totalChartTickets = useMemo(() => data?.revenueChart.reduce((sum, item) => sum + item.tickets, 0) ?? 0, [data]);

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Ngay", "Doanh thu", "So ve"],
      ...data.revenueChart.map((item) => [item.date, item.revenue.toString(), item.tickets.toString()]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-hang-bay-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center text-muted-foreground">Đang tải báo cáo...</div>;
  }

  if (error || !data) {
    return <div className="flex h-48 items-center justify-center text-destructive">Không thể tải báo cáo.</div>;
  }

  const kpis = [
    { label: "Tổng doanh thu", value: VND(data.totalRevenue), icon: TrendingUp, color: "text-green-600" },
    { label: "Vé đã bán", value: data.totalTickets.toLocaleString("vi-VN"), icon: Ticket, color: "text-blue-600" },
    { label: "Chuyến bay", value: data.totalFlights.toLocaleString("vi-VN"), icon: Plane, color: "text-purple-600" },
    { label: "Load factor", value: `${data.loadFactor}%`, icon: Users, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Báo cáo</h2>
          <p className="text-muted-foreground text-sm mt-1">Theo dõi doanh thu, vé bán và hiệu suất khai thác.</p>
        </div>
        <Button className="gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Xuất CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
              </div>
              <item.icon className={`h-8 w-8 ${item.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Doanh thu 7 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Vé bán</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.revenueChart.map((item) => (
                  <TableRow key={item.date}>
                    <TableCell className="font-medium">{item.date}</TableCell>
                    <TableCell>{item.tickets}</TableCell>
                    <TableCell className="text-right font-semibold">{VND(item.revenue)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Tổng</TableCell>
                  <TableCell className="font-bold">{totalChartTickets}</TableCell>
                  <TableCell className="text-right font-bold">{VND(totalChartRevenue)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cơ cấu hạng vé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Economy", data.economyTickets, "bg-blue-500"],
              ["Business", data.businessTickets, "bg-purple-500"],
              ["First Class", data.firstClassTickets, "bg-amber-500"],
            ].map(([label, count, color]) => {
              const total = data.economyTickets + data.businessTickets + data.firstClassTickets || 1;
              const percent = Math.round((Number(count) / total) * 100);
              return (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{count} vé</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
