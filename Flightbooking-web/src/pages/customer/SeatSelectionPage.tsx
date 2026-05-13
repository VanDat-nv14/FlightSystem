import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useNavigate } from "react-router-dom"
import { flightService } from "../../services/flight.service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "../../components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plane, AlertCircle, ChevronRight, Users,
  Armchair, CheckCircle2, X
} from "lucide-react"

// ─── Seat status mapping ─────────────────────────────────────────────────────
function mapStatus(status: number): "available" | "booked" | "blocked" {
  if (status === 0) return "available"
  if (status === 3) return "blocked"
  return "booked"
}
function mapClass(classType: number): "Business" | "Economy" {
  return classType === 1 ? "Business" : "Economy"
}

// ─── Seat visual config ──────────────────────────────────────────────────────
const SEAT_STYLES = {
  available: {
    Business: "bg-amber-100 border-2 border-amber-400 text-amber-700 hover:bg-amber-300 hover:border-amber-600 cursor-pointer",
    Economy:  "bg-blue-100 border-2 border-blue-400 text-blue-700 hover:bg-blue-300 hover:border-blue-600 cursor-pointer",
  },
  selected: "bg-primary border-2 border-primary text-white shadow-lg scale-110 cursor-pointer",
  booked:   "bg-gray-200 border-2 border-gray-300 text-gray-400 cursor-not-allowed",
  blocked:  "bg-gray-100 border border-dashed border-gray-300 text-gray-300 cursor-not-allowed",
}

interface SeatData {
  id: number
  seatNumber: string
  classType: number
  status: number
  price: number
}

interface ProcessedSeat {
  id: number
  seatNumber: string
  row: number
  column: string
  seatClass: "Business" | "Economy"
  status: "available" | "booked" | "blocked"
  price: number
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function SeatSelectionPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const flightId       = Number(searchParams.get("flightId")) || 0
  const passengerCount = Number(searchParams.get("passengerCount")) || 1
  const originCode     = searchParams.get("origin")      || "SGN"
  const destCode       = searchParams.get("destination") || "HAN"
  const flightNumber   = searchParams.get("flightNumber") || ""
  const basePrice      = Number(searchParams.get("basePrice")) || 0

  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const { data: rawSeats = [], isLoading } = useQuery<SeatData[]>({
    queryKey: ["flight-seats", flightId],
    queryFn: () => flightService.getSeats(flightId),
    enabled: flightId > 0,
  })

  const seats: ProcessedSeat[] = useMemo(() =>
    rawSeats.map(s => {
      const rowMatch = s.seatNumber.match(/\d+/)
      const row = rowMatch ? parseInt(rowMatch[0]) : 0
      const column = s.seatNumber.replace(/\d+/, "")
      return {
        id:        s.id,
        seatNumber: s.seatNumber,
        row,
        column,
        seatClass:  mapClass(s.classType),
        status:     mapStatus(s.status),
        price:      s.price,
      }
    }),
  [rawSeats])

  // Group by row
  const rowMap = useMemo(() => {
    const map = new Map<number, ProcessedSeat[]>()
    seats.forEach(s => {
      if (!map.has(s.row)) map.set(s.row, [])
      map.get(s.row)!.push(s)
    })
    return map
  }, [seats])

  const sortedRows = useMemo(() =>
    Array.from(rowMap.keys()).sort((a, b) => a - b),
  [rowMap])

  const businessRows = useMemo(() =>
    sortedRows.filter(r => rowMap.get(r)?.some(s => s.seatClass === "Business")),
  [sortedRows, rowMap])

  const economyRows = useMemo(() =>
    sortedRows.filter(r => rowMap.get(r)?.every(s => s.seatClass === "Economy")),
  [sortedRows, rowMap])

  const selectedSeats = useMemo(() =>
    seats.filter(s => selectedIds.includes(s.id)),
  [seats, selectedIds])

  const seatUpgrade  = useMemo(() =>
    selectedSeats.reduce((sum, s) => sum + Math.max(0, s.price - basePrice), 0),
  [selectedSeats, basePrice])

