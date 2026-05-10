import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Search, X, Check, ArrowRight, Clock, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { routeService, type Route, type CreateRouteRequest, type UpdateRouteRequest } from "../../services/route.service"
import { airportService } from "../../services/airport.service"

interface RouteModalProps {
  mode: "create" | "edit"
  route?: Route | null
  onClose: () => void
  onSave: (data: any) => void
  isSaving: boolean
  airports: any[]
}

function RouteModal({ mode, route, onClose, onSave, isSaving, airports }: RouteModalProps) {
  const [originAirportId, setOriginAirportId] = useState(route?.originAirportId?.toString() ?? "")
  const [destinationAirportId, setDestinationAirportId] = useState(route?.destinationAirportId?.toString() ?? "")
  const [distanceKm, setDistanceKm] = useState(route?.distanceKm ?? "")
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(route?.estimatedDurationMinutes?.toString() ?? "")
  const [isActive, setIsActive] = useState(route?.isActive ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "create") {
      onSave({
        originAirportId: parseInt(originAirportId),
        destinationAirportId: parseInt(destinationAirportId),
        distanceKm,
        estimatedDurationMinutes: parseInt(estimatedDurationMinutes)
      } as CreateRouteRequest)
    } else {
      onSave({
        distanceKm,
        estimatedDurationMinutes: parseInt(estimatedDurationMinutes),
        isActive
      } as UpdateRouteRequest)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-lg border overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{mode === "create" ? "Thêm tuyến bay mới" : "Chỉnh sửa tuyến bay"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "create" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sân bay đi</Label>
                <Select value={originAirportId} onValueChange={setOriginAirportId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sân bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map(a => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sân bay đến</Label>
                <Select value={destinationAirportId} onValueChange={setDestinationAirportId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sân bay" />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map(a => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-center gap-4 mb-4 border border-dashed">
              <div className="text-center">
                <div className="font-bold text-lg">{route?.originCode}</div>
                <div className="text-xs text-muted-foreground">{route?.originCity}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="text-center">
                <div className="font-bold text-lg">{route?.destinationCode}</div>
                <div className="text-xs text-muted-foreground">{route?.destinationCity}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Khoảng cách (Km)</Label>
              <Input value={distanceKm} onChange={e => setDistanceKm(e.target.value)} required placeholder="VD: 1200" />
            </div>
            <div className="space-y-2">
              <Label>Thời gian bay (Phút)</Label>
              <Input value={estimatedDurationMinutes} onChange={e => setEstimatedDurationMinutes(e.target.value)} required type="number" placeholder="VD: 120" />
            </div>
          </div>

          {mode === "edit" && (
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <Label htmlFor="isActive" className="cursor-pointer">Kích hoạt tuyến bay</Label>
            </div>
          )}

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

export default function RoutesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: routes = [], isLoading: isRoutesLoading } = useQuery({
    queryKey: ["admin-routes"],
    queryFn: routeService.getAll,
  })

  const { data: airports = [] } = useQuery({
    queryKey: ["admin-airports-compact"],
    queryFn: airportService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateRouteRequest) => routeService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-routes"] }); setModalMode(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRouteRequest }) => routeService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-routes"] }); setModalMode(null); setEditingRoute(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => routeService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-routes"] }); setDeleteConfirmId(null) },
  })

  const filtered = routes.filter(r =>
    r.originCode.toLowerCase().includes(search.toLowerCase()) ||
    r.destinationCode.toLowerCase().includes(search.toLowerCase()) ||
    r.originCity.toLowerCase().includes(search.toLowerCase()) ||
    r.destinationCity.toLowerCase().includes(search.toLowerCase())
  )

  function handleSave(data: any) {
    if (modalMode === "create") {
      createMutation.mutate(data)
    } else if (modalMode === "edit" && editingRoute) {
      updateMutation.mutate({ id: editingRoute.id, data })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý tuyến bay</h2>
        <Button className="gap-2" onClick={() => setModalMode("create")}>
          <Plus className="w-4 h-4" /> Thêm tuyến bay
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm kiếm theo mã, thành phố..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-sm">{filtered.length} tuyến bay</Badge>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border overflow-hidden relative min-h-[300px]">
        {isRoutesLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tuyến bay</TableHead>
              <TableHead>Từ</TableHead>
              <TableHead>Đến</TableHead>
              <TableHead>Khoảng cách</TableHead>
              <TableHead>Thời gian bay</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isRoutesLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Không có tuyến bay nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(route => (
                <TableRow key={route.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-primary">
                      {route.originCode} <ArrowRight className="w-3 h-3 text-muted-foreground" /> {route.destinationCode}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{route.originCity}</div>
                    <div className="text-xs text-muted-foreground">Airport ID: {route.originAirportId}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{route.destinationCity}</div>
                    <div className="text-xs text-muted-foreground">Airport ID: {route.destinationAirportId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Map className="w-3 h-3 text-muted-foreground" />
                      {route.distanceKm} Km
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {Math.floor(route.estimatedDurationMinutes / 60)}h {route.estimatedDurationMinutes % 60}m
                    </div>
                  </TableCell>
                  <TableCell>
                    {route.isActive 
                      ? <Badge variant="secondary">Hoạt động</Badge>
                      : <Badge variant="outline" className="text-muted-foreground">Bảo trì</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline" size="icon"
                        onClick={() => { setEditingRoute(route); setModalMode("edit") }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {deleteConfirmId === route.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(route.id)}>
                            Xóa
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>Hủy</Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive" size="icon"
                          onClick={() => setDeleteConfirmId(route.id)}
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
          <RouteModal
            mode={modalMode}
            route={editingRoute}
            onClose={() => { setModalMode(null); setEditingRoute(null) }}
            onSave={handleSave}
            isSaving={createMutation.isPending || updateMutation.isPending}
            airports={airports}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
