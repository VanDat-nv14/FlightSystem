import { motion } from "framer-motion"
import { CheckCircle2, ChevronRight, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

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
  basePrice: number
  availableSeats: number
}

interface FlightCardProps {
  flight: Flight
  index: number
  passengerCount?: number
}

const AIRLINE_CONFIG: Record<string, { name: string; color: string; bg: string; textColor: string }> = {
  VN: { name: "Vietnam Airlines",  color: "#00559D", bg: "#EBF4FF", textColor: "#00559D" },
  VJ: { name: "VietJet Air",       color: "#E31837", bg: "#FFF0F2", textColor: "#E31837" },
  BL: { name: "Bamboo Airways",    color: "#00903A", bg: "#EDFAF3", textColor: "#00903A" },
  QH: { name: "Vietravel Airlines", color: "#F5A623", bg: "#FFF8EC", textColor: "#C47D00" },
  BN: { name: "Pacific Airlines",  color: "#005BAC", bg: "#EBF3FF", textColor: "#005BAC" },
  SQ: { name: "Singapore Airlines", color: "#1A1A2E", bg: "#F0F0F8", textColor: "#1A1A2E" },
}

function getAirlineCode(flightNumber: string): string {
  return flightNumber.slice(0, 2).toUpperCase()
}

export function FlightCard({ flight, index, passengerCount = 1 }: FlightCardProps) {
  const navigate = useNavigate()
  const departureDate = new Date(flight.departureTime)
  const arrivalDate   = new Date(flight.arrivalTime)
  const diffMs  = arrivalDate.getTime() - departureDate.getTime()
  const hours   = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  const airlineCode   = getAirlineCode(flight.flightNumber)
  const airlineInfo   = AIRLINE_CONFIG[airlineCode] ?? { name: "SkyBooking", color: "#6366F1", bg: "#EEF2FF", textColor: "#6366F1" }
  const seatsLeft     = flight.availableSeats

  function handleSelect() {
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

  const formatTime = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const formatDate = (d: Date) => `${d.getDate()} tháng ${d.getMonth() + 1}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.5) }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-default group overflow-hidden"
    >
      <div className="p-4 md:p-5 flex flex-col md:flex-row gap-5">
        
        {/* Left Area: Flight Details */}
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Green Badge (Optional extra feature) */}
          <div className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-medium mb-3">
            <CheckCircle2 className="w-4 h-4" />
            Có thể nâng lên thành vé linh hoạt
          </div>

          <div className="flex items-start gap-4">
            
            {/* Departure */}
            <div className="text-right w-24 shrink-0">
              <p className="text-[22px] font-bold text-gray-900 leading-none">{formatTime(departureDate)}</p>
              <p className="text-xs text-gray-500 mt-1">{flight.originCode} • {formatDate(departureDate)}</p>
            </div>

            {/* Path visualization */}
            <div className="flex-1 flex flex-col items-center justify-start pt-1 min-w-[120px] max-w-[200px]">
              <div className="flex items-center w-full">
                <div className="w-1.5 h-1.5 rounded-full border border-gray-400 bg-white z-10" />
                <div className="flex-1 h-[1px] border-t border-gray-300 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[11px] text-gray-500 font-medium tracking-wide">
                    Bay thẳng
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full border border-gray-400 bg-white z-10" />
              </div>
              <p className="text-[11px] text-gray-500 mt-2">{hours} giờ {minutes > 0 ? `${minutes} phút` : ""}</p>
            </div>

            {/* Arrival */}
            <div className="text-left w-24 shrink-0">
              <p className="text-[22px] font-bold text-gray-900 leading-none">{formatTime(arrivalDate)}</p>
              <p className="text-xs text-gray-500 mt-1">{flight.destinationCode} • {formatDate(arrivalDate)}</p>
            </div>

          </div>

          {/* Airline Line */}
          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm shrink-0"
              style={{ backgroundColor: airlineInfo.color, color: "#fff" }}
            >
              {airlineCode}
            </div>
            <div className="text-sm text-gray-700">
              {airlineInfo.name} <span className="text-gray-400 mx-1">•</span> {flight.aircraftModel}
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-[1px] bg-gray-100" />

        {/* Right Area: Price & CTA */}
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
            {seatsLeft === 0 ? "Hết chỗ" : "Xem chi tiết"}
          </Button>
          
          {seatsLeft > 0 && seatsLeft <= 10 && (
            <p className="text-xs text-red-500 text-right mt-2 font-medium">Chỉ còn {seatsLeft} ghế với giá này!</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

