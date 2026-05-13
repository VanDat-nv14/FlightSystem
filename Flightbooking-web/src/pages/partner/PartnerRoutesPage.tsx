import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Map, Clock, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { routeService } from "../../services/route.service"

export default function PartnerRoutesPage() {
  const [search, setSearch] = useState("")

  const { data: routes = [], isLoading: isRoutesLoading } = useQuery({
    queryKey: ["partner-routes"],
    queryFn: routeService.getAll,
  })

  const filtered = routes.filter(r =>
    r.originCode.toLowerCase().includes(search.toLowerCase()) ||
    r.destinationCode.toLowerCase().includes(search.toLowerCase()) ||
    r.originCity.toLowerCase().includes(search.toLowerCase()) ||
    r.destinationCity.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Tra cứu Tuyến bay</h2>
        <p className="text-muted-foreground text-sm">
          Danh sách các tuyến bay hiện có trên hệ thống mà hãng có thể khai thác.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Tìm kiếm theo mã, thành phố..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <Badge variant="outline" className="text-sm">{filtered.length} tuyến bay</Badge>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border overflow-hidden relative min-h-[300px]">
        {isRoutesLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tuyến bay</TableHead>
              <TableHead>Từ</TableHead>
              <TableHead>Đến</TableHead>
              <TableHead>Khoảng cách</TableHead>
              <TableHead>Thời gian bay</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isRoutesLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Không tìm thấy tuyến bay nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(route => (
                <TableRow key={route.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-primary">
                      {route.originCode} <ArrowRight className="w-3 h-3 text-muted-foreground" /> {route.destinationCode}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{route.originCity}</div>
                    <div className="text-xs text-muted-foreground">Airport ID: {route.originAirportId}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{route.destinationCity}</div>
                    <div className="text-xs text-muted-foreground">Airport ID: {route.destinationAirportId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Map className="w-3 h-3 text-muted-foreground" />
                      {route.distanceKm} Km
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {Math.floor(route.estimatedDurationMinutes / 60)}h {route.estimatedDurationMinutes % 60}m
                    </div>
                  </TableCell>
                  <TableCell>
                    {route.isActive 
                      ? <Badge variant="secondary">Hoạt động</Badge>
                      : <Badge variant="outline" className="text-muted-foreground">Bảo trì</Badge>
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
