import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Tag, Copy, Check, Plane, Clock, Zap, Gift, Sparkles,
  ChevronRight, ArrowRight, Star, Filter, X
} from "lucide-react"
import { promotionService, type PromotionDto } from "../../services/promotion.service"

// ── Airline Brand Aesthetic Resolver ───────────────────────────────────────
function getAirlineStyles(airlineName: string | null | undefined) {
  const name = airlineName?.toLowerCase() || "";
  if (name.includes("vietnam airlines") || name.includes("vietnam") || name.includes("vn")) {
    return {
      logo: "VN",
      color: "#0033A0",
      bg: "from-blue-900 to-blue-700",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80",
      tag: "Hạng Thương Gia"
    };
  }
  if (name.includes("vietjet") || name.includes("vj")) {
    return {
      logo: "VJ",
      color: "#E31837",
      bg: "from-red-700 to-red-500",
      image: "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=900&q=80",
      tag: "Vé Siêu Rẻ"
    };
  }
  if (name.includes("bamboo") || name.includes("qh")) {
    return {
      logo: "QH",
      color: "#006341",
      bg: "from-green-800 to-green-600",
      image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80",
      tag: "Trải Nghiệm Xanh"
    };
  }
  if (name.includes("vietravel") || name.includes("vu")) {
    return {
      logo: "VU",
      color: "#F6C604",
      bg: "from-yellow-600 to-yellow-400",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
      tag: "Du Lịch Hè"
    };
  }
  // Default fallback for any other airline
  return {
    logo: "Sky",
    color: "#0F172A",
    bg: "from-slate-800 to-slate-600",
    image: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=900&q=80",
    tag: "Khuyến Mãi"
  };
}

// ── Countdown Hook ────────────────────────────────────────────────────────────
function useCountdown(targetDate: string) {
  const target = new Date(targetDate).getTime()
  const [remaining, setRemaining] = useState(target - Date.now())

  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000)
    return () => clearInterval(timer)
  }, [target])

  const totalSecs = Math.max(0, Math.floor(remaining / 1000))
  const days = Math.floor(totalSecs / 86400)
  const hours = Math.floor((totalSecs % 86400) / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60
  return { days, hours, mins, secs }
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[52px] rounded-xl bg-white/15 backdrop-blur border border-white/20 px-3 py-2 text-center">
        <span className="text-2xl font-black tabular-nums">{String(value).padStart(2, "0")}</span>
      </div>
      <span className="mt-1 text-[11px] font-semibold text-white/70 uppercase tracking-wide">{label}</span>
    </div>
  )
}

