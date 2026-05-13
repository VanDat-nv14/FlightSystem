import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Search, X, Check, Plane, Armchair } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { aircraftService, type Aircraft, type CreateAircraftRequest, type UpdateAircraftRequest } from "../../services/aircraft.service"
import { useAuthStore } from "../../stores/useAuthStore"

interface AircraftModalProps {
  mode: "create" | "edit"
  aircraft?: Aircraft | null
  onClose: () => void
  onSave: (data: any) => void
  isSaving: boolean
  airlineId: number
}

function AircraftModal({ mode, aircraft, onClose, onSave, isSaving, airlineId }: AircraftModalProps) {
  const [registrationNumber, setRegistrationNumber] = useState(aircraft?.registrationNumber ?? "")
  const [model, setModel] = useState(aircraft?.model ?? "")
  const [totalSeats, setTotalSeats] = useState(aircraft?.totalSeats?.toString() ?? "")
  const [isActive, setIsActive] = useState(aircraft?.isActive ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "create") {
      onSave({
        registrationNumber,
        model,
        totalSeats: parseInt(totalSeats),
        airlineId: airlineId
      } as CreateAircraftRequest)
    } else {
      onSave({
        model,
        totalSeats: parseInt(totalSeats),
        isActive
      } as UpdateAircraftRequest)
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
          <h2 className="text-xl font-bold">{mode === "create" ? "Thêm máy bay mới" : "Chỉnh sửa máy bay"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Số đăng ký (Registration Number)</Label>
            <Input 
              value={registrationNumber} 
              onChange={e => setRegistrationNumber(e.target.value)} 
              required 
              placeholder="VD: VN-A321" 
              disabled={mode === "edit"}
              className="uppercase font-mono"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model máy bay</Label>
              <Input value={model} onChange={e => setModel(e.target.value)} required placeholder="VD: Airbus A321 Neo" />
            </div>
            <div className="space-y-2">
              <Label>Tổng số ghế</Label>
              <Input value={totalSeats} onChange={e => setTotalSeats(e.target.value)} required type="number" placeholder="VD: 180" />
            </div>
          </div>

          {mode === "edit" && (
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <Label htmlFor="isActive" className="cursor-pointer">Sẵn sàng phục vụ (Active)</Label>
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

export default function PartnerAircraftsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { user } = useAuthStore()
  const airlineId = user?.airlineId

  const { data: aircrafts = [], isLoading: isAircraftsLoading } = useQuery({
    queryKey: ["partner-aircrafts", airlineId],
    queryFn: () => airlineId ? aircraftService.getByAirline(airlineId) : Promise.resolve([]),
    enabled: !!airlineId
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAircraftRequest) => aircraftService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["partner-aircrafts"] }); setModalMode(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAircraftRequest }) => aircraftService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["partner-aircrafts"] }); setModalMode(null); setEditingAircraft(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aircraftService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["partner-aircrafts"] }); setDeleteConfirmId(null) },
  })

  const filtered = aircrafts.filter(a =>
    a.model.toLowerCase().includes(search.toLowerCase()) ||
    a.registrationNumber.toLowerCase().includes(search.toLowerCase())
  )

  function handleSave(data: any) {
    if (modalMode === "create") {
      createMutation.mutate(data)
    } else if (modalMode === "edit" && editingAircraft) {
      updateMutation.mutate({ id: editingAircraft.id, data })
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
        <h2 className="text-3xl font-bold tracking-tight">Đội bay của hãng</h2>
        <Button className="gap-2" onClick={() => setModalMode("create")}>
          <Plus className="w-4 h-4" /> Thêm máy bay
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm kiếm theo model, số đăng ký..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-sm">{filtered.length} máy bay</Badge>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border overflow-hidden relative min-h-[300px]">
        {isAircraftsLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số đăng ký</TableHead>
              <TableHead>Model máy bay</TableHead>
              <TableHead>Tổng số ghế</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isAircraftsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Không có máy bay nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(aircraft => (
                <TableRow key={aircraft.id}>
                  <TableCell className="font-mono font-bold text-primary">{aircraft.registrationNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-muted-foreground" />
                      {aircraft.model}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Armchair className="w-4 h-4 text-muted-foreground" />
                      {aircraft.totalSeats} ghế
                    </div>
                  </TableCell>
                  <TableCell>
                    {aircraft.isActive 
                      ? <Badge variant="secondary">Sẵn sàng</Badge>
                      : <Badge variant="destructive">Bảo trì</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline" size="icon"
                        onClick={() => { setEditingAircraft(aircraft); setModalMode("edit") }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {deleteConfirmId === aircraft.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(aircraft.id)}>
                            Xóa
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>Hủy</Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive" size="icon"
                          onClick={() => setDeleteConfirmId(aircraft.id)}
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
          <AircraftModal
            mode={modalMode}
            aircraft={editingAircraft}
            onClose={() => { setModalMode(null); setEditingAircraft(null) }}
            onSave={handleSave}
            isSaving={createMutation.isPending || updateMutation.isPending}
            airlineId={airlineId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
