import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  CreditCard, Wallet, CheckCircle2, ChevronRight,
  Info, Plane, Clock, AlertCircle, BadgePercent, Banknote
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { bookingService } from "../../services/booking.service"


// ─── Types ──────────────────────────────────────────────────────────────────
type PaymentType   = "full" | "deposit"
type PaymentMethod = "card" | "momo" | "vnpay" | "banking"

interface CardForm {
  number: string
  name:   string
  expiry: string
  cvv:    string
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DEPOSIT_RATIO   = 0.30          // 30% đặt cọc
const DEPOSIT_DAYS    = 7             // Hạn trả phần còn lại (ngày)

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; tag?: string }[] = [
  { id: "card",    label: "Thẻ tín dụng / Ghi nợ", icon: <CreditCard className="w-5 h-5 text-blue-600" /> },
  { id: "banking", label: "Chuyển khoản ngân hàng", icon: <Banknote className="w-5 h-5 text-green-600" /> },
  { id: "momo",    label: "Ví MoMo",                icon: <Wallet className="w-5 h-5 text-pink-500" />,   tag: "Sắp ra mắt" },
  { id: "vnpay",   label: "VNPAY QR",               icon: <Wallet className="w-5 h-5 text-red-500" />,    tag: "Sắp ra mắt" },
]

