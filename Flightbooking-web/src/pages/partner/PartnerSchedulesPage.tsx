import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Calendar, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Clock, 
  DollarSign, 
  Plane,
  Sparkles
} from "lucide-react"
import { useAuthStore } from "../../stores/useAuthStore"
import { flightScheduleService, type CreateFlightScheduleRequest, type UpdateFlightScheduleRequest } from "../../services/flight-schedule.service"
import { routeService } from "../../services/route.service"
import { aircraftService } from "../../services/aircraft.service"
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

const DAYS = [
  { value: "1", label: "T2" },
  { value: "2", label: "T3" },
  { value: "3", label: "T4" },
  { value: "4", label: "T5" },
  { value: "5", label: "T6" },
  { value: "6", label: "T7" },
  { value: "0", label: "CN" }
]

export default function PartnerSchedulesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const airlineId = user?.airlineId || 0
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null)
  
  // Form States
  const [flightNumber, setFlightNumber] = useState("")
  const [routeId, setRouteId] = useState("")
  const [aircraftId, setAircraftId] = useState("")
  const [departureTime, setDepartureTime] = useState("08:00")
  const [arrivalTime, setArrivalTime] = useState("10:00")
  const [basePrice, setBasePrice] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  // Operational Messages
  const [opMessage, setOpMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)

  // Fetch schedules for this airline explicitly
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["partner-schedules", airlineId],
    queryFn: () => flightScheduleService.getByAirline(airlineId),
    enabled: airlineId > 0
  })

  const { data: routes = [] } = useQuery({
    queryKey: ["partner-routes"],
    queryFn: routeService.getAll
  })

  // Fetch only this airline's aircrafts for flight safety
  const { data: aircrafts = [] } = useQuery({
    queryKey: ["partner-aircrafts", airlineId],
    queryFn: () => aircraftService.getByAirline(airlineId),
    enabled: airlineId > 0
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateFlightScheduleRequest) => flightScheduleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-schedules", airlineId] })
      showSuccess("Tạo lịch bay định kỳ thành công!")
      setIsFormOpen(false)
      resetForm()
    },
    onError: (err: any) => showError(err.response?.data?.message || "Không thể tạo lịch bay.")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateFlightScheduleRequest }) => 
      flightScheduleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-schedules", airlineId] })
      showSuccess("Cập nhật lịch bay thành công!")
      setIsFormOpen(false)
      resetForm()
    },
    onError: (err: any) => showError(err.response?.data?.message || "Không thể cập nhật lịch bay.")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => flightScheduleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-schedules", airlineId] })
      showSuccess("Xóa lịch bay thành công!")
    },
    onError: (err: any) => showError(err.response?.data?.message || "Không thể xóa lịch bay.")
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, schedule }: { id: number, schedule: any }) => {
      const updateData: UpdateFlightScheduleRequest = {
        daysOfWeek: schedule.daysOfWeek,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        routeId: schedule.routeId,
        aircraftId: schedule.aircraftId,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        basePrice: schedule.basePrice,
        isActive: !schedule.isActive
      }
      return flightScheduleService.update(id, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-schedules", airlineId] })
      showSuccess("Đã thay đổi trạng thái hoạt động!")
    },
    onError: (err: any) => showError(err.response?.data?.message || "Lỗi thay đổi trạng thái.")
  })

  const showSuccess = (msg: string) => {
    setOpMessage({ text: msg, type: "success" })
    setTimeout(() => setOpMessage(null), 5000)
  }

  const showError = (msg: string) => {
    setOpMessage({ text: msg, type: "error" })
    setTimeout(() => setOpMessage(null), 5000)
  }

  const resetForm = () => {
    setSelectedSchedule(null)
    setFlightNumber("")
    setRouteId("")
    setAircraftId("")
    setDepartureTime("08:00")
    setArrivalTime("10:00")
    setBasePrice("")
    setSelectedDays([])
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")
    setIsActive(true)
  }

  const handleEdit = (schedule: any) => {
    setSelectedSchedule(schedule)
    setFlightNumber(schedule.flightNumber)
    setRouteId(schedule.routeId.toString())
    setAircraftId(schedule.aircraftId.toString())
    setDepartureTime(schedule.departureTime.substring(0, 5))
    setArrivalTime(schedule.arrivalTime.substring(0, 5))
    setBasePrice(schedule.basePrice.toString())
    setSelectedDays(schedule.daysOfWeek.split(","))
    setStartDate(new Date(schedule.startDate).toISOString().split("T")[0])
    setEndDate(schedule.endDate ? new Date(schedule.endDate).toISOString().split("T")[0] : "")
    setIsActive(schedule.isActive)
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!flightNumber || !routeId || !aircraftId || selectedDays.length === 0 || !basePrice) {
      showError("Vui lòng điền đầy đủ các thông tin bắt buộc.")
      return
    }

    const daysStr = selectedDays.sort().join(",")

    if (selectedSchedule) {
      const request: UpdateFlightScheduleRequest = {
        daysOfWeek: daysStr,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        routeId: parseInt(routeId),
        aircraftId: parseInt(aircraftId),
        departureTime,
        arrivalTime,
        basePrice: parseFloat(basePrice),
        isActive
      }
      updateMutation.mutate({ id: selectedSchedule.id, data: request })
    } else {
      const request: CreateFlightScheduleRequest = {
        flightNumber,
        daysOfWeek: daysStr,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        routeId: parseInt(routeId),
        aircraftId: parseInt(aircraftId),
        departureTime,
        arrivalTime,
        basePrice: parseFloat(basePrice)
      }
      createMutation.mutate(request)
    }
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const filteredSchedules = schedules.filter(s => 
    s.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.originCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destinationCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderDays = (daysOfWeek: string) => {
    const list = daysOfWeek.split(",")
    return (
      <div className="flex gap-1">
        {DAYS.map(d => {
          const isActiveDay = list.includes(d.value)
          return (
            <span 
              key={d.value} 
              className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border ${
                isActiveDay 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {d.label}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Calendar className="h-8 w-8 text-primary" />
            Lịch Bay Định Kỳ ({user?.fullName})
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý lịch bay lặp lại của hãng. Hệ thống sẽ tự động tạo chuyến bay trước 30 ngày.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setIsFormOpen(true)
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm border border-emerald-700/10"
        >
          <Plus className="h-4 w-4 text-white stroke-[3]" />
          Thêm lịch bay mới
        </Button>
      </div>

      {/* Operation Toast Notification */}
      {opMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          opMessage.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {opMessage.type === "success" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span className="font-medium text-sm">{opMessage.text}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-muted-foreground font-medium">Tổng lịch bay</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">{schedules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-muted-foreground font-medium">Đang hoạt động</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {schedules.filter(s => s.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-muted-foreground font-medium">Đã dừng</CardDescription>
            <CardTitle className="text-2xl font-bold text-muted-foreground">
              {schedules.filter(s => !s.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-muted-foreground font-medium">Đã sinh ra</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {schedules.reduce((acc, curr) => acc + curr.flightsGenerated, 0)} chuyến
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter and Table */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo số hiệu, tuyến..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border text-foreground placeholder-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <TableRow>
                <TableHead className="text-muted-foreground font-medium">Số hiệu</TableHead>
                <TableHead className="text-muted-foreground font-medium">Tuyến bay</TableHead>
                <TableHead className="text-muted-foreground font-medium">Tần suất bay</TableHead>
                <TableHead className="text-muted-foreground font-medium">Khởi hành ➔ Đến</TableHead>
                <TableHead className="text-muted-foreground font-medium">Thời hạn lịch</TableHead>
                <TableHead className="text-muted-foreground font-medium">Giá cơ bản</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Đã sinh</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Trạng thái</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Đang tải danh sách lịch bay...
                  </TableCell>
                </TableRow>
              ) : filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground font-medium">
                    Không tìm thấy lịch bay định kỳ nào của hãng.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow 
                    key={schedule.id} 
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-bold text-foreground text-base">
                      {schedule.flightNumber}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {schedule.originCode} ➔ {schedule.destinationCode}
                    </TableCell>
                    <TableCell>
                      {renderDays(schedule.daysOfWeek)}
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground font-semibold text-sm">
                        {schedule.departureTime.substring(0, 5)} ➔ {schedule.arrivalTime.substring(0, 5)}
                      </div>
                      <span className="text-muted-foreground text-xs">{schedule.aircraftModel}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>Từ: {new Date(schedule.startDate).toLocaleDateString("vi-VN")}</div>
                      {schedule.endDate && <div>Đến: {new Date(schedule.endDate).toLocaleDateString("vi-VN")}</div>}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      {schedule.basePrice.toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell className="text-center font-bold text-foreground text-sm">
                      {schedule.flightsGenerated}
                    </TableCell>
                    <TableCell className="text-center">
                      <button 
                        onClick={() => toggleActiveMutation.mutate({ id: schedule.id, schedule })}
                        disabled={toggleActiveMutation.isPending}
                        className="focus:outline-none transition-transform hover:scale-105"
                      >
                        {schedule.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1 hover:bg-emerald-100">
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 gap-1 hover:bg-rose-100">
                            Đã dừng
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(schedule)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm("Bạn có chắc chắn muốn xóa lịch bay định kỳ này? Tất cả chuyến bay chưa cất cánh sinh ra từ lịch này sẽ bị xóa bỏ.")) {
                              deleteMutation.mutate(schedule.id)
                            }
                          }}
                          className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Dialog for Create/Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-card border text-card-foreground max-w-xl rounded-2xl overflow-y-auto max-h-[90vh] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {selectedSchedule ? "Cập nhật lịch bay hãng" : "Thêm lịch bay hãng mới"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Tạo hoặc cập nhật lịch bay tự động sinh cho riêng hãng bay của bạn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flight Number prefix */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mã chuyến bay (Prefix)</label>
                <Input
                  placeholder="Ví dụ: VN102"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  disabled={!!selectedSchedule}
                  className="bg-background border text-foreground focus-visible:ring-primary"
                />
              </div>

              {/* Base Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Giá vé cơ bản (VND)</label>
                <Input
                  type="number"
                  placeholder="Ví dụ: 1200000"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="bg-background border text-foreground focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Route */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tuyến bay</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn tuyến bay --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.originCode} ({r.originCity}) ➔ {r.destinationCode} ({r.destinationCity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Aircraft */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Máy bay vận hành của hãng</label>
                <select
                  value={aircraftId}
                  onChange={(e) => setAircraftId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn máy bay hãng --</option>
                  {aircrafts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.model} ({a.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Giờ cất cánh (HH:mm)</label>
                <Input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="bg-background border text-foreground focus-visible:ring-primary"
                />
              </div>

              {/* Arrival Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Giờ hạ cánh (HH:mm)</label>
                <Input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="bg-background border text-foreground focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Ngày bắt đầu áp dụng</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border text-foreground focus-visible:ring-primary"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Ngày kết thúc (Không bắt buộc)</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border text-foreground focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Days Of Week Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Tần suất bay các ngày trong tuần</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const isChecked = selectedDays.includes(day.value)
                  return (
                    <button
                      type="button"
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                        isChecked 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20" 
                          : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedSchedule && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="checkbox"
                  id="isActiveForm"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-input bg-background text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isActiveForm" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                  Kích hoạt lịch bay hoạt động
                </label>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {selectedSchedule ? "Lưu thay đổi" : "Tạo lịch bay"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
