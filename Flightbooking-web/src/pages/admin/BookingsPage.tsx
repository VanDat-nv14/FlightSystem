import { useState } from "react"
import { Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function BookingsPage() {
  const [bookings] = useState([
    {
      id: "BK-12345",
      customer: "Nguyen Van A",
      flight: "VN-123",
      route: "SGN - HAN",
      date: "2023-10-15",
      amount: 2800000,
      status: "Confirmed"
    },
    {
      id: "BK-67890",
      customer: "Tran Thi B",
      flight: "VJ-456",
      route: "HAN - DAD",
      date: "2023-10-16",
      amount: 1500000,
      status: "Pending"
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý đặt vé</h2>
      </div>
      
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Booking</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Chuyến bay</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.id}</TableCell>
                <TableCell>{b.customer}</TableCell>
                <TableCell>{b.flight} ({b.route})</TableCell>
                <TableCell>{new Date(b.date).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>
                  <Badge variant={b.status === "Confirmed" ? "default" : "secondary"}>
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.amount)}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
