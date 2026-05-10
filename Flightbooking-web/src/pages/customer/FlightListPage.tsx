import { FlightCard } from "../../components/customer/FlightCard"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { flightService } from "../../services/flight.service"

export default function FlightListPage() {
  const [searchParams] = useSearchParams()
  
  const originAirportId = Number(searchParams.get("originAirportId")) || 0
  const destinationAirportId = Number(searchParams.get("destinationAirportId")) || 0
  const departureDate = searchParams.get("departureDate") || ""
  const passengerCount = Number(searchParams.get("passengerCount")) || 1

  const { data: flights = [], isLoading, error } = useQuery({
    queryKey: ["flights", originAirportId, destinationAirportId, departureDate, passengerCount],
    queryFn: () => flightService.search({ originAirportId, destinationAirportId, departureDate, passengerCount }),
    enabled: originAirportId > 0 && destinationAirportId > 0 && !!departureDate
  })

  return (
    <div className="container px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 shrink-0 space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">Hãng hàng không</h3>
          <div className="space-y-3">
            {["Vietnam Airlines", "VietJet Air", "Bamboo Airways"].map((airline) => (
              <div key={airline} className="flex items-center space-x-2">
                <Checkbox id={airline} defaultChecked />
                <Label htmlFor={airline}>{airline}</Label>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold text-lg mb-4">Hạng ghế</h3>
          <div className="space-y-3">
            {["Phổ thông", "Thương gia", "Hạng nhất"].map((cls) => (
              <div key={cls} className="flex items-center space-x-2">
                <Checkbox id={cls} defaultChecked={cls === "Phổ thông"} />
                <Label htmlFor={cls}>{cls}</Label>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Flight Results */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Kết quả tìm kiếm chuyến bay
          </h2>
          <p className="text-muted-foreground">{flights.length} kết quả</p>
        </div>
        
        {isLoading && (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
            Có lỗi xảy ra khi tải chuyến bay. Vui lòng thử lại.
          </div>
        )}

        {!isLoading && !error && flights.length === 0 && (
           <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
            Không tìm thấy chuyến bay nào phù hợp với yêu cầu của bạn.
          </div>
        )}

        <div className="space-y-4">
          {flights.map((flight, index) => (
            <FlightCard key={flight.id} flight={flight} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
