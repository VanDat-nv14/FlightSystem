import { FlightCard } from "../../components/customer/FlightCard"
import { FlightSearchForm } from "../../components/customer/FlightSearchForm"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "../../components/ui/skeleton"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { flightService, type Flight } from "../../services/flight.service"
import { airlineService } from "../../services/airline.service"
import { useState, useMemo } from "react"
import { Plane } from "lucide-react"


const TIME_RANGES = [
  { id: "00-06", label: "00:00–05:59", min: 0, max: 6 },
  { id: "06-12", label: "06:00–11:59", min: 6, max: 12 },
  { id: "12-18", label: "12:00–17:59", min: 12, max: 18 },
  { id: "18-24", label: "18:00–23:59", min: 18, max: 24 },
]

export default function FlightListPage() {
  const [searchParams] = useSearchParams()
  const originAirportId      = Number(searchParams.get("originAirportId")) || 0
  const destinationAirportId = Number(searchParams.get("destinationAirportId")) || 0
  const departureDate        = searchParams.get("departureDate") || ""
  const passengerCount       = Number(searchParams.get("passengerCount")) || 1

  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [selectedTimeRanges, setSelectedTimeRanges] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"best" | "cheapest" | "fastest">("best")

  const hasSearchParams = originAirportId > 0 && destinationAirportId > 0 && !!departureDate;

  const { data: flights = [], isLoading, error } = useQuery({
    queryKey: ["flights", originAirportId, destinationAirportId, departureDate, passengerCount, hasSearchParams],
    queryFn: () => {
      if (hasSearchParams) {
        return flightService.search({ 
          originAirportId, 
          destinationAirportId, 
          departureDate, 
          passengerCount 
        });
      }
      return flightService.getAll();
    },
  })

  const { data: airlines = [] } = useQuery({
    queryKey: ["airlines"],
    queryFn: airlineService.getAll,
  })

  const filterCounts = useMemo(() => {
    const airlinesCount: Record<string, number> = {}
    const times: Record<string, number> = {}
    
    TIME_RANGES.forEach(r => times[r.id] = 0)

    flights.forEach(f => {
      // Airline count
      const code = f.airlineCode
      airlinesCount[code] = (airlinesCount[code] || 0) + 1

      // Time count
      const hour = new Date(f.departureTime).getHours()
      if (hour >= 0 && hour < 6) times["00-06"]++
      else if (hour >= 6 && hour < 12) times["06-12"]++
      else if (hour >= 12 && hour < 18) times["12-18"]++
      else times["18-24"]++
    })

    return { airlines: airlinesCount, times }
  }, [flights])

  function toggleAirline(code: string) {
    setSelectedAirlines(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  function toggleTimeRange(id: string) {
    setSelectedTimeRanges(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const filteredAndSorted: Flight[] = useMemo(() => {
    let result = flights

    // 1. Filter by Airline
    if (selectedAirlines.length > 0) {
      result = result.filter(f => selectedAirlines.includes(f.airlineCode))
    }

    // 2. Filter by Time Range
    if (selectedTimeRanges.length > 0) {
      result = result.filter(f => {
        const hour = new Date(f.departureTime).getHours()
        return selectedTimeRanges.some(id => {
          const range = TIME_RANGES.find(r => r.id === id)
          return range && hour >= range.min && hour < range.max
        })
      })
    }

    // 3. Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "cheapest") return a.basePrice - b.basePrice
      
      const durationA = new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime()
      const durationB = new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime()
      
      if (sortBy === "fastest") return durationA - durationB
      
      // "best": balance between price and duration (for now just sort by time)
      return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    })

    return result
  }, [flights, selectedAirlines, selectedTimeRanges, sortBy])

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-12">
      {/* Blue Header Background */}
      <div className="bg-[#003B95] text-white pt-8 pb-32 px-4 md:px-8">
        <div className="container max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Tìm chuyến bay</h1>
        </div>
      </div>

      {/* Search Form Overlay */}
      <div className="container max-w-6xl mx-auto px-4 -mt-24 mb-8">
        <FlightSearchForm />
      </div>

      <div className="container max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT SIDEBAR (Filters) */}
        <aside className="w-full lg:w-[280px] shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Bộ lọc</h2>
              <p className="text-sm text-gray-500">Hiển thị {filteredAndSorted.length} kết quả</p>
            </div>

            <Separator />

            {/* Stops */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Điểm dừng</h3>
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full border-[5px] border-[#006CE4] bg-white" />
                  <span className="text-[14px] text-gray-700 font-medium">Bất kỳ</span>
                </div>
                <span className="text-[13px] text-gray-500">{flights.length}</span>
              </div>
              <div className="flex items-center justify-between group cursor-not-allowed opacity-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full border border-gray-300" />
                  <span className="text-[14px] text-gray-700">Bay trực tiếp</span>
                </div>
                <span className="text-[13px] text-gray-500">{flights.length}</span>
              </div>
            </div>

            <Separator />

            {/* Airlines */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Hãng hàng không</h3>
              {airlines.length === 0 ? (
                <p className="text-[13px] text-gray-400">Không có dữ liệu</p>
              ) : (
                airlines.map(airline => (
                  <div key={airline.code} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id={`airline-${airline.code}`}
                        className="w-5 h-5 rounded-sm border-gray-300 data-[state=checked]:bg-[#006CE4] data-[state=checked]:border-[#006CE4]"
                        checked={selectedAirlines.includes(airline.code)}
                        onCheckedChange={() => toggleAirline(airline.code)}
                      />
                      <Label htmlFor={`airline-${airline.code}`} className="cursor-pointer text-[14px] text-gray-700 font-normal">
                        {airline.name}
                      </Label>
                    </div>
                    <span className="text-[13px] text-gray-500">{filterCounts.airlines[airline.code] || 0}</span>
                  </div>
                ))
              )}
            </div>

            <Separator />

            {/* Departure Time */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900">Giờ bay (Chuyến đi)</h3>
              <p className="text-[13px] text-gray-600 font-medium">Khởi hành từ sân bay</p>
              <div className="space-y-3">
                {TIME_RANGES.map(range => (
                  <div key={range.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id={`time-${range.id}`}
                        className="w-5 h-5 rounded-sm border-gray-300 data-[state=checked]:bg-[#006CE4] data-[state=checked]:border-[#006CE4]"
                        checked={selectedTimeRanges.includes(range.id)}
                        onCheckedChange={() => toggleTimeRange(range.id)}
                      />
                      <Label htmlFor={`time-${range.id}`} className="cursor-pointer text-[14px] text-gray-700 font-normal">
                        {range.label}
                      </Label>
                    </div>
                    <span className="text-[13px] text-gray-500">{filterCounts.times[range.id]}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* RIGHT AREA (Sort Tabs & Flight Cards) */}
        <div className="flex-1 space-y-4">
          
          {/* Sort Tabs */}
          {flights.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex">
              <button 
                onClick={() => setSortBy("best")}
                className={`flex-1 flex flex-col items-center justify-center py-3 border-b-2 transition-colors ${sortBy === "best" ? "border-[#006CE4] text-[#006CE4] bg-blue-50/30" : "border-transparent text-gray-600 hover:bg-gray-50"}`}
              >
                <span className="font-bold text-[15px]">Tốt nhất</span>
              </button>
              <div className="w-[1px] bg-gray-200" />
              <button 
                onClick={() => setSortBy("cheapest")}
                className={`flex-1 flex flex-col items-center justify-center py-3 border-b-2 transition-colors ${sortBy === "cheapest" ? "border-[#006CE4] text-[#006CE4] bg-blue-50/30" : "border-transparent text-gray-600 hover:bg-gray-50"}`}
              >
                <span className="font-bold text-[15px]">Rẻ nhất</span>
              </button>
              <div className="w-[1px] bg-gray-200" />
              <button 
                onClick={() => setSortBy("fastest")}
                className={`flex-1 flex flex-col items-center justify-center py-3 border-b-2 transition-colors ${sortBy === "fastest" ? "border-[#006CE4] text-[#006CE4] bg-blue-50/30" : "border-transparent text-gray-600 hover:bg-gray-50"}`}
              >
                <span className="font-bold text-[15px]">Nhanh nhất</span>
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex gap-4">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-12 w-32 rounded-lg" />
              </div>
            </div>
          ))}

          {/* Error state */}
          {!isLoading && error && (
            <div className="bg-red-50 text-red-600 rounded-xl border border-red-100 p-8 text-center">
              <p className="font-medium">Có lỗi xảy ra khi tải chuyến bay.</p>
              <p className="text-sm mt-1 text-red-400">Vui lòng thử lại sau.</p>
            </div>
          )}

          {/* Empty state (No flights at all) */}
          {!isLoading && !error && flights.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
              <Plane className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-bold text-gray-900 text-lg">Không tìm thấy chuyến bay</p>
              <p className="text-gray-500 text-[15px] mt-2">Vui lòng thử tìm kiếm với ngày khác hoặc chặng bay khác.</p>
            </div>
          )}

          {/* Flight cards */}
          <div className="space-y-4">
            {filteredAndSorted.map((flight, i) => (
              <FlightCard key={flight.id} flight={flight} index={i} passengerCount={passengerCount} />
            ))}
          </div>

          {/* Filtered empty state (Filters are too strict) */}
          {!isLoading && !error && flights.length > 0 && filteredAndSorted.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
              <p className="font-medium text-gray-900 mb-1">Không có chuyến bay nào khớp với bộ lọc.</p>
              <p className="text-gray-500 text-[14px] mb-4">Vui lòng xóa bớt bộ lọc để xem thêm kết quả.</p>
              <button 
                onClick={() => { setSelectedAirlines([]); setSelectedTimeRanges([]) }}
                className="text-[#006CE4] hover:underline font-semibold text-[15px]"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