  const ticketTotal  = basePrice * passengerCount
  const grandTotal   = ticketTotal + seatUpgrade

  function toggleSeat(seat: ProcessedSeat) {
    if (seat.status !== "available") return
    setSelectedIds(prev => {
      if (prev.includes(seat.id)) return prev.filter(id => id !== seat.id)
      if (prev.length >= passengerCount) {
        // Replace last selected
        return [...prev.slice(0, passengerCount - 1), seat.id]
      }
      return [...prev, seat.id]
    })
  }

  function getSeatStyle(seat: ProcessedSeat): string {
    if (selectedIds.includes(seat.id)) return SEAT_STYLES.selected
    if (seat.status === "booked")   return SEAT_STYLES.booked
    if (seat.status === "blocked")  return SEAT_STYLES.blocked
    return SEAT_STYLES.available[seat.seatClass]
  }

  function handleContinue() {
    const seatNumbers = selectedSeats.map(s => s.seatNumber).join(",")
    const params = new URLSearchParams({
      flightId:      flightId.toString(),
      passengerCount: passengerCount.toString(),
      seats:          seatNumbers,
      origin:         originCode,
      destination:    destCode,
      flightNumber,
      basePrice:      basePrice.toString(),
      total:          grandTotal.toString(),
    })
    navigate(`/passenger-info?${params.toString()}`)
  }

  // Render a single seat cell
  function SeatCell({ seat }: { seat: ProcessedSeat }) {
    const selected = selectedIds.includes(seat.id)
    return (
      <motion.button
        whileHover={seat.status === "available" ? { scale: 1.12 } : {}}
        whileTap={seat.status === "available" ? { scale: 0.95 } : {}}
        onClick={() => toggleSeat(seat)}
        disabled={seat.status !== "available" && !selected}
        title={`${seat.seatNumber} · ${seat.seatClass === "Business" ? "Thương gia" : "Phổ thông"} · ${formatVnd(seat.price)}`}
        className={`w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all select-none
          ${getSeatStyle(seat)}`}
      >
        {selected ? <CheckCircle2 className="w-4 h-4" /> : seat.seatNumber}
      </motion.button>
    )
  }

