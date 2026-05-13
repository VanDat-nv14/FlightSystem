import { motion } from "framer-motion"
import { CheckCircle2, Ticket, Clock, AlertCircle, Download, Home, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Link, useSearchParams } from "react-router-dom"

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// Mock booking code generator
function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function BookingConfirmPage() {
  const [params] = useSearchParams()
  const paymentType  = params.get("paymentType")  as "full" | "deposit" | null ?? "full"
  const amountPaid   = Number(params.get("amountPaid"))  || 0
  const remaining    = Number(params.get("remaining"))   || 0
  const dueDateIso   = params.get("dueDate")             || ""
  
  const bookingId    = params.get("bookingId")           || "0"
  const bookingCode  = params.get("pnr")                 || "N/A"

  const isDeposit    = paymentType === "deposit" && remaining > 0

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container px-4 max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="space-y-5"
        >
          {/* Success header */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-black text-gray-800">Đặt vé thành công!</h1>
            <p className="text-gray-500">
              {isDeposit
                ? "Đặt cọc đã được ghi nhận. Vui lòng thanh toán phần còn lại đúng hạn."
                : "Cảm ơn bạn! Thông tin vé đã được gửi về email của bạn."}
            </p>
          </div>

          {/* Booking card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Ticket top */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Ticket className="w-5 h-5" />
                <span className="font-semibold">Mã đặt chỗ</span>
              </div>
              <span className="text-2xl font-black text-white font-mono tracking-widest">
                {bookingCode}
              </span>
            </div>

            {/* Dashed separator (ticket look) */}
            <div className="relative px-6">
              <div className="absolute -left-3 top-0 bottom-0 flex flex-col justify-center">
                <div className="w-6 h-6 bg-gray-50 rounded-full border border-gray-100" />
              </div>
              <div className="absolute -right-3 top-0 bottom-0 flex flex-col justify-center">
                <div className="w-6 h-6 bg-gray-50 rounded-full border border-gray-100" />
              </div>
              <div className="border-t-2 border-dashed border-gray-100 my-0" />
            </div>

            {/* Booking details */}
            <div className="px-6 py-5 space-y-4">
              {/* Payment status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Trạng thái thanh toán</span>
                {isDeposit ? (
                  <Badge className="bg-orange-100 text-orange-700 border-0 gap-1.5">
                    <Clock className="w-3 h-3" />
                    Đặt cọc — Còn nợ {formatVnd(remaining)}
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 border-0 gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã thanh toán đủ
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Đã thanh toán</span>
                  <span className="font-bold text-green-600">{formatVnd(amountPaid)}</span>
                </div>

                {isDeposit && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Còn phải trả</span>
                      <span className="font-bold text-orange-600">{formatVnd(remaining)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Hạn thanh toán</span>
                      <span className="font-semibold text-gray-700">{formatDate(dueDateIso)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Deposit warning */}
              {isDeposit && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 space-y-1">
                    <p className="font-semibold">Nhắc nhở quan trọng</p>
                    <p>
                      Bạn cần thanh toán <strong>{formatVnd(remaining)}</strong> trước ngày{" "}
                      <strong>{formatDate(dueDateIso)}</strong> để hoàn tất đặt vé.
                    </p>
                    <p className="text-xs text-amber-500">
                      Chúng tôi sẽ gửi email nhắc nhở 2 ngày trước hạn.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 gap-2" asChild>
              <Link to="/">
                <Home className="w-4 h-4" />
                Về trang chủ
              </Link>
            </Button>

            {isDeposit && (
              <Button variant="outline" className="flex-1 gap-2 border-orange-200 text-orange-600 hover:bg-orange-50">
                <CreditCard className="w-4 h-4" />
                Thanh toán phần còn lại
              </Button>
            )}

            <Button className="flex-1 gap-2" asChild>
              <Link to="/history">
                <Ticket className="w-4 h-4" />
                Xem vé của tôi
              </Link>
            </Button>
          </div>

          {/* Download ticket */}
          <Button variant="ghost" className="w-full gap-2 text-gray-400 hover:text-gray-600">
            <Download className="w-4 h-4" />
            Tải vé PDF (sắp có)
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
