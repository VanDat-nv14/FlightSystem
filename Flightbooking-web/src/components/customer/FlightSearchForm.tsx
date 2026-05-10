import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Users } from "lucide-react"
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
  const [tripType, setTripType] = useState("round-trip")
  const [originId, setOriginId] = useState("")
  const [destinationId, setDestinationId] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [passengerCount, setPassengerCount] = useState("1")

  const { data: airports = [], isLoading } = useQuery({
    queryKey: ["airports"],
    queryFn: airportService.getAll
  })

  function handleSearch() {
    if (!originId || !destinationId || !departureDate) {
      alert("Vui lòng chọn điểm đi, điểm đến và ngày khởi hành.")
      return
    }
    if (originId === destinationId) {
      alert("Điểm đi và điểm đến không được trùng nhau.")
      return
    }

    const params = new URLSearchParams({
      originAirportId: originId,
      destinationAirportId: destinationId,
      departureDate: departureDate,
      passengerCount: passengerCount
    })

    if (tripType === "round-trip" && returnDate) {
      params.append("returnDate", returnDate)
    }

    navigate(`/flights?${params.toString()}`)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card text-card-foreground rounded-2xl shadow-xl border p-6 md:p-8 w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col space-y-6">
        <RadioGroup 
          value={tripType} 
          onValueChange={setTripType}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="round-trip" id="round-trip" />
            <Label htmlFor="round-trip">Khứ hồi</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="one-way" id="one-way" />
            <Label htmlFor="one-way">Một chiều</Label>
          </div>
        </RadioGroup>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Điểm đi */}
          <div className="space-y-2">
            <Label>Điểm khởi hành</Label>
            <Select value={originId} onValueChange={setOriginId} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn điểm đi"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {airports.map(a => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.city} ({a.code}) - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Điểm đến */}
          <div className="space-y-2">
            <Label>Điểm đến</Label>
            <Select value={destinationId} onValueChange={setDestinationId} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder={isLoading ? "Đang tải..." : "Chọn điểm đến"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {airports.map(a => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.city} ({a.code}) - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ngày đi / Ngày về */}
          <div className="space-y-2 md:col-span-1">
            <Label>Ngày đi {tripType === 'round-trip' ? '- Ngày về' : ''}</Label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  className="pl-9" 
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                />
              </div>
              {tripType === 'round-trip' && (
                <div className="relative flex-1">
                  <Input 
                    type="date" 
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Hành khách */}
          <div className="space-y-2">
            <Label>Hành khách</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                type="number" 
                min="1" max="9"
                className="pl-9" 
                value={passengerCount}
                onChange={e => setPassengerCount(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button size="lg" className="w-full md:w-auto px-8 gap-2" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Tìm chuyến bay
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
