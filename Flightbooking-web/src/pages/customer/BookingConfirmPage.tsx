import { motion } from "framer-motion"
import { CheckCircle2, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function BookingConfirmPage() {
  return (
    <div className="container px-4 md:px-8 py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center space-y-6 max-w-md w-full"
      >
        <div className="flex justify-center">
          <CheckCircle2 className="w-24 h-24 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">Đặt vé thành công!</h1>
        <p className="text-muted-foreground">
          Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi. Thông tin vé máy bay đã được gửi về email của bạn.
        </p>

        <div className="bg-card border rounded-xl p-6 space-y-4 text-left shadow-sm">
          <div className="flex justify-between items-center border-b pb-4">
            <span className="text-muted-foreground">Mã đặt chỗ</span>
            <span className="font-bold text-lg text-primary">AX8B9C</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Khởi hành</span>
            <span className="font-medium">SGN (Hồ Chí Minh)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Điểm đến</span>
            <span className="font-medium">HAN (Hà Nội)</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/history">
              <Ticket className="w-4 h-4" />
              Xem vé của tôi
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
