import { motion } from "framer-motion"
import { Plane, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

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
}

export function FlightCard({ flight, index }: FlightCardProps) {
  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);
  const diffMs = arrivalDate.getTime() - departureDate.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationStr = `${hours}h ${minutes}m`;

  const getAirlineName = (flightNumber: string) => {
    if (flightNumber.startsWith("VN")) return "Vietnam Airlines";
    if (flightNumber.startsWith("VJ")) return "VietJet Air";
    if (flightNumber.startsWith("QH")) return "Bamboo Airways";
    return "SkyBooking Airlines";
  };

  const airlineName = getAirlineName(flight.flightNumber);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-card text-card-foreground rounded-xl shadow-sm border p-6 flex flex-col md:flex-row items-center gap-6"
    >
      <div className="flex items-center gap-4 w-full md:w-1/4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
          {airlineName.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{airlineName}</p>
          <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-8 w-full md:w-auto">
        <div className="text-right">
          <p className="text-2xl font-bold">{departureDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
          <p className="text-sm text-muted-foreground">{flight.originCode}</p>
        </div>

        <div className="flex flex-col items-center px-4 w-32">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {durationStr}
          </p>
          <div className="w-full relative flex items-center justify-center">
            <div className="h-[2px] w-full bg-border absolute"></div>
            <Plane className="w-5 h-5 text-primary relative z-10 bg-card px-1" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Bay thẳng</p>
        </div>

        <div className="text-left">
          <p className="text-2xl font-bold">{arrivalDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
          <p className="text-sm text-muted-foreground">{flight.destinationCode}</p>
        </div>
      </div>

      <div className="w-full md:w-1/4 flex flex-col items-end gap-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
        <p className="text-2xl font-bold text-primary">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(flight.basePrice)}
        </p>
        <Button className="w-full md:w-auto">Chọn chuyến</Button>
      </div>
    </motion.div>
  )
}
