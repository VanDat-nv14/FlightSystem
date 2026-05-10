import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Search, X, Check, Plane, Calendar, Tag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { flightService, type Flight, type CreateFlightRequest, type UpdateFlightRequest } from "../../services/flight.service"
import { routeService } from "../../services/route.service"
import { aircraftService } from "../../services/aircraft.service"

const FLIGHT_STATUSES = ["Scheduled", "Boarding", "Departed", "Arrived", "Delayed", "Cancelled"]

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
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={setStatus} disabled={mode === "create"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLIGHT_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                <Input value={`${flight?.originCode} → ${flight?.destinationCode}`} disabled className="bg-muted/50" />
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
                    {aircrafts.map(a => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.model} ({a.registrationNumber})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={flight?.aircraftModel} disabled className="bg-muted/50" />
              )}
            </div>
          </div>

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

          <div className="space-y-2">
            <Label>Giá vé cơ bản (VND)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₫</span>
              <Input value={basePrice} onChange={e => setBasePrice(e.target.value)} required type="number" placeholder="VD: 1200000" className="pl-7" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu</>}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function FlightsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: flights = [], isLoading: isFlightsLoading } = useQuery({
    queryKey: ["admin-flights"],
    queryFn: flightService.getAll,
  })

  const { data: routes = [] } = useQuery({ queryKey: ["admin-routes-compact"], queryFn: routeService.getAll })
  const { data: aircrafts = [] } = useQuery({ queryKey: ["admin-aircrafts-compact"], queryFn: aircraftService.getAll })

  const createMutation = useMutation({
    mutationFn: (data: CreateFlightRequest) => flightService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-flights"] }); setModalMode(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFlightRequest }) => flightService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-flights"] }); setModalMode(null); setEditingFlight(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => flightService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-flights"] }); setDeleteConfirmId(null) },
  })

  const filtered = flights.filter(f =>
    f.flightNumber.toLowerCase().includes(search.toLowerCase()) ||
    f.originCode.toLowerCase().includes(search.toLowerCase()) ||
    f.destinationCode.toLowerCase().includes(search.toLowerCase())
  )

  function handleSave(data: any) {
    if (modalMode === "create") {
      createMutation.mutate(data)
    } else if (modalMode === "edit" && editingFlight) {
      updateMutation.mutate({ id: editingFlight.id, data })
    }
  }

  function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "Scheduled": return "secondary";
      case "Boarding": return "default";
      case "Delayed": return "destructive";
      case "Cancelled": return "destructive";
      default: return "outline";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý chuyến bay</h2>
        <Button className="gap-2" onClick={() => setModalMode("create")}>
          <Plus className="w-4 h-4" /> Thêm chuyến bay
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm kiếm mã, tuyến bay..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-sm">{filtered.length} chuyến bay</Badge>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border overflow-hidden relative min-h-[300px]">
        {isFlightsLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số hiệu</TableHead>
              <TableHead>Tuyến bay</TableHead>
              <TableHead>Máy bay</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Giá cơ bản</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isFlightsLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Không có chuyến bay nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(flight => (
                <TableRow key={flight.id}>
                  <TableCell className="font-bold text-primary">{flight.flightNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {flight.originCode} <ArrowRight className="w-3 h-3 text-muted-foreground" /> {flight.destinationCode}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Plane className="w-3 h-3 text-muted-foreground" />
                      {flight.aircraftModel}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(flight.departureTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(flight.basePrice)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(flight.status)}>{flight.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline" size="icon"
                        onClick={() => { setEditingFlight(flight); setModalMode("edit") }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {deleteConfirmId === flight.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(flight.id)}>
                            Xóa
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>Hủy</Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive" size="icon"
                          onClick={() => setDeleteConfirmId(flight.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