// ── Card Component ────────────────────────────────────────────────────────────
function PromoCard({ promo, index }: { promo: PromotionDto; index: number }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(promo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBook = () => {
    navigate("/flights")
  }

  const styles = getAirlineStyles(promo.airlineName)
  const daysLeft = Math.max(0, Math.floor((new Date(promo.endDate).getTime() - Date.now()) / 86400000))

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image + Badges */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={styles.image}
          alt={promo.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Discount badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white shadow">
          <Zap className="h-3 w-3" />
          Giảm {promo.discountPercent}%
        </div>

        {/* Tag */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700">
          {styles.tag}
        </div>

        {/* Airline logo */}
        <div
          className={`absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${styles.bg} text-xs font-black text-white shadow`}
        >
          {styles.logo}
        </div>

        {/* Days left */}
        {daysLeft <= 14 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white">
            <Clock className="h-3 w-3" />
            Còn {daysLeft} ngày
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {promo.airlineName || "Hệ Thống SkyBooking"}
        </p>
        <h3 className="mt-1 text-base font-black text-slate-900 leading-snug">{promo.name}</h3>
        
        {/* Simple details */}
        <p className="mt-2 text-sm text-slate-500 leading-5 flex-1">
          Nhập mã {promo.code} để được giảm trực tiếp {promo.discountPercent}% giá vé cơ bản khi đặt chuyến bay của {promo.airlineName || "SkyBooking"}.
        </p>

        {/* Routes info */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            <Plane className="h-3 w-3" />
            Tất cả chặng bay
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            {promo.airlineName ? "Độc quyền hãng" : "Toàn hệ thống"}
          </span>
        </div>

        {/* Code + CTA */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-3 py-2">
            <Tag className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1 font-mono text-sm font-bold tracking-widest text-slate-900">{promo.code}</span>
            <button
              onClick={handleCopy}
              className="rounded-lg bg-white p-1.5 shadow-sm border border-slate-100 transition hover:bg-blue-50 hover:border-blue-200"
              title="Copy mã"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
          <button
            onClick={handleBook}
            className="shrink-0 rounded-xl bg-[#006CE4] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
          >
            Đặt ngay
          </button>
        </div>

        <p className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Hạn dùng: {new Date(promo.endDate).toLocaleDateString("vi-VN")}
        </p>
      </div>
    </motion.div>
  )
}

// ── Countdown Banner Section ──────────────────────────────────────────────────
function HotDealSection({ hotDeal }: { hotDeal: PromotionDto }) {
  const navigate = useNavigate()
  const countdown = useCountdown(hotDeal.endDate)
  const styles = getAirlineStyles(hotDeal.airlineName)

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500">
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `url("${styles.image}")`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-rose-700/90 via-rose-600/80 to-orange-500/70" />

      {/* Floating planes */}
      <motion.div
        animate={{ x: ["-10vw", "110vw"], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute top-8 text-white/20"
      >
        <Plane className="h-16 w-16 rotate-45" />
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl text-white"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4 text-yellow-200" />
              Ưu đãi hot nhất
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              {hotDeal.name}
            </h1>
            <p className="mt-4 text-lg leading-7 text-white/85">
              Siêu khuyến mãi giảm đến {hotDeal.discountPercent}% từ hãng hàng không {hotDeal.airlineName || "đối tác"}. Hãy nhanh tay thu thập mã giảm giá và đặt vé ngay trước khi thời gian ưu đãi kết thúc!
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/flights")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-black text-rose-600 shadow-lg transition hover:bg-rose-50 hover:scale-105 active:scale-100"
              >
                Đặt vé ngay
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 font-mono text-base font-bold text-white backdrop-blur">
                <Tag className="h-4 w-4" />
                {hotDeal.code}
              </div>
            </div>
          </motion.div>

          {/* Countdown timer */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur text-white shrink-0"
          >
            <p className="mb-4 text-center text-sm font-semibold text-white/80 flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Ưu đãi kết thúc sau
            </p>
            <div className="flex items-end gap-3">
              <CountUnit value={countdown.days} label="Ngày" />
              <span className="mb-6 text-2xl font-black text-white/60">:</span>
              <CountUnit value={countdown.hours} label="Giờ" />
              <span className="mb-6 text-2xl font-black text-white/60">:</span>
              <CountUnit value={countdown.mins} label="Phút" />
              <span className="mb-6 text-2xl font-black text-white/60">:</span>
              <CountUnit value={countdown.secs} label="Giây" />
            </div>
            <p className="mt-4 text-center text-xs text-white/60">
              Hạn sử dụng: {new Date(hotDeal.endDate).toLocaleDateString("vi-VN")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function PromotionsPage() {
  const navigate = useNavigate()
  const [activeAirline, setActiveAirline] = useState("Tất cả")

  // React Query fetch active promotions
  const { data: promotions = [], isLoading, error } = useQuery<PromotionDto[]>({
    queryKey: ["active-promotions"],
    queryFn: promotionService.getActive,
  })

  // Extract airlines present in the backend promotions dynamically
  const availableAirlines = ["Tất cả", ...Array.from(new Set(promotions.map(p => p.airlineName).filter(Boolean))) as string[]]

  const filtered = activeAirline === "Tất cả"
    ? promotions
    : promotions.filter(p => p.airlineName === activeAirline)

  // Determine hot deal (the one with the largest discount percent)
  const hotDeal = promotions.length > 0
    ? promotions.reduce((prev, curr) => (prev.discountPercent > curr.discountPercent ? prev : curr), promotions[0])
    : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Loading state ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 font-semibold">Đang tải danh sách ưu đãi bay...</p>
        </div>
      )}

      {/* ── Error state ── */}
      {error && !isLoading && (
        <div className="text-center py-20">
          <Gift className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="font-semibold text-red-500">Đã xảy ra lỗi khi lấy danh sách ưu đãi.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white font-bold text-sm shadow hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Active Content ── */}
      {!isLoading && !error && (
        <>
          {hotDeal && <HotDealSection hotDeal={hotDeal} />}

          {/* ── Stats Bar ── */}
          <div className="border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4 md:px-8">
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
                {[
                  { icon: Gift, label: "Tổng ưu đãi", value: `${promotions.length} deal` },
                  { icon: Star, label: "Tiết kiệm tối đa", value: promotions.length > 0 ? `${Math.max(...promotions.map(p => p.discountPercent))}%` : "0%" },
                  { icon: Plane, label: "Hãng hàng không", value: `${availableAirlines.length - 1} hãng` },
                  { icon: Clock, label: "Cập nhật", value: "Thời gian thực" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-blue-500" />
                    <span className="text-slate-400">{item.label}:</span>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Danh sách ưu đãi ── */}
          <div className="container mx-auto px-4 py-12 md:px-8">
            {/* Header + Filter */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-rose-500">
                  <Tag className="h-4 w-4" />
                  Độc quyền tại SkyBooking
                </p>
                <h2 className="text-3xl font-black text-slate-900">Khuyến mãi đang diễn ra</h2>
              </div>

              {/* Airline filter */}
              {promotions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                  {availableAirlines.map(airline => (
                    <button
                      key={airline}
                      onClick={() => setActiveAirline(airline)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        activeAirline === airline
                          ? "bg-[#006CE4] text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {airline}
                    </button>
                  ))}
                  {activeAirline !== "Tất cả" && (
                    <button
                      onClick={() => setActiveAirline("Tất cả")}
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                      Xóa lọc
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAirline}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filtered.map((promo, index) => (
                  <PromoCard key={promo.id} promo={promo} index={index} />
                ))}
              </motion.div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl shadow-sm">
                <Gift className="mx-auto mb-4 h-12 w-12 text-slate-300 animate-bounce" />
                <h3 className="font-bold text-slate-700 text-lg">Chưa có chương trình ưu đãi nào</h3>
                <p className="text-slate-500 text-sm mt-1">Hệ thống đang chuẩn bị các deal cực hot. Hãy quay lại sau nhé!</p>
              </div>
            )}

            {/* CTA Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-14 rounded-3xl bg-gradient-to-r from-slate-900 to-blue-950 p-8 text-white md:flex md:items-center md:justify-between"
            >
              <div>
                <p className="flex items-center gap-2 text-sm text-cyan-300 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Không bỏ lỡ ưu đãi nào
                </p>
                <h3 className="mt-2 text-2xl font-black">Đặt vé ngay để tận hưởng giá tốt nhất!</h3>
                <p className="mt-1.5 text-sm text-slate-300">Hàng trăm chuyến bay với giá ưu đãi đang chờ bạn.</p>
              </div>
              <button
                onClick={() => navigate("/flights")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-black text-slate-900 transition hover:bg-cyan-50 hover:scale-105 active:scale-100 md:mt-0 shrink-0"
              >
                Tìm chuyến bay
                <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}
