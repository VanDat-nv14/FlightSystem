import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { 
  PlaneTakeoff, 
  PlaneLanding, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search,
  SlidersHorizontal,
  FileText
} from "lucide-react"
import { useAuthStore } from "../../stores/useAuthStore"
import { flightService } from "../../services/flight.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"

// Helper translations for UI
const translateStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "scheduled": return { label: "Đã lên lịch", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    case "boarding": return { label: "Đang lên máy bay", color: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" };
    case "inflight": return { label: "Đang bay", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" };
    case "completed": return { label: "Đã hạ cánh", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    case "delayed": return { label: "Bị hoãn", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
    case "cancelled": return { label: "Đã hủy", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
    default: return { label: status, color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  }
};

const getAirportName = (code?: string) => {
  switch (code) {
    case "SGN": return "Sân bay Quốc tế Tân Sơn Nhất";
    case "HAN": return "Sân bay Quốc tế Nội Bài";
    case "DAD": return "Sân bay Quốc tế Đà Nẵng";
    case "CXR": return "Sân bay Quốc tế Cam Ranh";
    case "VCA": return "Sân bay Quốc tế Cần Thơ";
    case "HUI": return "Sân bay Quốc tế Phú Bài";
    case "PQC": return "Sân bay Quốc tế Phú Quốc";
    default: return `Sân bay ${code || ""}`;
  }
};

export default function AirportOpsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const airportCode = user?.airportCode || "SGN"
  
  const [activeTab, setActiveTab] = useState<"departures" | "arrivals">("departures")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [delayReason, setDelayReason] = useState("")
  const [targetStatus, setTargetStatus] = useState<string>("")
  const [actionError, setActionError] = useState<string | null>(null)

  // Fetch flights related to this airport
  const { data: flights = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["airport-flights", airportCode],
    queryFn: () => flightService.getByAirport(airportCode),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Mutation for updating status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number, status: string, reason?: string }) => 
      flightService.updateStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["airport-flights", airportCode] })
      setIsStatusDialogOpen(false)
      setSelectedFlight(null)
      setDelayReason("")
      setActionError(null)
    },
    onError: (error: any) => {
      setActionError(error.response?.data?.message || "Cập nhật trạng thái thất bại. Vui lòng kiểm tra lại quyền hạn hoặc quy trình.")
    }
  })

  // Filter flights based on tab and search
  const filteredFlights = flights.filter(f => {
    const matchesTab = activeTab === "departures" 
      ? f.originCode === airportCode 
      : f.destinationCode === airportCode

    const matchesSearch = f.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.originCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.destinationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.aircraftModel.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const handleOpenStatusDialog = (flight: any, status: string) => {
    setTargetStatus(status)
    setSelectedFlight(flight)
    setActionError(null)
    setDelayReason("")
    setIsStatusDialogOpen(true)
  }

  const handleConfirmStatusChange = () => {
    if (!selectedFlight) return
    updateStatusMutation.mutate({
      id: selectedFlight.id,
      status: targetStatus,
      reason: targetStatus === "Delayed" ? delayReason : undefined
    })
  }

  // Check departure/arrival remaining time
  const getTimeDiffLabel = (timeStr: string, statusStr: string) => {
    const time = new Date(timeStr)
    const now = new Date()
    const diffMs = time.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (statusStr.toLowerCase() === "completed") return "Đã hạ cánh"
    if (statusStr.toLowerCase() === "cancelled") return "Đã hủy"

    if (diffMins < 0) {
      return `Đã khởi hành ${Math.abs(diffMins)} phút trước`
    }
    return `Khởi hành sau ${diffMins} phút`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            {getAirportName(airportCode)} ({airportCode})
          </h1>
          <p className="text-slate-400 text-sm">
            Bảng điều hành bay thời gian thực cho nhân viên mặt đất sân bay.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isLoading || isFetching}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">Tổng chuyến bay trong ngày</CardDescription>
            <CardTitle className="text-2xl font-bold text-white">{flights.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">Chuyến bay cất cánh</CardDescription>
            <CardTitle className="text-2xl font-bold text-sky-400">
              {flights.filter(f => f.originCode === airportCode).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">Chuyến bay hạ cánh</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">
              {flights.filter(f => f.destinationCode === airportCode).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-slate-400 font-medium">Bị hoãn / Hủy</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-400">
              {flights.filter(f => f.status === "Delayed" || f.status === "Cancelled").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("departures")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "departures" 
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PlaneTakeoff className="h-4 w-4" />
            Cất Cánh (Ga Đi)
          </button>
          <button
            onClick={() => setActiveTab("arrivals")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "arrivals" 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PlaneLanding className="h-4 w-4" />
            Hạ Cánh (Ga Đến)
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Tìm số hiệu, tuyến bay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-900/50 border-slate-800 text-slate-100 placeholder-slate-500 focus-visible:ring-sky-500"
          />
        </div>
      </div>

      {/* Flights Table */}
      <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-950/60 border-b border-slate-800">
            <TableRow>
              <TableHead className="text-slate-400 font-medium">Chuyến bay</TableHead>
              <TableHead className="text-slate-400 font-medium">Tuyến bay</TableHead>
              <TableHead className="text-slate-400 font-medium">Khởi hành</TableHead>
              <TableHead className="text-slate-400 font-medium">Hạ cánh</TableHead>
              <TableHead className="text-slate-400 font-medium">Máy bay</TableHead>
              <TableHead className="text-slate-400 font-medium text-center">Trạng thái</TableHead>
              <TableHead className="text-slate-400 font-medium text-right">Hành động điều hành</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu chuyến bay...
                  </TableCell>
                </TableRow>
              ) : filteredFlights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 font-medium">
                    Không tìm thấy chuyến bay nào hoạt động hôm nay.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFlights.map((flight) => {
                  const statusInfo = translateStatus(flight.status)
                  const isOrigin = flight.originCode === airportCode
                  const isDestination = flight.destinationCode === airportCode
                  const currentStatus = flight.status.toLowerCase()

                  return (
                    <TableRow 
                      key={flight.id} 
                      className="border-b border-slate-800 hover:bg-slate-900/30 transition-colors"
                    >
                      <TableCell className="font-bold text-white text-base">
                        {flight.flightNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <span>{flight.originCode}</span>
                          <span className="text-slate-600">➔</span>
                          <span>{flight.destinationCode}</span>
                        </div>
                        <span className="text-slate-500 text-xs">{flight.airlineName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-200 font-medium">
                          {new Date(flight.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {new Date(flight.departureTime).toLocaleDateString("vi-VN")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-200 font-medium">
                          {new Date(flight.arrivalTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {new Date(flight.arrivalTime).toLocaleDateString("vi-VN")}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {flight.aircraftModel}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${statusInfo.color} font-medium border`}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {/* Ground Crew Operations for Origin Airport Staff */}
                          {isOrigin && (
                            <>
                              {currentStatus === "scheduled" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleOpenStatusDialog(flight, "Boarding")}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                  >
                                    Lên Máy Bay
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleOpenStatusDialog(flight, "Delayed")}
                                    className="border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-300"
                                  >
                                    Hoãn
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleOpenStatusDialog(flight, "Cancelled")}
                                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/5"
                                  >
                                    Hủy
                                  </Button>
                                </>
                              )}

                              {currentStatus === "boarding" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleOpenStatusDialog(flight, "InFlight")}
                                    className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold"
                                  >
                                    Cất Cánh (Bay)
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleOpenStatusDialog(flight, "Delayed")}
                                    className="border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-300"
                                  >
                                    Hoãn
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleOpenStatusDialog(flight, "Cancelled")}
                                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/5"
                                  >
                                    Hủy
                                  </Button>
                                </>
                              )}

                              {currentStatus === "delayed" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleOpenStatusDialog(flight, "Scheduled")}
                                    className="bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold"
                                  >
                                    Lên lịch lại
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleOpenStatusDialog(flight, "Boarding")}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                  >
                                    Lên Máy Bay
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleOpenStatusDialog(flight, "Cancelled")}
                                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/5"
                                  >
                                    Hủy
                                  </Button>
                                </>
                              )}

                              {currentStatus === "inflight" && (
                                <span className="text-xs text-sky-400/70 italic flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 animate-spin" /> Đang bay đến {flight.destinationCode}
                                </span>
                              )}
                            </>
                          )}

                          {/* Ground Crew Operations for Destination Airport Staff */}
                          {isDestination && (
                            <>
                              {currentStatus === "inflight" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleOpenStatusDialog(flight, "Completed")}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                                  >
                                    Xác nhận Hạ Cánh
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleOpenStatusDialog(flight, "Delayed")}
                                    className="border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-300"
                                  >
                                    Hoãn tiếp
                                  </Button>
                                </>
                              )}

                              {currentStatus === "boarding" && (
                                <span className="text-xs text-amber-400/70 italic">
                                  Đang chuẩn bị tại {flight.originCode}
                                </span>
                              )}

                              {currentStatus === "scheduled" && (
                                <span className="text-xs text-slate-500 italic">
                                  Chờ cất cánh từ {flight.originCode}
                                </span>
                              )}
                            </>
                          )}

                          {/* Completed & Cancelled status has no operational steps */}
                          {(currentStatus === "completed" || currentStatus === "cancelled") && (
                            <span className="text-xs text-slate-500 italic">
                              Hồ sơ lưu trữ đóng
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </Card>

      {/* Confirmation & Operation Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-sky-400" />
              Xác nhận thay đổi trạng thái
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Bạn đang thực hiện thay đổi trạng thái của chuyến bay <strong className="text-white">{selectedFlight?.flightNumber}</strong> ({selectedFlight?.originCode} ➔ {selectedFlight?.destinationCode}).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs text-slate-500 font-semibold">Trạng thái hiện tại</div>
                <div className="font-bold text-slate-200">{selectedFlight && translateStatus(selectedFlight.status).label}</div>
              </div>
              <span className="text-slate-600">➔</span>
              <div>
                <div className="text-xs text-slate-500 font-semibold">Trạng thái mục tiêu</div>
                <div className="font-bold text-sky-400">{translateStatus(targetStatus).label}</div>
              </div>
            </div>

            {/* Delay Reason Input */}
            {targetStatus === "Delayed" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Lý do hoãn chuyến (bắt buộc)
                </label>
                <Input
                  placeholder="Nhập lý do kỹ thuật, thời tiết..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus-visible:ring-rose-500"
                />
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium">
                {actionError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsStatusDialogOpen(false)
                setActionError(null)
              }}
              className="text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={updateStatusMutation.isPending || (targetStatus === "Delayed" && !delayReason.trim())}
              className={`font-bold ${
                targetStatus === "Cancelled" 
                  ? "bg-rose-600 hover:bg-rose-700 text-white" 
                  : targetStatus === "Completed"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                    : "bg-sky-400 hover:bg-sky-500 text-slate-950"
              }`}
            >
              {updateStatusMutation.isPending ? "Đang xử lý..." : "Xác nhận thực hiện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
