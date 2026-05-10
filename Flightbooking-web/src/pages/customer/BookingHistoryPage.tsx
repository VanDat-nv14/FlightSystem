import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane } from "lucide-react"

export default function BookingHistoryPage() {
  const history = [
    {
      id: "AX8B9C",
      date: "15/10/2023",
      route: "SGN - HAN",
      status: "Thành công",
      price: "2.800.000 ₫"
    },
    {
      id: "BY9C1D",
      date: "02/09/2023",
      route: "HAN - DAD",
      status: "Đã bay",
      price: "1.500.000 ₫"
    }
  ]

  return (
    <div className="container px-4 md:px-8 py-8 space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Lịch sử đặt vé</h2>
      
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-6">
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center justify-between border-b last:border-0 pb-4 last:pb-0 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Plane className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold">{item.route}</h4>
                  <p className="text-sm text-muted-foreground">Mã đặt chỗ: {item.id} • Ngày: {item.date}</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                <div className="text-left md:text-right">
                  <p className="font-bold text-lg">{item.price}</p>
                  <Badge variant={item.status === "Thành công" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
                <Button variant="outline">Chi tiết</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