// ─── Mock helper — parse query params ────────────────────────────────────────
function useBookingContext() {
  const [params] = useSearchParams()
  const totalTicket     = Number(params.get("total"))      || 2_500_000
  const serviceFee      = Number(params.get("service"))    || 0
  const flightNumber    = params.get("flightNumber")       || "VN201"
  const originCode      = params.get("origin")             || "SGN"
  const destinationCode = params.get("destination")        || "HAN"
  const departureTime   = params.get("departureTime")      || new Date(Date.now() + 86400_000).toISOString()
  const passengerCount  = Number(params.get("passengers")) || 1
  const flightId      = params.get("flightId")           || ""
  const seats         = params.get("seats")              || ""
  return { totalTicket, serviceFee, flightNumber, originCode, destinationCode, departureTime, passengerCount, flightId, seats }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const navigate  = useNavigate()
  const ctx       = useBookingContext()

  const [paymentType,   setPaymentType]   = useState<PaymentType>("full")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [cardForm,      setCardForm]      = useState<CardForm>({ number: "", name: "", expiry: "", cvv: "" })
  const [processing,    setProcessing]    = useState(false)
  const [errors,        setErrors]        = useState<Partial<CardForm>>({})

  const grandTotal   = ctx.totalTicket + ctx.serviceFee
  const depositAmt   = Math.ceil(grandTotal * DEPOSIT_RATIO)
  const remainingAmt = grandTotal - depositAmt
  const dueDate      = new Date(Date.now() + DEPOSIT_DAYS * 86400_000)

  const amountToPay  = paymentType === "full" ? grandTotal : depositAmt

  const summaryItems = useMemo(() => [
    { label: "Vé máy bay", value: ctx.totalTicket },
    ...(ctx.serviceFee > 0 ? [{ label: "Dịch vụ bổ sung", value: ctx.serviceFee }] : []),
  ], [ctx])

  function formatVnd(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function validateCard(): boolean {
    if (paymentMethod !== "card") return true
    const errs: Partial<CardForm> = {}
    if (!cardForm.number.replace(/\s/g, "") || cardForm.number.replace(/\s/g, "").length < 16)
      errs.number = "Số thẻ không hợp lệ"
    if (!cardForm.name.trim()) errs.name = "Vui lòng nhập tên trên thẻ"
    if (!cardForm.expiry || !/^\d{2}\/\d{2}$/.test(cardForm.expiry)) errs.expiry = "Nhập MM/YY"
    if (!cardForm.cvv || cardForm.cvv.length < 3) errs.cvv = "CVV không hợp lệ"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function formatCardNumber(raw: string) {
    return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
  }

  async function handleConfirmPayment() {
    if (!validateCard()) return
    setProcessing(true)
    
    try {
      // 1. Lấy thông tin hành khách từ localStorage
      const draftPassengersRaw = localStorage.getItem("draftPassengers")
      if (!draftPassengersRaw) {
        alert("Không tìm thấy thông tin hành khách. Vui lòng quay lại bước trước.")
        setProcessing(false)
        return
      }
      const draftPassengers = JSON.parse(draftPassengersRaw)
      
      // 2. Lấy danh sách ghế từ URL
      const seatList = ctx.seats.split(",").map(s => s.trim())

      // 3. Chuẩn bị payload
      const payload = {
        flightId: Number(ctx.flightId),
        totalAmount: grandTotal,
        paymentType: paymentType === "deposit" ? "Deposit" : "Full",
        passengers: draftPassengers.map((p: any, idx: number) => ({
          title: p.title,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dob,
          nationality: p.nationality,
          passportNumber: p.passportNumber,
          seatNumber: seatList[idx] || ""
        }))
      }

      // 4. Gọi API thực tế
      const result = await bookingService.createBooking(payload)
      
      // 5. Xóa nháp và chuyển hướng
      localStorage.removeItem("draftPassengers")
      
      navigate(`/booking-confirm?bookingId=${result.bookingId}&pnr=${result.pnr}&paymentType=${paymentType}&amountPaid=${amountToPay}&remaining=${paymentType === "deposit" ? remainingAmt : 0}&dueDate=${dueDate.toISOString()}`)
    } catch (error: any) {
      console.error("Booking error:", error)
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container px-4 md:px-8 max-w-6xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 text-sm overflow-x-auto">
          {["Chọn chuyến", "Chọn ghế", "Thông tin", "Thanh toán"].map((step, i) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                ${i === 3 ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
                {i === 3 && <CheckCircle2 className="w-3.5 h-3.5" />}
                {step}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Payment options ─────────────────────────── */}
          <div className="flex-1 space-y-5">
            <h2 className="text-2xl font-black text-gray-800">Thanh toán</h2>

            {/* ── Section 1: Hình thức thanh toán tiền ─────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <BadgePercent className="w-5 h-5 text-primary" />
                Hình thức thanh toán tiền
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Payment */}
                <button
                  id="payment-type-full"
                  onClick={() => setPaymentType("full")}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all
                    ${paymentType === "full"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"}`}
                >
                  {paymentType === "full" && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-800">Thanh toán đủ</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Thanh toán toàn bộ{" "}
                    <span className="font-semibold text-gray-700">{formatVnd(grandTotal)}</span>{" "}
                    ngay bây giờ.
                  </p>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">✓ Tiết kiệm hơn</Badge>
                  </div>
                </button>

                {/* Deposit Payment */}
                <button
                  id="payment-type-deposit"
                  onClick={() => setPaymentType("deposit")}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all
                    ${paymentType === "deposit"
                      ? "border-orange-400 bg-orange-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"}`}
                >
                  {paymentType === "deposit" && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BadgePercent className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-semibold text-gray-800">Đặt cọc 30%</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Trả trước{" "}
                    <span className="font-semibold text-orange-600">{formatVnd(depositAmt)}</span>
                    , phần còn lại{" "}
                    <span className="font-semibold text-gray-700">{formatVnd(remainingAmt)}</span>{" "}
                    thanh toán sau.
                  </p>
                  <div className="mt-2">
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                      Hạn: {formatDate(dueDate)}
                    </Badge>
                  </div>
                </button>
              </div>

              {/* Deposit notice */}
              <AnimatePresence>
                {paymentType === "deposit" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700 space-y-1">
                      <p className="font-semibold">Lưu ý về đặt cọc</p>
                      <p>
                        Phần còn lại <strong>{formatVnd(remainingAmt)}</strong> phải được thanh toán
                        trước <strong>{formatDate(dueDate)}</strong>. Nếu không, vé có thể bị hủy.
                      </p>
                      <p className="text-xs text-amber-600">
                        Tính năng thanh toán phần còn lại sẽ có trên ứng dụng và email nhắc nhở.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Section 2: Phương thức thanh toán ────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Phương thức thanh toán
              </h3>

              <div className="space-y-2">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    id={`method-${method.id}`}
                    onClick={() => { if (!method.tag) setPaymentMethod(method.id) }}
                    disabled={!!method.tag}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all
                      ${paymentMethod === method.id && !method.tag
                        ? "border-primary bg-primary/5"
                        : method.tag
                          ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      {paymentMethod === method.id && !method.tag
                        ? <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                          </div>
                        : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      }
                      {method.icon}
                      <span className="font-medium text-sm text-gray-700">{method.label}</span>
                    </div>
                    {method.tag && (
                      <Badge variant="outline" className="text-xs">{method.tag}</Badge>
                    )}
                  </button>
                ))}
              </div>

              {/* Card form */}
              <AnimatePresence>
                {paymentMethod === "card" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 pt-2"
                  >
                    <Separator />
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Số thẻ</Label>
                      <Input
                        id="card-number"
                        placeholder="0000 0000 0000 0000"
                        value={cardForm.number}
                        onChange={e => setCardForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))}
                        className={errors.number ? "border-red-500" : ""}
                        maxLength={19}
                      />
                      {errors.number && <p className="text-xs text-red-500">{errors.number}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Tên trên thẻ</Label>
                      <Input
                        id="card-name"
                        placeholder="NGUYEN VAN A"
                        value={cardForm.name}
                        onChange={e => setCardForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Ngày hết hạn</Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          maxLength={5}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, "")
                            if (val.length >= 2) val = val.slice(0, 2) + "/" + val.slice(2, 4)
                            setCardForm(f => ({ ...f, expiry: val }))
                          }}
                          className={errors.expiry ? "border-red-500" : ""}
                        />
                        {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">CVV</Label>
                        <Input
                          id="card-cvv"
                          placeholder="123"
                          type="password"
                          maxLength={4}
                          value={cardForm.cvv}
                          onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "") }))}
                          className={errors.cvv ? "border-red-500" : ""}
                        />
                        {errors.cvv && <p className="text-xs text-red-500">{errors.cvv}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Thông tin thẻ được mã hóa SSL/TLS 256-bit. Chúng tôi không lưu trữ dữ liệu thẻ của bạn.</span>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === "banking" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm"
                  >
                    <Separator className="mb-3" />
                    <p className="font-semibold text-gray-700">Thông tin chuyển khoản:</p>
                    <div className="flex justify-between"><span className="text-gray-500">Ngân hàng:</span> <span className="font-medium">Vietcombank</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Số TK:</span> <span className="font-mono font-bold">1234 5678 901</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Chủ TK:</span> <span className="font-medium">CONG TY SKYBOOKING</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Số tiền:</span> <span className="font-bold text-primary">{formatVnd(amountToPay)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Nội dung:</span> <span className="font-mono text-xs">BOOKING-{Date.now().toString().slice(-8)}</span></div>
                    <p className="text-xs text-amber-600 mt-2">⚠ Vé sẽ được xác nhận sau khi nhận được thanh toán (1–2 giờ làm việc).</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(-1)}>← Quay lại</Button>
              <Button
                id="confirm-payment-btn"
                size="lg"
                className="px-8 gap-2 bg-primary hover:bg-primary/90 shadow-lg"
                onClick={handleConfirmPayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Xác nhận thanh toán {formatVnd(amountToPay)}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Right: Order summary ──────────────────────────── */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 sticky top-24">
              <h3 className="font-semibold text-gray-800">Thông tin chuyến bay</h3>

              {/* Flight info */}
              <div className="bg-primary/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Plane className="w-4 h-4" />
                  <span className="text-sm font-semibold">{ctx.flightNumber.split("-")[0]}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <div className="text-center">
                    <p className="text-xl font-black">{ctx.originCode}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(ctx.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300">
                    <div className="h-[1px] w-12 bg-gray-200" />
                    <Plane className="w-4 h-4 text-primary" />
                    <div className="h-[1px] w-12 bg-gray-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black">{ctx.destinationCode}</p>
                    <p className="text-xs text-gray-400">Bay thẳng</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(ctx.departureTime).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Price breakdown */}
              <div className="space-y-3">
                {summaryItems.map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium">{formatVnd(item.value)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Tổng tiền vé</span>
                  <span className="text-lg text-gray-800">{formatVnd(grandTotal)}</span>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className={`rounded-xl p-4 space-y-2 ${paymentType === "deposit" ? "bg-orange-50 border border-orange-100" : "bg-green-50 border border-green-100"}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thanh toán ngay</p>
                <p className={`text-2xl font-black ${paymentType === "deposit" ? "text-orange-600" : "text-green-600"}`}>
                  {formatVnd(amountToPay)}
                </p>
                {paymentType === "deposit" && (
                  <div className="text-xs text-orange-600 space-y-0.5">
                    <p>Còn lại: <strong>{formatVnd(remainingAmt)}</strong></p>
                    <p>Hạn thanh toán: <strong>{formatDate(dueDate)}</strong></p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
