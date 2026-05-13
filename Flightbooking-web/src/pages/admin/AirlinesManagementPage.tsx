import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, CheckCircle2, XCircle, PauseCircle, Clock, Plane, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { airlineService, type Airline } from "../../services/airline.service"
const STATUS_CONFIG: Record<string, {
  label: string
  badgeVariant: "default" | "secondary" | "destructive" | "outline"
  icon: React.ElementType
  color: string
}> = {
  Pending: { label: "Chờ duyệt", badgeVariant: "outline", icon: Clock, color: "text-yellow-500" },
  Approved: { label: "Đã duyệt", badgeVariant: "secondary", icon: CheckCircle2, color: "text-green-500" },
  Rejected: { label: "Từ chối", badgeVariant: "destructive", icon: XCircle, color: "text-red-500" },
  Suspended: { label: "Tạm ngưng", badgeVariant: "destructive", icon: PauseCircle, color: "text-orange-500" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.badgeVariant} className="gap-1.5">
      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      {cfg.label}
    </Badge>
  )
}

function ActionDropdown({ airline, onAction }: { airline: Airline; onAction: (id: number, status: string) => void }) {
  const [open, setOpen] = useState(false)

  const actions = [
    { status: "Approved", label: "✅ Duyệt hãng", disabled: airline.status === "Approved" },
    { status: "Rejected", label: "❌ Từ chối", disabled: airline.status === "Rejected" },
    { status: "Suspended", label: "⏸️ Tạm ngưng", disabled: airline.status === "Suspended" },
    { status: "Pending", label: "🔄 Đặt lại (Pending)", disabled: airline.status === "Pending" },
  ]

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8"
        onClick={() => setOpen(!open)}
      >
        Thao tác <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-9 z-20 bg-popover border rounded-lg shadow-lg overflow-hidden min-w-[180px]"
            >
              {actions.map((action) => (
                <button
                  key={action.status}
                  disabled={action.disabled}
                  onClick={() => {
                    onAction(airline.id, action.status)
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {action.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const STATUS_TABS = ["Tất cả", "Pending", "Approved", "Rejected", "Suspended"]

export default function AirlinesManagementPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("Tất cả")

  const { data: airlines = [], isLoading } = useQuery({
    queryKey: ["admin-airlines"],
    queryFn: airlineService.getAll,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => airlineService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-airlines"] })
      const cfg = STATUS_CONFIG[variables.status]
      alert(`Cập nhật thành công: Hãng bay đã được chuyển sang trạng thái "${cfg?.label}".`)
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Không thể cập nhật trạng thái.")
    }
  })

  const filtered = airlines.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      (a.country ?? "").toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === "Tất cả" || a.status === activeTab
    return matchSearch && matchTab
  })

  const counts = {
    Tất_cả: airlines.length,
    Pending: airlines.filter(a => a.status === "Pending").length,
    Approved: airlines.filter(a => a.status === "Approved").length,
    Rejected: airlines.filter(a => a.status === "Rejected").length,
    Suspended: airlines.filter(a => a.status === "Suspended").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Hãng hàng không</h2>
          <p className="text-muted-foreground text-sm mt-1">Phê duyệt, theo dõi và quản lý tất cả các hãng đối tác.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Chờ duyệt", value: counts.Pending, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800" },
          { label: "Đã duyệt", value: counts.Approved, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
          { label: "Từ chối", value: counts.Rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" },
          { label: "Tạm ngưng", value: counts.Suspended, icon: PauseCircle, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800" },
        ].map(card => (
          <motion.div
            key={card.label}
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 border ${card.bg} ${card.border}`}
          >
            <div className="flex items-center gap-3">
              <card.icon className={`w-8 h-8 ${card.color}`} />
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status Tabs + Search */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              <span className="ml-1.5 text-xs opacity-60">
                {tab === "Tất cả" ? counts.Tất_cả : counts[tab as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 w-64" placeholder="Tìm kiếm hãng, mã, quốc gia..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hãng hàng không</TableHead>
              <TableHead>Mã IATA</TableHead>
              <TableHead>Quốc gia</TableHead>
              <TableHead>Đội bay</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  Không có hãng hàng không nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(airline => (
                <TableRow key={airline.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Plane className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{airline.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {airline.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                      {airline.code}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{airline.country ?? "—"}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{airline.aircraftCount} tàu bay</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={airline.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionDropdown
                      airline={airline}
                      onAction={(id, status) => statusMutation.mutate({ id, status })}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pending highlight box */}
      {counts.Pending > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm"
        >
          <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-yellow-700 dark:text-yellow-300">
              {counts.Pending} hãng đang chờ phê duyệt.
            </span>
            <span className="text-yellow-600 dark:text-yellow-400 ml-1">
              Vui lòng xem xét và phê duyệt hoặc từ chối để Airline Manager có thể đăng nhập và quản lý hãng bay của họ.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
