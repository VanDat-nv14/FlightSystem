import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Search, X, Check, Plane, Calendar, ArrowRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { flightService, type Flight, type CreateFlightRequest, type UpdateFlightRequest } from "../../services/flight.service"
import { routeService } from "../../services/route.service"
import { aircraftService } from "../../services/aircraft.service"
import { useAuthStore } from "../../stores/useAuthStore"
import { PaginationControl } from "@/components/ui/pagination-control"

const STATUS_DETAILS: Record<string, { label: string; desc: string; color: string }> = {
  Scheduled: { label: "Lịch trình", desc: "Đang chờ đến giờ khởi hành", color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-50" },
  Boarding: { label: "Lên máy bay", desc: "Đang đón khách lên tàu bay", color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-50" },
  Delayed: { label: "Hoãn chuyến", desc: "Chuyến bay đang bị trì hoãn", color: "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-50" },
  Completed: { label: "Đã hạ cánh", desc: "Đã hoàn thành chặng bay an toàn", color: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-50" },
  Cancelled: { label: "Đã hủy", desc: "Chặng bay này đã bị hủy bỏ", color: "text-red-700 bg-red-50 border-red-200 hover:bg-red-50" }
}

const getNextStatuses = (current: string) => {
  switch (current) {
    case "Scheduled":
      return ["Boarding", "Delayed", "Cancelled"];
    case "Boarding":
      return ["Completed", "Delayed", "Cancelled"];
    case "Delayed":
      return ["Scheduled", "Boarding", "Cancelled"];
    default:
      return []; // Completed hoặc Cancelled là các trạng thái kết thúc, không thể thay đổi
  }
}

interface FlightModalProps {
  mode: "create" | "edit"
  flight?: Flight | null
  onClose: () => void
  onSave: (data: any) => void
  isSaving: boolean
  routes: any[]
  aircrafts: any[]
}

function FlightModal({ mode, flight, onClose, onSave, isSaving, routes, aircrafts }: FlightModalProps) {
  const [flightNumber, setFlightNumber] = useState(flight?.flightNumber ?? "")
  const [routeId, setRouteId] = useState(flight?.routeId?.toString() ?? "")
  const [aircraftId, setAircraftId] = useState(flight?.aircraftId?.toString() ?? "")
  const [departureTime, setDepartureTime] = useState(flight?.departureTime ? new Date(flight.departureTime).toISOString().slice(0, 16) : "")
  const [arrivalTime, setArrivalTime] = useState(flight?.arrivalTime ? new Date(flight.arrivalTime).toISOString().slice(0, 16) : "")
  const [basePrice, setBasePrice] = useState(flight?.basePrice?.toString() ?? "")
  const [status, setStatus] = useState(flight?.status ?? "Scheduled")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "create") {
      onSave({
        flightNumber,
        routeId: parseInt(routeId),
        aircraftId: parseInt(aircraftId),
        departureTime: new Date(departureTime).toISOString(),
        arrivalTime: new Date(arrivalTime).toISOString(),
        basePrice: parseFloat(basePrice)
      } as CreateFlightRequest)
    } else {
      onSave({
        departureTime: new Date(departureTime).toISOString(),
        arrivalTime: new Date(arrivalTime).toISOString(),
        basePrice: parseFloat(basePrice),
        status
      } as UpdateFlightRequest)
    }
  }

  const currentStatusInfo = STATUS_DETAILS[flight?.status ?? "Scheduled"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-2xl border overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{mode === "create" ? "Thêm chuyến bay mới" : "Chỉnh sửa chuyến bay"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: Flight & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số hiệu chuyến bay</Label>
              <Input 
                value={flightNumber} 
                onChange={e => setFlightNumber(e.target.value)} 
                required 
                placeholder="VD: VN123" 
                disabled={mode === "edit"}
                className="uppercase font-bold"
              />
            </div>
            
            {mode === "create" && (
              <div className="space-y-2">
                <Label>Trạng thái khởi tạo</Label>
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-semibold text-blue-700">Lịch trình (Mặc định)</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 1.1: Operational Status flow for edit mode */}
          {mode === "edit" && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <Label className="text-slate-700 font-bold text-sm">Vận hành trạng thái chuyến bay</Label>
              
              {/* Current Status banner */}
              <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái hiện tại</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{currentStatusInfo?.label}</p>
                  <p className="text-xs text-slate-500">{currentStatusInfo?.desc}</p>
                </div>
                <Badge className={`border shadow-sm px-2.5 py-0.5 text-xs font-semibold ${currentStatusInfo?.color}`}>
                  {currentStatusInfo?.label}
                </Badge>
              </div>

              {/* Transition flow */}
              {getNextStatuses(flight?.status ?? "Scheduled").length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chọn cập nhật trạng thái tiếp theo:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {getNextStatuses(flight?.status ?? "Scheduled").map(nextStatus => {
                      const isSelected = status === nextStatus
                      const details = STATUS_DETAILS[nextStatus]
                      return (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => setStatus(nextStatus)}
                          className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-800">{details.label}</span>
                          <span className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">{details.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg flex items-center gap-2 text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-semibold">Chuyến bay đã ở trạng thái kết thúc ({currentStatusInfo?.label}) và không thể cập nhật thêm.</span>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Journey details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tuyến bay</Label>
              {mode === "create" ? (
                <Select value={routeId} onValueChange={setRouteId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tuyến bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.originCode} → {r.destinationCode} ({r.originCity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={`${flight?.originCode} → ${flight?.destinationCode}`} disabled className="bg-muted/50 font-medium" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Máy bay</Label>
              {mode === "create" ? (
                <Select value={aircraftId} onValueChange={setAircraftId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn máy bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircrafts.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">Không có máy bay nào</div>
                    ) : (
                      aircrafts.map(a => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.model} ({a.registrationNumber})</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={flight?.aircraftModel} disabled className="bg-muted/50 font-medium" />
              )}
            </div>
          </div>

          {/* Section 3: Schedule timings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thời gian khởi hành</Label>
              <Input value={departureTime} onChange={e => setDepartureTime(e.target.value)} required type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label>Thời gian hạ cánh</Label>
              <Input value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} required type="datetime-local" />
            </div>
          </div>

          {/* Section 4: Pricing */}
          <div className="space-y-2">
            <Label>Giá vé cơ bản (VND)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">₫</span>
              <Input value={basePrice} onChange={e => setBasePrice(e.target.value)} required type="number" placeholder="VD: 1200000" className="pl-7 font-bold text-slate-800" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="flex-1 gap-2 rounded-xl bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu chuyến bay</>}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function PartnerFlightsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { user } = useAuthStore()
  const airlineId = user?.airlineId

  const { data: flights = [], isLoading: isFlightsLoading } = useQuery({
    queryKey: ["partner-flights", airlineId],
    queryFn: () => airlineId ? flightService.getByAirline(airlineId) : Promise.resolve([]),
    enabled: !!airlineId
  })

  // Routes are public/global
  const { data: routes = [] } = useQuery({ 
    queryKey: ["admin-routes-compact"], 
    queryFn: routeService.getAll 
  })

  // Aircrafts must be filtered by airlineId
  const { data: aircrafts = [] } = useQuery({ 
    queryKey: ["partner-aircrafts-compact", airlineId], 
    queryFn: () => airlineId ? aircraftService.getByAirline(airlineId) : Promise.resolve([]),
    enabled: !!airlineId
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateFlightRequest) => flightService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["partner-flights"] }); setModalMode(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFlightRequest }) => flightService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["partner-flights"] }); setModalMode(null); setEditingFlight(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => flightService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["partner-flights"] }); setDeleteConfirmId(null) },
  })

  const filtered = flights.filter(f =>
    f.flightNumber.toLowerCase().includes(search.toLowerCase()) ||
    f.originCode.toLowerCase().includes(search.toLowerCase()) ||
    f.destinationCode.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedFlights = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  function handleSave(data: any) {
    if (modalMode === "create") {
      createMutation.mutate(data)
    } else if (modalMode === "edit" && editingFlight) {
      updateMutation.mutate({ id: editingFlight.id, data })
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">Lịch trình</Badge>
      case "Boarding":
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 animate-pulse">Lên máy bay</Badge>
      case "Delayed":
        return <Badge className="bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-50">Hoãn chuyến</Badge>
      case "Completed":
        return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">Đã hạ cánh</Badge>
      case "Cancelled":
        return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!airlineId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Tài khoản của bạn chưa được liên kết với Hãng bay nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý chuyến bay</h2>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => setModalMode("create")}>
          <Plus className="w-4 h-4" /> Thêm chuyến bay
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl shadow-sm border-slate-200" placeholder="Tìm kiếm mã, tuyến bay..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <Badge variant="outline" className="text-sm bg-white shadow-sm font-medium">{filtered.length} chuyến bay</Badge>
      </div>

      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden relative min-h-[300px]">
        {isFlightsLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow>
              <TableHead className="font-bold text-slate-600">Số hiệu</TableHead>
              <TableHead className="font-bold text-slate-600">Tuyến bay</TableHead>
              <TableHead className="font-bold text-slate-600">Máy bay</TableHead>
              <TableHead className="font-bold text-slate-600">Thời gian</TableHead>
              <TableHead className="font-bold text-slate-600">Giá cơ bản</TableHead>
              <TableHead className="font-bold text-slate-600">Trạng thái</TableHead>
              <TableHead className="text-right font-bold text-slate-600">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isFlightsLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground font-medium">
                  Không có chuyến bay nào được tìm thấy.
                </TableCell>
              </TableRow>
            ) : (
              paginatedFlights.map(flight => (
                <TableRow key={flight.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-extrabold text-blue-600 tracking-wide">{flight.flightNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      {flight.originCode} <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> {flight.destinationCode}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-slate-400" />
                      {flight.aircraftModel}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(flight.departureTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </TableCell>
                  <TableCell className="font-extrabold text-slate-800">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(flight.basePrice)}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(flight.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline" size="icon" className="rounded-lg h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors border-slate-200"
                        onClick={() => { setEditingFlight(flight); setModalMode("edit") }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {deleteConfirmId === flight.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" className="rounded-lg h-8 text-xs" onClick={() => deleteMutation.mutate(flight.id)}>
                            Xóa
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-lg h-8 text-xs hover:bg-slate-100" onClick={() => setDeleteConfirmId(null)}>Hủy</Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive" size="icon" className="rounded-lg h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors border-slate-200"
                          onClick={() => setDeleteConfirmId(flight.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 bg-card p-3 rounded-xl border shadow-sm">
          <div className="text-sm text-slate-500 font-medium">
            Hiển thị <span className="font-semibold text-slate-800">{paginatedFlights.length}</span> trên tổng số <span className="font-semibold text-slate-800">{filtered.length}</span> chuyến bay
          </div>
          <PaginationControl currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      <AnimatePresence>
        {modalMode && (
          <FlightModal
            mode={modalMode}
            flight={editingFlight}
            onClose={() => { setModalMode(null); setEditingFlight(null) }}
            onSave={handleSave}
            isSaving={createMutation.isPending || updateMutation.isPending}
            routes={routes}
            aircrafts={aircrafts}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
