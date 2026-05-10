import { useState, useMemo } from "react"
import { SeatMap } from "../../components/customer/SeatMap"
import type { FlightSeat, SeatClass, SeatStatus, SeatType } from "../../components/customer/SeatMap"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plane, AlertCircle } from "lucide-react"

// Generate realistic mock seats for a medium-haul aircraft
const generateMockSeats = (): FlightSeat[] => {
  const seats: FlightSeat[] = [];
  
  // Business Class: Rows 1-3, Layout 2-2 (A, C, D, F)
  for (let row = 1; row <= 3; row++) {
    ['A', 'C', 'D', 'F'].forEach(col => {
      let type: SeatType = 'Aisle';
      if (col === 'A' || col === 'F') type = 'Window';
      
      seats.push({
        id: `${row}${col}`,
        row,
        column: col,
        seatNumber: `${row}${col}`,
        class: 'Business',
        type,
        status: Math.random() > 0.4 ? 'Available' : 'Occupied',
        price: 1500000
      });
    });
  }

  // Economy Class: Rows 4-15, Layout 3-3 (A, B, C, D, E, F)
  for (let row = 4; row <= 15; row++) {
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      let type: SeatType = 'Middle';
      if (col === 'A' || col === 'F') type = 'Window';
      if (col === 'C' || col === 'D') type = 'Aisle';
      
      seats.push({
        id: `${row}${col}`,
        row,
        column: col,
        seatNumber: `${row}${col}`,
        class: 'Economy',
        type,
        status: Math.random() > 0.3 ? 'Available' : 'Occupied',
        price: 250000
      });
    });
  }

  return seats;
};

export default function SeatSelectionPage() {
  const maxPassengers = 2; // For demonstration. In reality, read from query string or context.
  const basePrice = 2500000;
  
  const [seats] = useState<FlightSeat[]>(generateMockSeats());
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  const handleToggleSeat = (seatId: string) => {
    setSelectedSeatIds(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    )
  }

  const selectedSeats = useMemo(() => {
    return seats.filter(s => selectedSeatIds.includes(s.id));
  }, [seats, selectedSeatIds]);

  const seatTotal = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }, [selectedSeats]);

  const totalAmount = basePrice * maxPassengers + seatTotal;

  const handleHoldSeats = () => {
    if (selectedSeatIds.length < maxPassengers) {
      alert(`Vui lòng chọn đủ ${maxPassengers} ghế cho tất cả hành khách.`);
      return;
    }
    // TODO: Call API POST /seats/hold
    alert('Khóa ghế thành công! Chuyển sang bước thanh toán...');
  }

  return (
    <div className="container px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
      {/* Left: Seat Map */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Plane className="w-6 h-6 text-primary" />
            Chọn ghế ngồi
          </h2>
          <p className="text-muted-foreground mt-1">Chuyến bay SGN - HAN (SkyBooking Airlines)</p>
          <div className="flex items-center gap-2 mt-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>Bạn cần chọn <strong>{maxPassengers}</strong> ghế cho hành trình này. Bạn đã chọn {selectedSeatIds.length}/{maxPassengers}.</p>
          </div>
        </div>
        
        <SeatMap 
          seats={seats}
          selectedSeats={selectedSeatIds}
          onToggleSeat={handleToggleSeat}
          maxPassengers={maxPassengers}
        />
      </div>

      {/* Right: Summary */}
      <aside className="w-full lg:w-[350px] shrink-0">
        <div className="bg-card text-card-foreground rounded-xl shadow-md border p-6 space-y-6 sticky top-24">
          <h3 className="font-semibold text-lg border-b pb-4">Tóm tắt chuyến bay</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Hành khách</span>
              <span className="font-medium">{maxPassengers} Người lớn</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Giá vé cơ bản</span>
              <span className="font-medium">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(basePrice * maxPassengers)}
              </span>
            </div>

            <Separator />

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Ghế đã chọn ({selectedSeatIds.length}/{maxPassengers})</span>
                <span className="font-medium text-primary">
                  +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(seatTotal)}
                </span>
              </div>
              
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSeats.map(seat => (
                    <Badge key={seat.id} variant="secondary" className="flex flex-col items-start px-3 py-1 bg-primary/10 text-primary border-primary/20">
                      <span className="font-bold">{seat.seatNumber}</span>
                      <span className="text-[10px] uppercase opacity-70">
                        {seat.class === 'Business' ? 'Thương gia' : 'Phổ thông'}
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mt-2">Chưa chọn ghế nào.</p>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-lg">Tổng cộng</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-right">Đã bao gồm thuế và phí</p>
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleHoldSeats}
            disabled={selectedSeatIds.length !== maxPassengers}
          >
            Xác nhận và Tiếp tục
          </Button>
        </div>
      </aside>
    </div>
  )
}
