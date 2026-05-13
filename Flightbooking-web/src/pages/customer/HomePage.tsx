import { motion } from "framer-motion"
import { FlightSearchForm } from "../../components/customer/FlightSearchForm"
import { Shield, Zap, Headphones, Star, Plane } from "lucide-react"
import { useNavigate } from "react-router-dom"

const POPULAR_DESTINATIONS = [
  {
    code: "HAN", city: "Hà Nội", country: "Việt Nam",
    gradient: "from-blue-600 to-cyan-500",
    emoji: "🏛️", desc: "Thủ đô ngàn năm văn hiến"
  },
  {
    code: "DAD", city: "Đà Nẵng", country: "Việt Nam",
    gradient: "from-emerald-500 to-teal-400",
    emoji: "🌉", desc: "Thành phố đáng sống"
  },
  {
    code: "PQC", city: "Phú Quốc", country: "Việt Nam",
    gradient: "from-orange-400 to-pink-500",
    emoji: "🏖️", desc: "Đảo ngọc thiên đường"
  },
  {
    code: "SIN", city: "Singapore", country: "Singapore",
    gradient: "from-violet-600 to-purple-500",
    emoji: "🦁", desc: "Quốc đảo sư tử"
  },
]

const WHY_US = [
  {
    icon: Zap,
    title: "Đặt vé siêu tốc",
    desc: "Hoàn tất đặt vé chỉ trong 3 phút với giao diện đơn giản, trực quan.",
    color: "text-yellow-500", bg: "bg-yellow-50"
  },
  {
    icon: Shield,
    title: "Thanh toán an toàn",
    desc: "Hỗ trợ thanh toán linh hoạt: toàn bộ hoặc đặt cọc trước — bảo mật tuyệt đối.",
    color: "text-green-500", bg: "bg-green-50"
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ chăm sóc khách hàng sẵn sàng hỗ trợ bạn bất kỳ lúc nào.",
    color: "text-blue-500", bg: "bg-blue-50"
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative min-h-[560px] flex flex-col items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#0D3167] to-[#1565C0]" />

        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Star dots */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}

        {/* Plane icon floating */}
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 right-[15%] text-white/10"
        >
          <Plane className="w-32 h-32 rotate-12" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 space-y-6 pb-32">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 text-white/80 text-sm mb-4 border border-white/20">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>Hơn 50.000 chuyến bay mỗi năm</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
              Khám phá thế giới<br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                cùng SkyBooking
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/80 max-w-xl mx-auto mt-4">
              Đặt vé máy bay dễ dàng • Giá tốt nhất • Thanh toán linh hoạt
            </p>
          </motion.div>
        </div>

        {/* Search form overlapping */}
        <div className="absolute bottom-[-100px] left-0 right-0 z-20 px-4">
          <FlightSearchForm />
        </div>
      </section>

      {/* Spacer for form overlap */}
      <div className="h-36" />

      {/* ── Popular Destinations ─────────────────────────────── */}
      <section className="container px-4 md:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Điểm đến nổi bật</h2>
          <p className="text-gray-500 mt-2">Khám phá những hành trình tuyệt vời đang chờ bạn</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {POPULAR_DESTINATIONS.map((dest, i) => (
            <motion.div
              key={dest.code}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              onClick={() => navigate("/")}
              className={`relative rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br ${dest.gradient} aspect-[4/5] md:aspect-[3/4] shadow-md`}
            >
              {/* Texture overlay */}
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Emoji as visual */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl md:text-7xl opacity-40">
                {dest.emoji}
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">{dest.country}</p>
                <p className="text-xl font-black">{dest.city}</p>
                <p className="text-xs text-white/70 mt-0.5">{dest.desc}</p>
              </div>

              {/* Badge */}
              <div className="absolute top-3 right-3 bg-white/20 backdrop-blur rounded-full px-2 py-0.5 text-xs text-white font-bold">
                {dest.code}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ──────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="container px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Tại sao chọn SkyBooking?</h2>
            <p className="text-gray-500 mt-2">Chúng tôi mang lại trải nghiệm đặt vé tốt nhất cho bạn</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHY_US.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer spacer ─────────────────────────────────────── */}
      <div className="h-8" />
    </div>
  )
}
