import { FlightCard } from "../../components/customer/FlightCard"
import { FlightSearchForm } from "../../components/customer/FlightSearchForm"
import { FlightSearchLoading } from "../../components/customer/FlightSearchLoading"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { flightService, type Flight } from "../../services/flight.service"
import { airlineService } from "../../services/airline.service"
import { useState, useMemo, useEffect } from "react"
import { Plane } from "lucide-react"
import { PaginationControl } from "@/components/ui/pagination-control"


const TIME_RANGES = [
  { id: "00-06", label: "00:00–05:59", min: 0, max: 6 },
  { id: "06-12", label: "06:00–11:59", min: 6, max: 12 },
  { id: "12-18", label: "12:00–17:59", min: 12, max: 18 },
  { id: "18-24", label: "18:00–23:59", min: 18, max: 24 },
]

const STOP_OPTIONS = [
  { id: "all", label: "Bất kỳ", desc: "Tất cả hành trình" },
  { id: "direct", label: "Bay thẳng", desc: "Không dừng" },
  { id: "one", label: "1 điểm dừng", desc: "Nối chuyến ngắn" },
  { id: "multi", label: "2+ điểm dừng", desc: "Nhiều chặng" },
] as const

type StopFilter = typeof STOP_OPTIONS[number]["id"]

function getStopCount(flight: Flight) {
  const raw = flight as Flight & { stopCount?: number; stops?: unknown[]; segments?: unknown[]; stopoverAirports?: unknown[] }
  if (typeof raw.stopCount === "number") return raw.stopCount
  if (Array.isArray(raw.stops)) return raw.stops.length
  if (Array.isArray(raw.stopoverAirports)) return raw.stopoverAirports.length
  if (Array.isArray(raw.segments)) return Math.max(0, raw.segments.length - 1)
  return 0
}

function stopMatches(flight: Flight, filter: StopFilter) {
  const stops = getStopCount(flight)
  if (filter === "all") return true
  if (filter === "direct") return stops === 0
  if (filter === "one") return stops === 1
  return stops >= 2
}

