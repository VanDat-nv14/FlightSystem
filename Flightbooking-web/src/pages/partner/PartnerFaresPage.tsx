import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plane, Armchair, Plus, Trash2, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { aircraftService } from "../../services/aircraft.service"
import { seatConfigService, type ClassConfigurationRequest, type BulkCreateSeatConfigRequest } from "../../services/seat-config.service"
import { useAuthStore } from "../../stores/useAuthStore"

const SEAT_CLASSES = [
  { id: "Economy", label: "Phổ thông (Economy)", defaultMultiplier: 1.0 },
  { id: "Business", label: "Thương gia (Business)", defaultMultiplier: 2.5 },
  { id: "FirstClass", label: "Hạng nhất (First Class)", defaultMultiplier: 4.0 },
]

export default function PartnerFaresPage() {
  const { user } = useAuthStore()
  const airlineId = user?.airlineId
  const queryClient = useQueryClient()

  const [selectedAircraftId, setSelectedAircraftId] = useState<string>("")
  const [seatsPerRow, setSeatsPerRow] = useState("6")
  const [classConfigs, setClassConfigs] = useState<ClassConfigurationRequest[]>([
    { classType: "Economy", numberOfSeats: 150, priceMultiplier: 1.0 }
  ])

  // Fetch Airline's Aircrafts
  const { data: aircrafts = [] } = useQuery({
    queryKey: ["partner-aircrafts", airlineId],
    queryFn: () => airlineId ? aircraftService.getByAirline(airlineId) : Promise.resolve([]),
    enabled: !!airlineId
  })

  // Fetch Seat Configurations for Selected Aircraft
  const { data: seatConfigs = [] } = useQuery({
    queryKey: ["seat-configs", selectedAircraftId],
    queryFn: () => selectedAircraftId ? seatConfigService.getByAircraft(parseInt(selectedAircraftId)) : Promise.resolve([]),
    enabled: !!selectedAircraftId
  })

  const bulkCreateMutation = useMutation({
    mutationFn: (data: BulkCreateSeatConfigRequest) => seatConfigService.bulkCreate(data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["seat-configs", selectedAircraftId] })
      alert("Thành công: Đã tạo cấu hình ghế hàng loạt.")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      alert(err?.response?.data?.message || "Không thể tạo cấu hình ghế.")
    }
  })

  const clearMutation = useMutation({
    mutationFn: (id: number) => seatConfigService.clearByAircraft(id),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["seat-configs", selectedAircraftId] })
      alert("Thành công: Đã xóa toàn bộ cấu hình ghế.")
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      alert(err?.response?.data?.message || "Không thể xóa cấu hình ghế.")
    }
  })

  const selectedAircraft = aircrafts.find(a => a.id.toString() === selectedAircraftId)
  
  const handleAddClass = () => {
    setClassConfigs([...classConfigs, { classType: "Economy", numberOfSeats: 0, priceMultiplier: 1.0 }])
  }

  const handleUpdateClass = (index: number, field: keyof ClassConfigurationRequest, value: string | number) => {
    const updated = [...classConfigs]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'classType') {
      const defaultMult = SEAT_CLASSES.find(c => c.id === value)?.defaultMultiplier || 1.0
      updated[index].priceMultiplier = defaultMult
    }
    setClassConfigs(updated)
  }

  const handleRemoveClass = (index: number) => {
    setClassConfigs(classConfigs.filter((_, i) => i !== index))
  }

  const handleGenerate = () => {
    if (!selectedAircraftId) return
    const totalRequested = classConfigs.reduce((sum, c) => sum + c.numberOfSeats, 0)
    if (totalRequested > (selectedAircraft?.totalSeats || 0)) {
      alert(`Lỗi: Tổng số ghế (${totalRequested}) vượt quá sức chứa (${selectedAircraft?.totalSeats}).`)
      return
    }

    bulkCreateMutation.mutate({
      aircraftId: parseInt(selectedAircraftId),
      seatsPerRow: parseInt(seatsPerRow),
      classes: classConfigs
    })
  }

  if (!airlineId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Tài khoản của bạn chưa được liên kết với Hãng bay nào.</p>
      </div>
    )
  }

  // Calculate stats if configurations exist
  const hasConfigs = seatConfigs.length > 0
  const statsByClass = seatConfigs.reduce((acc, seat) => {
    if (!acc[seat.classType]) acc[seat.classType] = { count: 0, multiplier: seat.priceMultiplier }
    acc[seat.classType].count++
    return acc
  }, {} as Record<string, { count: number, multiplier: number }>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Cấu hình Hạng vé & Chỗ ngồi</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Plane className="w-5 h-5 text-primary" /> Chọn Tàu bay</h3>
            <div className="space-y-2">
              <Label>Tàu bay</Label>
              <Select value={selectedAircraftId} onValueChange={setSelectedAircraftId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tàu bay để cấu hình..." />
                </SelectTrigger>
                <SelectContent>
                  {aircrafts.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.model} ({a.registrationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAircraft && (
              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{selectedAircraft.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sức chứa:</span>
                  <span className="font-bold text-primary">{selectedAircraft.totalSeats} ghế</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge variant={selectedAircraft.isActive ? "secondary" : "destructive"}>
                    {selectedAircraft.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Configuration Workspace */}
        <div className="lg:col-span-2">
          {!selectedAircraftId ? (
            <div className="bg-card border rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-muted-foreground h-full min-h-[300px]">
              <Armchair className="w-12 h-12 mb-4 opacity-20" />
              <p>Vui lòng chọn một tàu bay để bắt đầu cấu hình hạng vé.</p>
            </div>
          ) : hasConfigs ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Cấu hình hiện tại</h3>
                    <p className="text-sm text-muted-foreground">Tàu bay đã được cấu hình sơ đồ ghế.</p>
                  </div>
                  <Button variant="destructive" size="sm" className="gap-2" onClick={() => clearMutation.mutate(parseInt(selectedAircraftId))} disabled={clearMutation.isPending}>
                    <Trash2 className="w-4 h-4" /> Xóa cấu hình
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(statsByClass).map(([className, stat]: [string, { count: number, multiplier: number }]) => (
                    <div key={className} className="border rounded-lg p-4 bg-muted/30">
                      <div className="text-sm font-semibold mb-2">{className}</div>
                      <div className="text-2xl font-bold text-primary">{stat.count} <span className="text-sm font-normal text-muted-foreground">ghế</span></div>
                      <div className="text-sm text-muted-foreground mt-1">Hệ số giá: x{stat.multiplier}</div>
                    </div>
                  ))}
                  <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                    <div className="text-sm font-semibold mb-2 text-primary">Tổng cộng</div>
                    <div className="text-2xl font-bold">{seatConfigs.length} <span className="text-sm font-normal text-muted-foreground">/ {selectedAircraft?.totalSeats}</span></div>
                    <div className="text-sm text-muted-foreground mt-1">Tỷ lệ: {Math.round((seatConfigs.length / (selectedAircraft?.totalSeats || 1)) * 100)}%</div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm flex gap-3 items-start">
                  <div className="mt-0.5">ℹ️</div>
                  <p>Hệ thống tự động sử dụng sơ đồ ghế này để phát sinh chỗ ngồi khi Hãng tạo Chuyến bay mới bằng máy bay này.</p>
                </div>
             </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-1">Thiết lập cấu hình ghế mới</h3>
                <p className="text-sm text-muted-foreground">Định nghĩa số lượng ghế và hệ số giá cho từng hạng vé. Hệ thống sẽ tự động sinh sơ đồ ghế.</p>
              </div>

              <div className="space-y-4">
                <div className="max-w-xs space-y-2">
                  <Label>Số ghế mỗi hàng (Seats per row)</Label>
                  <Select value={seatsPerRow} onValueChange={setSeatsPerRow}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 ghế (A-B C-D)</SelectItem>
                      <SelectItem value="6">6 ghế (A-B-C D-E-F)</SelectItem>
                      <SelectItem value="9">9 ghế (A-B-C D-E-F G-H-J)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Cấu hình Hạng vé</Label>
                    <Button variant="outline" size="sm" className="gap-1 h-8" onClick={handleAddClass}>
                      <Plus className="w-4 h-4" /> Thêm hạng
                    </Button>
                  </div>
                  
                  {classConfigs.map((config, index) => (
                    <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-3 border rounded-lg bg-muted/10 relative group">
                      <div className="space-y-1.5 flex-1 min-w-[200px]">
                        <Label className="text-xs">Hạng ghế</Label>
                        <Select value={config.classType} onValueChange={(v) => handleUpdateClass(index, 'classType', v)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SEAT_CLASSES.map(sc => (
                              <SelectItem key={sc.id} value={sc.id}>{sc.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 w-[120px]">
                        <Label className="text-xs">Số lượng</Label>
                        <Input type="number" min="1" className="h-9" value={config.numberOfSeats} onChange={(e) => handleUpdateClass(index, 'numberOfSeats', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1.5 w-[120px]">
                        <Label className="text-xs">Hệ số giá (x)</Label>
                        <Input type="number" step="0.1" className="h-9" value={config.priceMultiplier} onChange={(e) => handleUpdateClass(index, 'priceMultiplier', parseFloat(e.target.value) || 1)} />
                      </div>
                      {classConfigs.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveClass(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-muted-foreground">Tổng số ghế đã cấu hình:</span>
                    <span className={`font-bold ${classConfigs.reduce((s, c) => s + c.numberOfSeats, 0) > (selectedAircraft?.totalSeats || 0) ? 'text-destructive' : 'text-primary'}`}>
                      {classConfigs.reduce((s, c) => s + c.numberOfSeats, 0)} / {selectedAircraft?.totalSeats}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button className="gap-2" onClick={handleGenerate} disabled={bulkCreateMutation.isPending || classConfigs.reduce((s, c) => s + c.numberOfSeats, 0) <= 0}>
                  {bulkCreateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Tạo cấu hình hàng loạt
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
