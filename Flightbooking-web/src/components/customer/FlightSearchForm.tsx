import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Users, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { airportService } from "../../services/airport.service"

export function FlightSearchForm() {
  const navigate = useNavigate()
  const [tripType, setTripType] = useState("one-way")
  const [originId, setOriginId] = useState("")
  const [destinationId, setDestinationId] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [passengerCount, setPassengerCount] = useState("1")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const today = new Date().toISOString().split("T")[0]

  const { data: airports = [], isLoading } = useQuery({
    queryKey: ["airports"],
    queryFn: airportService.getAll
  })

  function swapAirports() {
    const tmp = originId
    setOriginId(destinationId)
    setDestinationId(tmp)
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!originId) newErrors.origin = "Vui lòng chọn điểm khởi hành"
    if (!destinationId) newErrors.destination = "Vui lòng chọn điểm đến"
    if (originId && destinationId && originId === destinationId)
      newErrors.destination = "Điểm đến không được trùng với điểm khởi hành"
    if (!departureDate) newErrors.departureDate = "Vui lòng chọn ngày đi"
    if (departureDate < today) newErrors.departureDate = "Ngày đi không được là ngày trong quá khứ"
    if (tripType === "round-trip") {
      if (!returnDate) newErrors.returnDate = "Vui lòng chọn ngày về"
      else if (returnDate <= departureDate) newErrors.returnDate = "Ngày về phải sau ngày đi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSearch() {
    if (!validate()) return

    const params = new URLSearchParams({
      originAirportId: originId,
      destinationAirportId: destinationId,
      departureDate,
      passengerCount
    })
    if (tripType === "round-trip" && returnDate) params.append("returnDate", returnDate)
    navigate(`/flights?${params.toString()}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 backdrop-blur-md text-card-foreground rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8 w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col space-y-5">
        {/* Trip type */}
        <RadioGroup value={tripType} onValueChange={v => { setTripType(v); setErrors({}) }} className="flex gap-6">
          {[{ value: "one-way", label: "Một chiều" }, { value: "round-trip", label: "Khứ hồi" }].map(opt => (
            <div key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value={opt.value} id={opt.value} />
              <Label htmlFor={opt.value} className="cursor-pointer font-medium">{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>

        {/* Main inputs */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-3 items-start">
          {/* Điểm đi */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Điểm khởi hành</Label>
            <Select value={originId} onValueChange={v => { setOriginId(v); setErrors(e => ({ ...e, origin: "", destination: "" })) }} disabled={isLoading}>
              <SelectTrigger id="origin-airport" className={`h-12 ${errors.origin ? "border-red-500" : ""}`}>
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn sân bay"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {airports.map(a => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    <span className="font-bold mr-1">{a.code}</span> — {a.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.origin && <p className="text-xs text-red-500">{errors.origin}</p>}
          </div>

          {/* Swap button */}
          <div className="flex items-end pb-1 justify-center">
            <button
              onClick={swapAirports}
              className="w-10 h-10 rounded-full border-2 border-primary/30 hover:border-primary bg-white hover:bg-primary/5 flex items-center justify-center transition-all group mt-5"
              title="Đổi chiều"
            >
              <ArrowLeftRight className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
            </button>
          </div>

          {/* Điểm đến */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Điểm đến</Label>
            <Select value={destinationId} onValueChange={v => { setDestinationId(v); setErrors(e => ({ ...e, destination: "" })) }} disabled={isLoading}>
              <SelectTrigger id="destination-airport" className={`h-12 ${errors.destination ? "border-red-500" : ""}`}>
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn sân bay"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {airports.map(a => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    <span className="font-bold mr-1">{a.code}</span> — {a.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destination && <p className="text-xs text-red-500">{errors.destination}</p>}
          </div>

          {/* Ngày đi */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Ngày đi</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-primary pointer-events-none" />
              <Input
                id="departure-date"
                type="date"
                className={`h-12 pl-9 ${errors.departureDate ? "border-red-500" : ""}`}
                value={departureDate}
                min={today}
                onChange={e => {
                  setDepartureDate(e.target.value)
                  // Nếu ngày về nhỏ hơn ngày đi mới, xóa ngày về
                  if (returnDate && returnDate <= e.target.value) setReturnDate("")
                  setErrors(err => ({ ...err, departureDate: "" }))
                }}
              />
            </div>
            {errors.departureDate && <p className="text-xs text-red-500">{errors.departureDate}</p>}
          </div>

          {/* Ngày về (only round-trip) */}
          {tripType === "round-trip" ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Ngày về</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-primary pointer-events-none" />
                <Input
                  id="return-date"
                  type="date"
                  className={`h-12 pl-9 ${errors.returnDate ? "border-red-500" : ""}`}
                  value={returnDate}
                  min={departureDate || today}
                  onChange={e => { setReturnDate(e.target.value); setErrors(err => ({ ...err, returnDate: "" })) }}
                />
              </div>
              {errors.returnDate && <p className="text-xs text-red-500">{errors.returnDate}</p>}
            </div>
          ) : (
            /* Hành khách khi 1 chiều */
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Hành khách</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3.5 h-4 w-4 text-primary pointer-events-none" />
                <Input
                  id="passenger-count"
                  type="number" min="1" max="9"
                  className="h-12 pl-9"
                  value={passengerCount}
                  onChange={e => setPassengerCount(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hành khách riêng khi khứ hồi */}
        {tripType === "round-trip" && (
          <div className="w-40 space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Hành khách</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3.5 h-4 w-4 text-primary pointer-events-none" />
              <Input
                id="passenger-count-roundtrip"
                type="number" min="1" max="9"
                className="h-12 pl-9"
                value={passengerCount}
                onChange={e => setPassengerCount(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Search button */}
        <div className="flex justify-end">
          <Button id="search-flights-btn" size="lg" className="px-10 h-12 gap-2 bg-primary hover:bg-primary/90 shadow-lg" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Tìm chuyến bay
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
