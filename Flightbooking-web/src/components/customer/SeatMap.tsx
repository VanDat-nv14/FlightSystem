import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export type SeatClass = 'Economy' | 'Business';
export type SeatStatus = 'Available' | 'Occupied' | 'Blocked' | 'Selected';
export type SeatType = 'Window' | 'Aisle' | 'Middle';

export interface FlightSeat {
  id: string;
  row: number;
  column: string;
  seatNumber: string;
  class: SeatClass;
  type: SeatType;
  status: SeatStatus;
  price: number;
}

interface SeatMapProps {
  seats: FlightSeat[];
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  maxPassengers: number;
}

export function SeatMap({ seats, selectedSeats, onToggleSeat, maxPassengers }: SeatMapProps) {
  // Group seats by row
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, FlightSeat[]>);

  const rowNumbers = Object.keys(rows).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-4 md:p-6 flex flex-col items-center">
      <ScrollArea className="w-full max-w-2xl whitespace-nowrap pb-4">
        <div className="flex flex-col items-center min-w-[300px]">
          {/* Plane Front */}
          <div className="w-4/5 h-24 bg-muted/30 rounded-t-[100px] border-t border-x mb-8 relative flex items-center justify-center shadow-inner">
            <span className="text-muted-foreground font-semibold tracking-widest text-sm uppercase">Cockpit</span>
          </div>

          <TooltipProvider delayDuration={200}>
            <div className="space-y-6">
              {rowNumbers.map((rowIndex) => {
                const rowSeats = rows[rowIndex].sort((a, b) => a.column.localeCompare(b.column));
                const isBusiness = rowSeats[0]?.class === 'Business';

                // Layout logic
                const leftSide = isBusiness ? rowSeats.filter(s => ['A', 'C'].includes(s.column)) : rowSeats.filter(s => ['A', 'B', 'C'].includes(s.column));
                const rightSide = isBusiness ? rowSeats.filter(s => ['D', 'F'].includes(s.column)) : rowSeats.filter(s => ['D', 'E', 'F'].includes(s.column));

                return (
                  <div key={rowIndex} className="flex items-center justify-center gap-4 md:gap-8">
                    {/* Left Side */}
                    <div className="flex gap-2">
                      {leftSide.map((seat) => (
                        <SeatButton 
                          key={seat.id} 
                          seat={seat} 
                          isSelected={selectedSeats.includes(seat.id)}
                          onClick={() => {
                            if (seat.status === 'Available' && (selectedSeats.length < maxPassengers || selectedSeats.includes(seat.id))) {
                              onToggleSeat(seat.id);
                            }
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Aisle */}
                    <div className="w-6 md:w-8 text-center text-muted-foreground text-sm font-bold bg-muted/50 rounded-full py-1">
                      {rowIndex}
                    </div>
                    
                    {/* Right Side */}
                    <div className="flex gap-2">
                      {rightSide.map((seat) => (
                        <SeatButton 
                          key={seat.id} 
                          seat={seat} 
                          isSelected={selectedSeats.includes(seat.id)}
                          onClick={() => {
                            if (seat.status === 'Available' && (selectedSeats.length < maxPassengers || selectedSeats.includes(seat.id))) {
                              onToggleSeat(seat.id);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </TooltipProvider>

          {/* Plane Tail */}
          <div className="w-4/5 h-16 bg-muted/30 rounded-b-[60px] border-b border-x mt-8" />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-muted border border-muted-foreground/30" />
          <span>Trống (Phổ thông)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/50" />
          <span>Trống (Thương gia)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-secondary border border-muted-foreground/30 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,currentColor_4px,currentColor_8px)]"></div>
          </div>
          <span>Đã đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center border-primary shadow-sm ring-2 ring-primary/30" />
          <span>Đang chọn</span>
        </div>
      </div>
    </div>
  )
}

function SeatButton({ seat, isSelected, onClick }: { seat: FlightSeat, isSelected: boolean, onClick: () => void }) {
  const isAvailable = seat.status === 'Available';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={isAvailable ? { scale: 1.1, y: -2 } : {}}
          whileTap={isAvailable ? { scale: 0.95 } : {}}
          onClick={onClick}
          disabled={!isAvailable}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs md:text-sm font-semibold transition-all border relative
            ${!isAvailable 
              ? 'bg-secondary text-secondary-foreground opacity-60 cursor-not-allowed border-muted-foreground/20' 
              : isSelected 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/50' 
                : seat.class === 'Business' 
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20' 
                  : 'bg-muted border-muted-foreground/30 hover:border-primary/50 hover:bg-accent'
            }
          `}
        >
          {/* Visual pattern for occupied seats */}
          {!isAvailable && (
            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,currentColor_4px,currentColor_8px)] rounded-t-lg rounded-b-sm pointer-events-none"></div>
          )}
          {/* Seat Armrests simulation */}
          <div className="absolute inset-y-2 left-0 w-1 bg-black/5 rounded-r-sm"></div>
          <div className="absolute inset-y-2 right-0 w-1 bg-black/5 rounded-l-sm"></div>
          
          <span className="relative z-10">{seat.seatNumber}</span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex flex-col gap-1 p-3">
        <p className="font-bold text-sm">Ghế {seat.seatNumber}</p>
        <p className="text-xs text-muted-foreground">Hạng: {seat.class === 'Business' ? 'Thương gia' : 'Phổ thông'}</p>
        <p className="text-xs text-muted-foreground">Vị trí: {seat.type === 'Window' ? 'Cửa sổ' : seat.type === 'Aisle' ? 'Lối đi' : 'Giữa'}</p>
        <p className="text-xs text-muted-foreground">Trạng thái: {seat.status}</p>
        <p className="text-sm font-semibold text-primary mt-1">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(seat.price)}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
