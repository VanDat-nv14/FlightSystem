import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { MouseEvent } from "react"
import { CheckCircle2, Briefcase, Plane, Heart, ChevronDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { favoriteService } from "../../services/favorite.service"
import { useAuthStore } from "../../stores/useAuthStore"

export interface Flight {
  id: number
  flightNumber: string
  routeId: number
  originCode: string
  destinationCode: string
  aircraftId: number
  aircraftModel: string
  departureTime: string
  arrivalTime: string
  status: string
  stopCount: number
  stopoverCodes?: string        // "DAD" | "DAD,CXR" | null
  basePrice: number
  availableSeats: number
  airlineCode: string
  airlineName: string
  airlineLogo: string
}

interface FlightCardProps {
  flight: Flight
  index: number
  passengerCount?: number
  selectLabel?: string
  selected?: boolean
  onSelect?: (flight: Flight) => void
}

// ── Static lookup tables ────────────────────────────────────────────────────
const AIRLINE_CONFIG: Record<string, { color: string }> = {
  VN: { color: "#00559D" }, VJ: { color: "#E31837" },
  BL: { color: "#00903A" }, QH: { color: "#F5A623" },
  BN: { color: "#005BAC" }, SQ: { color: "#1A1A2E" },
  "0V": { color: "#7C3AED" },
}

const AIRPORT_NAMES: Record<string, string> = {
  SGN: "Sân bay Quốc tế Tân Sơn Nhất",
  HAN: "Sân bay Quốc tế Nội Bài",
  DAD: "Sân bay Quốc tế Đà Nẵng",
  CXR: "Sân bay Quốc tế Cam Ranh",
  VCA: "Sân bay Quốc tế Cần Thơ",
  HPH: "Sân bay Cát Bi",
  HUI: "Sân bay Phú Bài",
  PQC: "Sân bay Quốc tế Phú Quốc",
  DIN: "Sân bay Điện Biên Phủ",
  VCS: "Sân bay Côn Đảo",
  SIN: "Sân bay Quốc tế Changi",
  KUL: "Sân bay Quốc tế Kuala Lumpur",
  UIH: "Sân bay Phù Cát",
  VDH: "Sân bay Đồng Hới",
}

function airportName(code: string) {
  return AIRPORT_NAMES[code] ?? code
}

function formatDayMonth(d: Date) {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  return `${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`
}

function formatHHMM(d: Date) {
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function diffLabel(ms: number) {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? (m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`) : `${m} phút`
}

// ── Segment data computed from flight ───────────────────────────────────────
interface Segment {
  originCode: string
  destinationCode: string
  departure: Date
  arrival: Date
  airline: string
  flightNum: string
  aircraft: string
}

function buildSegments(flight: Flight): Segment[] {
  const stops = flight.stopoverCodes
    ? flight.stopoverCodes.split(",").map(s => s.trim()).filter(Boolean)
    : []

  const totalMs = new Date(flight.arrivalTime).getTime() - new Date(flight.departureTime).getTime()
  // Each stopover adds ~60 min layover; flight time is spread over segments
  const layoverMs = stops.length * 60 * 60_000
  const flyingMs  = totalMs - layoverMs
  const segCount  = stops.length + 1
  const segMs     = Math.floor(flyingMs / segCount)

  const allCodes  = [flight.originCode, ...stops, flight.destinationCode]
  const segments: Segment[] = []
  let cursor      = new Date(flight.departureTime).getTime()

  for (let i = 0; i < allCodes.length - 1; i++) {
    const dep = new Date(cursor)
    const arr = new Date(cursor + segMs)
    segments.push({
      originCode:      allCodes[i],
      destinationCode: allCodes[i + 1],
      departure:       dep,
      arrival:         arr,
      airline:         flight.airlineName,
      flightNum:       i === 0 ? flight.flightNumber : `${flight.flightNumber}-${i + 1}`,
      aircraft:        flight.aircraftModel,
    })
    cursor = arr.getTime() + 60 * 60_000 // 60 min layover
  }
  return segments
}

// ── Itinerary panel ──────────────────────────────────────────────────────────
function ItineraryPanel({ flight }: { flight: Flight }) {
  const segments = buildSegments(flight)
  const totalMs  = new Date(flight.arrivalTime).getTime() - new Date(flight.departureTime).getTime()
  const airlineColor = AIRLINE_CONFIG[flight.airlineCode]?.color ?? "#6366F1"

  return (
    <motion.div
      key="itinerary"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden border-t border-gray-100"
    >
      <div className="px-5 py-4 bg-gray-50/70">
        {/* Header */}
        <div className="mb-4">
          <p className="font-semibold text-gray-900">
            Chuyến bay đến {airportName(flight.destinationCode).replace("Sân bay ", "").replace("Quốc tế ", "").split(" ").slice(-2).join(" ")}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {flight.stopCount === 0 ? "Bay thẳng" : `${flight.stopCount} điểm dừng`} · {diffLabel(totalMs)}
          </p>
        </div>

        {segments.map((seg, idx) => {
          const segMs     = seg.arrival.getTime() - seg.departure.getTime()
          const isLast    = idx === segments.length - 1
          const layoverMs = 60 * 60_000

          return (
            <div key={idx}>
              {/* Segment */}
              <div className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center w-5 flex-shrink-0">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-white flex-shrink-0" />
                  <div className="w-0.5 bg-gray-300 flex-1 my-1" style={{ minHeight: 48 }} />
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-white flex-shrink-0" />
                </div>

                {/* Stops info */}
                <div className="flex-1 pb-1">
                  {/* Departure stop */}
                  <div>
                    <p className="text-xs text-gray-500">{formatDayMonth(seg.departure)} · {formatHHMM(seg.departure)}</p>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {seg.originCode} · {airportName(seg.originCode)}
                    </p>
                  </div>

                  {/* Spacer */}
                  <div className="h-4" />

                  {/* Arrival stop */}
                  <div>
                    <p className="text-xs text-gray-500">{formatDayMonth(seg.arrival)} · {formatHHMM(seg.arrival)}</p>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {seg.destinationCode} · {airportName(seg.destinationCode)}
                    </p>
                  </div>
                </div>

                {/* Airline detail */}
                <div className="flex items-start gap-2.5 w-48 flex-shrink-0 pt-0.5">
                  {flight.airlineLogo ? (
                    <img src={flight.airlineLogo} alt={flight.airlineName} className="w-8 h-8 object-contain rounded-md flex-shrink-0" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ backgroundColor: airlineColor }}
                    >
                      {flight.airlineCode}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 leading-relaxed">
                    <p className="font-medium text-gray-900">{seg.airline}</p>
                    <p>{seg.flightNum} · Hạng phổ thông</p>
                    <p>Thời gian bay {diffLabel(segMs)}</p>
                  </div>
                </div>
              </div>

              {/* Layover */}
              {!isLast && (
                <div className="flex items-center gap-2 my-3 ml-6">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">Quá cảnh {diffLabel(layoverMs)} tại {seg.destinationCode}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Main FlightCard ──────────────────────────────────────────────────────────
export function FlightCard({ flight, index, passengerCount = 1, selectLabel, selected = false, onSelect }: FlightCardProps) {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [showDetail, setShowDetail] = useState(false)

  const departureDate = new Date(flight.departureTime)
  const arrivalDate   = new Date(flight.arrivalTime)
  const diffMs  = arrivalDate.getTime() - departureDate.getTime()
  const hours   = Math.floor(diffMs / 3_600_000)
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000)

  const airlineCode  = flight.airlineCode
  const airlineColor = AIRLINE_CONFIG[airlineCode]?.color ?? "#6366F1"
  const seatsLeft    = flight.availableSeats

  const { data: isFavorited = false } = useQuery({
    queryKey: ["favorite-check", "Flight", flight.id],
    queryFn:  () => favoriteService.check("Flight", flight.id),
    enabled:  isAuthenticated,
  })

  const toggleFavorite = useMutation({
    mutationFn: () => favoriteService.toggle("Flight", flight.id),
    onSuccess: result => {
      queryClient.setQueryData(["favorite-check", "Flight", flight.id], result.isFavorited)
      queryClient.invalidateQueries({ queryKey: ["customer-favorites"] })
    },
  })

  function handleSelect() {
    if (onSelect) { onSelect(flight); return }
    const params = new URLSearchParams({
      flightId:       flight.id.toString(),
      passengerCount: passengerCount.toString(),
      origin:         flight.originCode,
      destination:    flight.destinationCode,
      flightNumber:   flight.flightNumber,
      basePrice:      flight.basePrice.toString(),
      departureTime:  flight.departureTime,
    })
    navigate(`/seats?${params.toString()}`)
  }

  function handleToggleFavorite(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    if (!isAuthenticated) { navigate("/login"); return }
    toggleFavorite.mutate()
  }

  const formatTime = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const formatDate = (d: Date) => `${d.getDate()} tháng ${d.getMonth() + 1}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.5) }}
      className={`relative bg-white rounded-xl shadow-sm border transition-shadow group overflow-hidden ${
        selected ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:shadow-xl hover:border-blue-200"
      }`}
    >
      {/* Favorite */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm transition hover:scale-105 ${
          isFavorited ? "border-rose-200 text-rose-600" : "border-gray-200 text-gray-400 hover:text-rose-500"
        }`}
        title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      >
        <Heart className={`h-4 w-4 ${isFavorited ? "fill-rose-600" : ""}`} />
      </button>

      {/* Main row */}
      <div className="p-4 md:p-5 flex flex-col md:flex-row gap-5">

        {/* Left: Flight details */}
        <div className="flex-1 flex flex-col justify-between">

          {/* Flexible ticket badge */}
          <div className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-medium mb-3">
            <CheckCircle2 className="w-4 h-4" />
            Có thể nâng lên thành vé linh hoạt
          </div>

          <div className="flex items-start gap-4">

            {/* Departure */}
            <div className="text-right w-24 shrink-0">
              <p className="text-[22px] font-bold text-gray-900 leading-none">{formatTime(departureDate)}</p>
              <p className="text-xs text-gray-500 mt-1">{flight.originCode} · {formatDate(departureDate)}</p>
            </div>

            {/* Path */}
            <div className="flex-1 flex flex-col items-center justify-start pt-1 min-w-[110px] max-w-[200px]">
              <div className="flex items-center w-full">
                <div className="w-1.5 h-1.5 rounded-full border border-gray-400 bg-white z-10" />
                <div className="flex-1 h-[1px] border-t border-gray-300 relative">
                  {/* Plane animation */}
                  <motion.div
                    className="absolute -top-3 left-2 text-[#006CE4] opacity-0 group-hover:opacity-100 pointer-events-none"
                    animate={{ x: [0, 100, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Plane className="h-4 w-4 rotate-45" />
                  </motion.div>

                  {/* Stop dots */}
                  {flight.stopCount === 1 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white shadow" />
                    </div>
                  )}
                  {flight.stopCount >= 2 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-white shadow" />
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-white shadow" />
                    </div>
                  )}

                  {/* Stop label */}
                  <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                    flight.stopCount === 0
                      ? "text-gray-500"
                      : flight.stopCount === 1
                        ? "bg-orange-50 text-orange-600 border border-orange-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                  }`}>
                    {flight.stopCount === 0 ? "Bay thẳng" : flight.stopCount === 1 ? "1 điểm dừng" : `${flight.stopCount} điểm dừng`}
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full border border-gray-400 bg-white z-10" />
              </div>
              <p className="text-[11px] text-gray-500 mt-6">
                {hours} giờ{minutes > 0 ? ` ${minutes} phút` : ""}
              </p>
            </div>

            {/* Arrival */}
            <div className="text-left w-24 shrink-0">
              <p className="text-[22px] font-bold text-gray-900 leading-none">{formatTime(arrivalDate)}</p>
              <p className="text-xs text-gray-500 mt-1">{flight.destinationCode} · {formatDate(arrivalDate)}</p>
            </div>
          </div>

          {/* Airline + detail toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              {flight.airlineLogo ? (
                <img src={flight.airlineLogo} alt={flight.airlineName} className="w-8 h-8 object-contain rounded-lg shadow-sm shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm shrink-0"
                  style={{ backgroundColor: airlineColor, color: "#fff" }}
                >
                  {airlineCode}
                </div>
              )}
              <span className="text-sm text-gray-700">
                {flight.airlineName} <span className="text-gray-400 mx-1">·</span> {flight.aircraftModel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowDetail(v => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {showDetail ? "Ẩn lịch trình" : "Chi tiết lịch trình"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetail ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-[1px] bg-gray-100" />

        {/* Right: Price & CTA */}
        <div className="w-full md:w-56 shrink-0 flex flex-col justify-end border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
          <div className="flex items-center justify-end gap-2 text-gray-500 text-xs mb-3">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span>Hành lý xách tay</span>
          </div>

          <div className="text-right mb-3">
            <p className="text-[22px] font-bold text-gray-900">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(flight.basePrice)}
            </p>
          </div>

          <Button
            id={`select-flight-${flight.id}`}
            className="w-full bg-[#006CE4] hover:bg-[#0057B8] text-white py-6 text-[15px] font-semibold"
            onClick={handleSelect}
            disabled={seatsLeft === 0}
          >
            {seatsLeft === 0 ? "Hết chỗ" : selected ? "Đã chọn" : selectLabel || "Xem chi tiết"}
          </Button>

          {seatsLeft > 0 && seatsLeft <= 10 && (
            <p className="text-xs text-red-500 text-right mt-2 font-medium">Chỉ còn {seatsLeft} ghế với giá này!</p>
          )}
        </div>
      </div>

      {/* Expandable itinerary */}
      <AnimatePresence>
        {showDetail && <ItineraryPanel flight={flight} />}
      </AnimatePresence>
    </motion.div>
  )
}
