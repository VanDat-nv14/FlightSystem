import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Search, X, Check, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { airportService, type Airport } from "../../services/airport.service"

interface AirportModalProps {
  mode: "create" | "edit"
  airport?: Airport | null
  onClose: () => void
  onSave: (data: Omit<Airport, 'id'>) => void
  isSaving: boolean
}

function AirportModal({ mode, airport, onClose, onSave, isSaving }: AirportModalProps) {
  const [code, setCode] = useState(airport?.code ?? "")
  const [name, setName] = useState(airport?.name ?? "")
  const [city, setCity] = useState(airport?.city ?? "")
  const [country, setCountry] = useState(airport?.country ?? "")
  const [terminal, setTerminal] = useState(airport?.terminal ?? "")
  const [timezone, setTimezone] = useState(airport?.timezone ?? "")
  const [isFeatured, setIsFeatured] = useState(airport?.isFeatured ?? false)
  const [featuredImageUrl, setFeaturedImageUrl] = useState(airport?.featuredImageUrl ?? "")
  const [featuredDescription, setFeaturedDescription] = useState(airport?.featuredDescription ?? "")
  const [featuredDisplayOrder, setFeaturedDisplayOrder] = useState(airport?.featuredDisplayOrder?.toString() ?? "0")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      code, name, city, country, terminal, timezone,
      isFeatured,
      featuredImageUrl: featuredImageUrl || null,
      featuredDescription: featuredDescription || null,
      featuredDisplayOrder: parseInt(featuredDisplayOrder) || 0
    })
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
          <h2 className="text-xl font-bold">{mode === "create" ? "Thêm sân bay mới" : "Chỉnh sửa sân bay"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mã sân bay (IATA)</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} required placeholder="VD: SGN" maxLength={3} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Tên sân bay</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required placeholder="VD: Tân Sơn Nhất" />
            </div>
            <div className="space-y-2">
              <Label>Thành phố</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} required placeholder="VD: TP. Hồ Chí Minh" />
            </div>
            <div className="space-y-2">
              <Label>Quốc gia</Label>
              <Input value={country} onChange={e => setCountry(e.target.value)} required placeholder="VD: Việt Nam" />
            </div>
            <div className="space-y-2">
              <Label>Nhà ga (Terminal)</Label>
              <Input value={terminal} onChange={e => setTerminal(e.target.value)} placeholder="VD: T1, T2" />
            </div>
            <div className="space-y-2">
              <Label>Múi giờ</Label>
              <Input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="VD: UTC+7" />
            </div>
          </div>

          <div className="pt-4 border-t mt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isFeatured" className="cursor-pointer font-bold text-primary">Điểm đến nổi bật</Label>
            </div>

            {isFeatured && (
              <div className="grid grid-cols-1 gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="space-y-2">
                  <Label>URL hình ảnh (Tỷ lệ 4:5)</Label>
                  <Input value={featuredImageUrl} onChange={(e) => setFeaturedImageUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn gọn</Label>
                  <Input value={featuredDescription} onChange={(e) => setFeaturedDescription(e.target.value)} placeholder="VD: Phố cổ, nhịp sống thủ đô..." />
                </div>
                <div className="space-y-2">
                  <Label>Thứ tự hiển thị (0 là đầu tiên)</Label>
                  <Input type="number" value={featuredDisplayOrder} onChange={(e) => setFeaturedDisplayOrder(e.target.value)} />
                </div>
              </div>
            )}
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

export default function AirportsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: airports = [], isLoading, error } = useQuery({
    queryKey: ["admin-airports"],
    queryFn: airportService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Airport, 'id'>) => airportService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-airports"] }); setModalMode(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Airport> }) => airportService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-airports"] }); setModalMode(null); setEditingAirport(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => airportService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-airports"] }); setDeleteConfirmId(null) },
  })

  const filtered = airports.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  )

  function handleSave(data: Omit<Airport, 'id'>) {
    if (modalMode === "create") {
      createMutation.mutate(data)
    } else if (modalMode === "edit" && editingAirport) {
      updateMutation.mutate({ id: editingAirport.id, data })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý sân bay</h2>
        <Button className="gap-2" onClick={() => setModalMode("create")}>
          <Plus className="w-4 h-4" /> Thêm sân bay
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm kiếm theo mã, tên, thành phố..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-sm">{filtered.length} sân bay</Badge>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-muted-foreground">
            Lỗi tải dữ liệu. Vui lòng thử lại.
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên sân bay</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead>Quốc gia</TableHead>
              <TableHead>Terminal</TableHead>
              <TableHead>Múi giờ</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Không có sân bay nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(airport => (
                <TableRow key={airport.id}>
                  <TableCell className="font-bold text-primary">{airport.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{airport.name}</span>
                      {airport.isFeatured && (
                        <Badge variant="default" className="text-[10px] h-4 px-1.5 py-0 bg-rose-500 hover:bg-rose-600">Nổi bật</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {airport.city}
                    </div>
                  </TableCell>
                  <TableCell>{airport.country}</TableCell>
                  <TableCell>{airport.terminal || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{airport.timezone || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline" size="icon"
                        onClick={() => { setEditingAirport(airport); setModalMode("edit") }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {deleteConfirmId === airport.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(airport.id)}>
                            Xóa
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>Hủy</Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive" size="icon"
                          onClick={() => setDeleteConfirmId(airport.id)}
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
          <AirportModal
            mode={modalMode}
            airport={editingAirport}
            onClose={() => { setModalMode(null); setEditingAirport(null) }}
            onSave={handleSave}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
