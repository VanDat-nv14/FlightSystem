import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, Plane, ArrowRight, User, Calendar, TicketIcon, UserCheck, UserX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { partnerBookingService } from "../../services/partner-booking.service"
import { useAuthStore } from "../../stores/useAuthStore"

const CHECK_IN_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NotCheckedIn: { label: "Chưa check-in", variant: "outline" },
  CheckedIn: { label: "Đã check-in", variant: "secondary" },
  Boarded: { label: "Đã lên máy bay", variant: "default" },
  NoShow: { label: "No-show", variant: "destructive" },
}

const CLASS_COLORS: Record<string, string> = {
  Economy: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Business: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  FirstClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

export default function PartnerBookingsPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState("")
  const [flightFilter, setFlightFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [checkInFilter, setCheckInFilter] = useState("all")

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["partner-tickets", user?.airlineId],
    queryFn: partnerBookingService.getMyTickets,
    enabled: !!user?.airlineId,
  })

  // Unique flight numbers for filter dropdown
  const uniqueFlights = useMemo(() =>
    [...new Set(tickets.map(t => t.flightNumber))].sort(), [tickets])

  const filtered = useMemo(() => tickets.filter(t => {
    const matchSearch =
      t.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      t.passengerPassport.toLowerCase().includes(search.toLowerCase()) ||
      t.flightNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.seatNumber.toLowerCase().includes(search.toLowerCase())
    const matchFlight = flightFilter === "all" || t.flightNumber === flightFilter
    const matchClass = classFilter === "all" || t.seatClass === classFilter
    const matchCheckIn = checkInFilter === "all" || t.checkInStatus === checkInFilter
    return matchSearch && matchFlight && matchClass && matchCheckIn
  }), [tickets, search, flightFilter, classFilter, checkInFilter])

  // Summary stats
  const stats = useMemo(() => ({
    total: tickets.length,
    checkedIn: tickets.filter(t => t.checkInStatus === "CheckedIn" || t.checkInStatus === "Boarded").length,
    noShow: tickets.filter(t => t.checkInStatus === "NoShow").length,
    revenue: tickets.reduce((s, t) => s + t.seatPrice, 0),
    uniqueFlights: new Set(tickets.map(t => t.flightNumber)).size,
  }), [tickets])

  if (!user?.airlineId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Tài khoản của bạn chưa được liên kết với Hãng bay nào.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Đặt vé</h2>
        <p className="text-muted-foreground text-sm mt-1">Danh sách hành khách đã đặt vé trên các chuyến bay của hãng.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng vé đã bán", value: stats.total, icon: TicketIcon, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
          { label: "Đã check-in", value: stats.checkedIn, icon: UserCheck, color: "text-green-500", bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" },
          { label: "No-show", value: stats.noShow, icon: UserX, color: "text-red-500", bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" },
          {
            label: "Doanh thu vé",
            value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.revenue),
            icon: Plane,
            color: "text-purple-500",
            bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
            isWide: true
          },
        ].map(card => (
          <motion.div
            key={card.label}
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-4 border ${card.bg} flex items-center gap-3`}
          >
            <card.icon className={`w-8 h-8 flex-shrink-0 ${card.color}`} />
            <div className="min-w-0">
              <p className="text-xl font-bold truncate">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tên khách, hộ chiếu, chuyến bay..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={flightFilter} onValueChange={setFlightFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Chuyến bay" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyến</SelectItem>
            {uniqueFlights.map(fn => (
              <SelectItem key={fn} value={fn}>{fn}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Hạng vé" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hạng</SelectItem>
            <SelectItem value="Economy">Economy</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="FirstClass">First Class</SelectItem>
          </SelectContent>
        </Select>

        <Select value={checkInFilter} onValueChange={setCheckInFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="NotCheckedIn">Chưa check-in</SelectItem>
            <SelectItem value="CheckedIn">Đã check-in</SelectItem>
            <SelectItem value="Boarded">Đã lên máy bay</SelectItem>
            <SelectItem value="NoShow">No-show</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline" className="self-center text-sm px-3 py-1.5">
          {filtered.length} / {tickets.length} vé
        </Badge>
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
              <TableHead>Hành khách</TableHead>
              <TableHead>Chuyến bay</TableHead>
              <TableHead>Ghế</TableHead>
              <TableHead>Giá vé</TableHead>
              <TableHead>Khởi hành</TableHead>
              <TableHead>Check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  Không tìm thấy vé nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(ticket => (
                <TableRow key={ticket.ticketId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{ticket.passengerName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{ticket.passengerPassport}</div>
                        <div className="text-xs text-muted-foreground">{ticket.passengerNationality}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-bold text-primary text-sm">{ticket.flightNumber}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium">{ticket.originCode}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{ticket.destinationCode}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-mono font-bold">{ticket.seatNumber}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CLASS_COLORS[ticket.seatClass] ?? ""}`}>
                        {ticket.seatClass}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium text-sm">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(ticket.seatPrice)}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ticket.departureTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </TableCell>

                  <TableCell>
                    {(() => {
                      const cfg = CHECK_IN_STATUS[ticket.checkInStatus] ?? CHECK_IN_STATUS.NotCheckedIn
                      return <Badge variant={cfg.variant} className="whitespace-nowrap">{cfg.label}</Badge>
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