export default function FlightListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const originAirportId      = Number(searchParams.get("originAirportId")) || 0
  const destinationAirportId = Number(searchParams.get("destinationAirportId")) || 0
  const departureDate        = searchParams.get("departureDate") || ""
  const returnDate           = searchParams.get("returnDate") || ""
  const passengerCount       = Number(searchParams.get("passengerCount")) || 1

  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [selectedTimeRanges, setSelectedTimeRanges] = useState<string[]>([])
  const [selectedReturnTimeRanges, setSelectedReturnTimeRanges] = useState<string[]>([])
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<Flight | null>(null)
  const [stopFilter, setStopFilter] = useState<StopFilter>("all")
  const [sortBy, setSortBy] = useState<"best" | "cheapest" | "fastest">("best")

  const [currentPageOutbound, setCurrentPageOutbound] = useState(1)
  const [currentPageReturn, setCurrentPageReturn] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPageOutbound(1)
    setCurrentPageReturn(1)
  }, [selectedAirlines, selectedTimeRanges, selectedReturnTimeRanges, stopFilter, sortBy])

  const hasSearchParams = originAirportId > 0 && destinationAirportId > 0 && !!departureDate;
  const isRoundTrip = hasSearchParams && !!returnDate

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

  const { data: returnFlights = [], isLoading: isReturnLoading, error: returnError } = useQuery({
    queryKey: ["return-flights", originAirportId, destinationAirportId, returnDate, passengerCount, isRoundTrip],
    queryFn: () => flightService.search({
      originAirportId: destinationAirportId,
      destinationAirportId: originAirportId,
      departureDate: returnDate,
      passengerCount,
    }),
    enabled: isRoundTrip,
  })

  const { data: airlines = [] } = useQuery({
    queryKey: ["airlines"],
    queryFn: airlineService.getAll,
  })

  const filterCounts = useMemo(() => {
    const airlinesCount: Record<string, number> = {}
    const times: Record<string, number> = {}
    const stops: Record<StopFilter, number> = { all: flights.length, direct: 0, one: 0, multi: 0 }
    
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

      const stopCount = getStopCount(f)
      if (stopCount === 0) stops.direct++
      else if (stopCount === 1) stops.one++
      else stops.multi++
    })

    return { airlines: airlinesCount, times, stops }
  }, [flights])

  function toggleAirline(code: string) {
    setSelectedAirlines(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  function toggleTimeRange(id: string) {
    setSelectedTimeRanges(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  function toggleReturnTimeRange(id: string) {
    setSelectedReturnTimeRanges(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  function countTimes(source: Flight[]) {
    const times: Record<string, number> = {}
    TIME_RANGES.forEach(r => times[r.id] = 0)
    source.forEach(f => {
      const hour = new Date(f.departureTime).getHours()
      if (hour >= 0 && hour < 6) times["00-06"]++
      else if (hour >= 6 && hour < 12) times["06-12"]++
      else if (hour >= 12 && hour < 18) times["12-18"]++
      else times["18-24"]++
    })
    return times
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

    // 3. Filter by stop count
    if (stopFilter !== "all") {
      result = result.filter(f => stopMatches(f, stopFilter))
    }

    // 4. Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "cheapest") return a.basePrice - b.basePrice
      
      const durationA = new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime()
      const durationB = new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime()
      
      if (sortBy === "fastest") return durationA - durationB
      
      // "best": balance between price and duration (for now just sort by time)
      return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    })

    return result
  }, [flights, selectedAirlines, selectedTimeRanges, stopFilter, sortBy])

  const filteredReturnFlights: Flight[] = useMemo(() => {
    let result = returnFlights
    if (selectedAirlines.length > 0) {
      result = result.filter(f => selectedAirlines.includes(f.airlineCode))
    }
    if (selectedReturnTimeRanges.length > 0) {
      result = result.filter(f => {
        const hour = new Date(f.departureTime).getHours()
        return selectedReturnTimeRanges.some(id => {
          const range = TIME_RANGES.find(r => r.id === id)
          return range && hour >= range.min && hour < range.max
        })
      })
    }
    if (stopFilter !== "all") {
      result = result.filter(f => stopMatches(f, stopFilter))
    }
    return [...result].sort((a, b) => {
      if (sortBy === "cheapest") return a.basePrice - b.basePrice

      const durationA = new Date(a.arrivalTime).getTime() - new Date(a.departureTime).getTime()
      const durationB = new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime()

      if (sortBy === "fastest") return durationA - durationB

    return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    })
  }, [returnFlights, selectedAirlines, selectedReturnTimeRanges, stopFilter, sortBy])

  const totalPagesOutbound = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginatedOutbound = filteredAndSorted.slice((currentPageOutbound - 1) * itemsPerPage, currentPageOutbound * itemsPerPage)

  const totalPagesReturn = Math.ceil(filteredReturnFlights.length / itemsPerPage)
  const paginatedReturn = filteredReturnFlights.slice((currentPageReturn - 1) * itemsPerPage, currentPageReturn * itemsPerPage)

  const returnTimeCounts = useMemo(() => countTimes(returnFlights), [returnFlights])

  function selectOutbound(flight: Flight) {
    setSelectedOutboundFlight(flight)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function selectReturn(returnFlight: Flight) {
    if (!selectedOutboundFlight) return
    const params = new URLSearchParams({
      flightId: selectedOutboundFlight.id.toString(),
      returnFlightId: returnFlight.id.toString(),
      passengerCount: passengerCount.toString(),
      origin: selectedOutboundFlight.originCode,
      destination: selectedOutboundFlight.destinationCode,
      flightNumber: selectedOutboundFlight.flightNumber,
      returnFlightNumber: returnFlight.flightNumber,
      basePrice: selectedOutboundFlight.basePrice.toString(),
      returnBasePrice: returnFlight.basePrice.toString(),
      departureTime: selectedOutboundFlight.departureTime,
      returnDepartureTime: returnFlight.departureTime,
      tripType: "round-trip",
    })
    navigate(`/seats?${params.toString()}`)
  }

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
              <div className="space-y-2">
                {STOP_OPTIONS.map(option => {
                  const active = stopFilter === option.id
                  const count = filterCounts.stops[option.id]
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStopFilter(option.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-[#006CE4] bg-blue-50 text-[#006CE4]"
                          : "border-gray-100 bg-white text-gray-700 hover:border-blue-100 hover:bg-blue-50/40"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`h-5 w-5 rounded-full border flex items-center justify-center ${active ? "border-[#006CE4]" : "border-gray-300"}`}>
                          {active && <span className="h-2.5 w-2.5 rounded-full bg-[#006CE4]" />}
                        </span>
                        <span>
                          <span className="block text-[14px] font-semibold">{option.label}</span>
                          <span className={`block text-[12px] ${active ? "text-blue-500" : "text-gray-400"}`}>{option.desc}</span>
                        </span>
                      </span>
                      <span className="text-[13px] font-semibold text-gray-500">{count}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Nối chuyến 1-3h", "Cùng hãng", "Qua hub lớn"].map(label => (
                  <span key={label} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                    {label}
                  </span>
                ))}
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

            {isRoundTrip && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">Giờ bay (Chuyến về)</h3>
                  <p className="text-[13px] text-gray-600 font-medium">Khởi hành từ điểm đến</p>
                  <div className="space-y-3">
                    {TIME_RANGES.map(range => (
                      <div key={range.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id={`return-time-${range.id}`}
                            className="w-5 h-5 rounded-sm border-gray-300 data-[state=checked]:bg-[#006CE4] data-[state=checked]:border-[#006CE4]"
                            checked={selectedReturnTimeRanges.includes(range.id)}
                            onCheckedChange={() => toggleReturnTimeRange(range.id)}
                          />
                          <Label htmlFor={`return-time-${range.id}`} className="cursor-pointer text-[14px] text-gray-700 font-normal">
                            {range.label}
                          </Label>
                        </div>
                        <span className="text-[13px] text-gray-500">{returnTimeCounts[range.id]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
          {isLoading && <FlightSearchLoading />}
          {isRoundTrip && isReturnLoading && <FlightSearchLoading />}

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
            {isRoundTrip ? (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h2 className="text-lg font-bold text-gray-900">Chuyến đi</h2>
                  <p className="text-sm text-gray-500">Chọn chuyến bay chiều đi trước, sau đó chọn chuyến về.</p>
                </div>
                {paginatedOutbound.map((flight, i) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    index={i}
                    passengerCount={passengerCount}
                    selectLabel="Chọn chuyến đi"
                    selected={selectedOutboundFlight?.id === flight.id}
                    onSelect={selectOutbound}
                  />
                ))}
                
                {totalPagesOutbound > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4 pb-4">
                    <PaginationControl currentPage={currentPageOutbound} totalPages={totalPagesOutbound} onPageChange={setCurrentPageOutbound} />
                  </div>
                )}

                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
                  <h2 className="text-lg font-bold text-gray-900">Chuyến về</h2>
                  <p className="text-sm text-gray-500">
                    {selectedOutboundFlight ? "Chọn chuyến bay ngược chiều để tiếp tục." : "Hãy chọn chuyến đi trước."}
                  </p>
                </div>
                {returnError && (
                  <div className="bg-red-50 text-red-600 rounded-xl border border-red-100 p-8 text-center">
                    Có lỗi xảy ra khi tải chuyến về.
                  </div>
                )}
                {selectedOutboundFlight && !isReturnLoading && paginatedReturn.map((flight, i) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    index={i}
                    passengerCount={passengerCount}
                    selectLabel="Chọn chuyến về"
                    onSelect={selectReturn}
                  />
                ))}
                {selectedOutboundFlight && !isReturnLoading && totalPagesReturn > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4 pb-4">
                    <PaginationControl currentPage={currentPageReturn} totalPages={totalPagesReturn} onPageChange={setCurrentPageReturn} />
                  </div>
                )}
                {selectedOutboundFlight && !isReturnLoading && returnFlights.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
                    <p className="font-medium text-gray-900">Không tìm thấy chuyến về ngược chiều.</p>
                  </div>
                )}
                {selectedOutboundFlight && !isReturnLoading && returnFlights.length > 0 && filteredReturnFlights.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
                    <p className="font-medium text-gray-900">KhÃ´ng cÃ³ chuyáº¿n vá» nÃ o khá»›p vá»›i bá»™ lá»c.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {paginatedOutbound.map((flight, i) => (
                  <FlightCard key={flight.id} flight={flight} index={i} passengerCount={passengerCount} />
                ))}
                {totalPagesOutbound > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4 pb-4">
                    <PaginationControl currentPage={currentPageOutbound} totalPages={totalPagesOutbound} onPageChange={setCurrentPageOutbound} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Filtered empty state (Filters are too strict) */}
          {!isLoading && !error && flights.length > 0 && filteredAndSorted.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
              <p className="font-medium text-gray-900 mb-1">Không có chuyến bay nào khớp với bộ lọc.</p>
              <p className="text-gray-500 text-[14px] mb-4">Vui lòng xóa bớt bộ lọc để xem thêm kết quả.</p>
              <button 
                onClick={() => { setSelectedAirlines([]); setSelectedTimeRanges([]); setSelectedReturnTimeRanges([]); setStopFilter("all") }}
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