  // Render a row of seats (split A-C | gap | D-F)
  function SeatRow({ rowNum }: { rowNum: number }) {
    const rowSeats = rowMap.get(rowNum) ?? []
    const sorted   = [...rowSeats].sort((a, b) => a.column.localeCompare(b.column))
    const left  = sorted.filter(s => ["A", "B", "C"].includes(s.column))
    const right = sorted.filter(s => ["D", "E", "F"].includes(s.column))
    const isBusiness = rowSeats.some(s => s.seatClass === "Business")

    return (
      <div className={`flex items-center gap-2 py-0.5 ${isBusiness ? "py-1.5" : ""}`}>
        <span className="w-6 text-xs text-gray-400 text-right shrink-0">{rowNum}</span>
        <div className="flex gap-1">
          {left.map(s => <SeatCell key={s.id} seat={s} />)}
        </div>
        {/* Aisle */}
        <div className="w-6 shrink-0" />
        <div className="flex gap-1">
          {right.map(s => <SeatCell key={s.id} seat={s} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-primary text-white py-4 px-4 md:px-8">
        <div className="container flex items-center gap-3">
          <Plane className="w-5 h-5" />
          <span className="font-semibold">
            Chọn ghế — {originCode} → {destCode}
          </span>
          {flightNumber && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 font-mono">
              {flightNumber.split("-")[0]}
            </Badge>
          )}
        </div>
      </div>

      <div className="container px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* ── Left: Seat map ───────────────────────────────── */}
        <div className="flex-1 space-y-5">
          {/* Info bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Hãy chọn <strong>{passengerCount}</strong> ghế cho {passengerCount} hành khách.
              Đã chọn <strong>{selectedIds.length}/{passengerCount}</strong>.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              { color: "bg-amber-200 border-2 border-amber-400", label: "Thương gia" },
              { color: "bg-blue-200 border-2 border-blue-400",   label: "Phổ thông" },
              { color: "bg-primary",                              label: "Đang chọn" },
              { color: "bg-gray-200 border border-gray-300",      label: "Đã đặt" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded ${item.color}`} />
                <span className="text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Seat map container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Skeleton className="w-6 h-4" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="w-6" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : seats.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Armchair className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p>Không có dữ liệu ghế cho chuyến bay này.</p>
              </div>
            ) : (
              <div className="min-w-[280px] mx-auto w-fit space-y-1">
                {/* Column headers */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6" />
                  {["A", "B", "C", "", "D", "E", "F"].map((col, i) => (
                    <div
                      key={i}
                      className={`text-xs font-bold text-gray-400 text-center
                        ${col === "" ? "w-6" : "w-9"}`}
                    >
                      {col}
                    </div>
                  ))}
                </div>

                {/* Business class */}
                {businessRows.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6" />
                      <div className="flex-1 h-px bg-amber-200" />
                      <span className="text-xs text-amber-600 font-semibold px-2 bg-amber-50 rounded-full py-0.5">
                        Thương gia
                      </span>
                      <div className="flex-1 h-px bg-amber-200" />
                    </div>
                    {businessRows.map(r => <SeatRow key={r} rowNum={r} />)}
                    <div className="my-3 border-t-2 border-dashed border-gray-200" />
                  </>
                )}

                {/* Economy class */}
                {economyRows.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6" />
                      <div className="flex-1 h-px bg-blue-200" />
                      <span className="text-xs text-blue-600 font-semibold px-2 bg-blue-50 rounded-full py-0.5">
                        Phổ thông
                      </span>
                      <div className="flex-1 h-px bg-blue-200" />
                    </div>
                    {economyRows.map(r => <SeatRow key={r} rowNum={r} />)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Summary sidebar ─────────────────────── */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 sticky top-24">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Armchair className="w-4 h-4 text-primary" />
              Tóm tắt chọn ghế
            </h3>

            {/* Flight route */}
            <div className="bg-primary/5 rounded-xl p-4">
              <div className="flex items-center justify-between text-gray-700">
                <div className="text-center">
                  <p className="text-xl font-black">{originCode}</p>
                </div>
                <Plane className="w-4 h-4 text-primary mx-2" />
                <div className="text-center">
                  <p className="text-xl font-black">{destCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{passengerCount} hành khách</span>
              </div>
            </div>

            <Separator />

            {/* Price breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Giá vé ({passengerCount} HK)</span>
                <span className="font-medium">{formatVnd(ticketTotal)}</span>
              </div>

              {seatUpgrade > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nâng hạng ghế</span>
                  <span className="font-medium text-amber-600">+{formatVnd(seatUpgrade)}</span>
                </div>
              )}
            </div>

            {/* Selected seats */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Ghế đã chọn ({selectedIds.length}/{passengerCount})
              </p>
              <AnimatePresence>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa chọn ghế nào</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map(seat => (
                      <motion.div
                        key={seat.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                          ${seat.seatClass === "Business"
                            ? "bg-amber-100 text-amber-700 border border-amber-300"
                            : "bg-blue-100 text-blue-700 border border-blue-300"}`}
                      >
                        <Armchair className="w-3 h-3" />
                        {seat.seatNumber}
                        <button
                          onClick={() => setSelectedIds(p => p.filter(id => id !== seat.id))}
                          className="ml-0.5 hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Tổng cộng</span>
              <span className="text-2xl font-black text-primary">{formatVnd(grandTotal)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-3">Đã bao gồm thuế và phí</p>

            {/* CTA */}
            <Button
              id="confirm-seats-btn"
              className="w-full gap-2 bg-primary hover:bg-primary/90"
              size="lg"
              onClick={handleContinue}
              disabled={selectedIds.length < passengerCount}
            >
              {selectedIds.length < passengerCount
                ? `Chọn thêm ${passengerCount - selectedIds.length} ghế`
                : <>Tiếp tục <ChevronRight className="w-4 h-4" /></>
              }
            </Button>

            {selectedIds.length < passengerCount && (
              <p className="text-xs text-center text-gray-400">
                Cần chọn đủ {passengerCount} ghế để tiếp tục
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
