import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Wallet } from "lucide-react"

export default function PaymentPage() {
  return (
    <div className="container px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Thanh toán</h2>
        
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-6 space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Phương thức thanh toán</h3>
          
          <RadioGroup defaultValue="credit-card" className="space-y-4">
            <div className="flex items-center justify-between space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="credit-card" id="credit-card" />
                <Label htmlFor="credit-card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Thẻ tín dụng / Ghi nợ
                </Label>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-5 bg-muted rounded"></div>
                <div className="w-8 h-5 bg-muted rounded"></div>
              </div>
            </div>

            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="vnpay" id="vnpay" />
              <Label htmlFor="vnpay" className="flex items-center gap-2 cursor-pointer w-full">
                <Wallet className="w-5 h-5 text-primary" />
                Thanh toán qua VNPAY
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Quay lại</Button>
          <Button size="lg">Thanh toán ngay</Button>
        </div>
      </div>

      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-6 space-y-6 sticky top-24">
          <h3 className="font-semibold text-lg border-b pb-4">Đơn hàng</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Vé máy bay</span>
              <span className="font-medium">2.500.000 ₫</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Dịch vụ (Ghế)</span>
              <span className="font-medium">300.000 ₫</span>
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <span className="font-bold">Tổng thanh toán</span>
              <span className="text-xl font-bold text-primary">2.800.000 ₫</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
