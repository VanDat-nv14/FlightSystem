import { motion } from "framer-motion"
import type { MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarCheck, Headphones, Heart, Plane, ShieldCheck, Sparkles, Star, Ticket, Zap } from "lucide-react"
import { FlightSearchForm } from "../../components/customer/FlightSearchForm"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { airportService, type Airport } from "../../services/airport.service"
import { favoriteService } from "../../services/favorite.service"
import { useAuthStore } from "../../stores/useAuthStore"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2200&q=85"

const POPULAR_DESTINATIONS = [
  {
    code: "HAN",
    city: "Hà Nội",
    country: "Việt Nam",
    desc: "Phố cổ, hồ Hoàn Kiếm và nhịp sống thủ đô",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=85",
  },
  {
    code: "DAD",
    city: "Đà Nẵng",
    country: "Việt Nam",
    desc: "Biển xanh, cầu Rồng và những resort ven biển",
    image: "https://images.unsplash.com/photo-1564596823821-79b97151055e?auto=format&fit=crop&w=900&q=85",
  },
  {
    code: "PQC",
    city: "Phú Quốc",
    country: "Việt Nam",
    desc: "Bãi biển nhiệt đới và kỳ nghỉ cuối tuần",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
  },
  {
    code: "SIN",
    city: "Singapore",
    country: "Singapore",
    desc: "City break hiện đại, mua sắm và ẩm thực",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85",
  },
]

type PopularDestination = typeof POPULAR_DESTINATIONS[number]

function isAirportDestination(dest: Airport | PopularDestination): dest is Airport {
  return "id" in dest
}

const WHY_US = [
  {
    icon: Zap,
    title: "Tìm chuyến nhanh",
    desc: "So sánh giá, giờ bay và hạng ghế trong một luồng đặt vé gọn gàng.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: ShieldCheck,
    title: "Thanh toán rõ ràng",
    desc: "Hiển thị tổng tiền, hành lý, ghế và mã đặt chỗ trước khi xác nhận.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Headphones,
    title: "Theo dõi dễ dàng",
    desc: "Xem vé, QR check-in và baggage tag ngay trong lịch sử đặt vé.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
]

const STATS = [
  { label: "Hãng bay", value: "12+" },
  { label: "Điểm đến", value: "40+" },
  { label: "Hỗ trợ", value: "24/7" },
]

export default function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const tomorrow = new Date(Date.now() + 86400_000).toISOString().split("T")[0]

  const { data: airports = [] } = useQuery({
    queryKey: ["airports"],
    queryFn: airportService.getAll,
  })

  const featuredDestinations = airports
    .filter(a => a.isFeatured)
    .sort((a, b) => (a.featuredDisplayOrder ?? 0) - (b.featuredDisplayOrder ?? 0))
    .slice(0, 4)

  const displayedDestinations = featuredDestinations.length > 0
    ? featuredDestinations
    : POPULAR_DESTINATIONS

  const { data: favoriteAirports = [] } = useQuery({
    queryKey: ["customer-favorites", "Airport"],
    queryFn: () => favoriteService.getMyFavorites("Airport"),
    enabled: isAuthenticated,
  })

  const favoriteAirportIds = new Set(favoriteAirports.map(item => item.itemId))

  const toggleFavorite = useMutation({
    mutationFn: (airportId: number) => favoriteService.toggle("Airport", airportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-favorites"] })
      queryClient.invalidateQueries({ queryKey: ["customer-favorites", "Airport"] })
    },
  })

  function searchFeaturedDestination(dest: Airport | PopularDestination) {
    if (isAirportDestination(dest)) {
      const origin = airports.find(a => a.code === "SGN" && a.id !== dest.id) ?? airports.find(a => a.id !== dest.id)
      const params = new URLSearchParams({
        originAirportId: (origin?.id ?? "").toString(),
        destinationAirportId: dest.id.toString(),
        departureDate: tomorrow,
        passengerCount: "1",
      })
      navigate(`/flights?${params.toString()}`)
      return
    }
    navigate("/flights")
  }

  function toggleDestinationFavorite(event: MouseEvent<HTMLButtonElement>, dest: Airport | PopularDestination) {
    event.stopPropagation()
    if (!isAirportDestination(dest)) return
    if (!isAuthenticated) {
      navigate("/login")
      return
    }
    toggleFavorite.mutate(dest.id)
  }

  return (
    <div className="flex-1 bg-slate-50">
      <section className="relative min-h-[620px] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Airplane window above clouds"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/68 to-blue-950/20" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />

        <motion.div
          animate={{ x: ["-15vw", "105vw"], y: [10, -18, 4], rotate: [8, 2, 8] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-24 left-0 text-white/30"
        >
          <Plane className="h-20 w-20 rotate-45" />
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center px-4 pb-28 pt-16 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl text-white"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              Đặt vé máy bay, chọn ghế, hành lý và QR check-in trong một nơi
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Bay dễ hơn với SkyBooking
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-100/90">
              Tìm chuyến bay phù hợp, so sánh giá nhanh và quản lý toàn bộ hành trình từ lúc đặt vé đến khi lên máy bay.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {STATS.map(item => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="text-2xl font-black">{item.value}</div>
                  <div className="text-xs text-slate-200">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-[-92px] left-0 right-0 z-20 px-4">
          <FlightSearchForm />
        </div>
      </section>

      <div className="h-32" />

      <section className="container px-4 py-12 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Star className="h-4 w-4 fill-blue-600" />
              Gợi ý cho bạn
            </p>
            <h2 className="text-3xl font-black text-slate-900">Điểm đến nổi bật</h2>
            <p className="mt-2 text-slate-500">Các chặng phổ biến đang được khách hàng tìm kiếm nhiều.</p>
          </div>
          <button
            onClick={() => navigate("/flights")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <Ticket className="h-4 w-4" />
            Xem chuyến bay
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displayedDestinations.map((dest, index) => {
            const code = dest.code
            const city = dest.city
            const country = dest.country
            const fallbackImage = POPULAR_DESTINATIONS[index % POPULAR_DESTINATIONS.length].image
            const desc = isAirportDestination(dest) ? dest.featuredDescription || dest.name : dest.desc
            const image = isAirportDestination(dest) ? dest.featuredImageUrl || fallbackImage : dest.image
            const isFavorited = isAirportDestination(dest) && favoriteAirportIds.has(dest.id)
            return (
            <motion.div
              key={code}
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => searchFeaturedDestination(dest)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") searchFeaturedDestination(dest)
              }}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200 text-left shadow-md"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url("${image}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-blue-700 shadow-sm">
                {code}
              </div>
              {isAirportDestination(dest) && (
                <button
                  type="button"
                  onClick={event => toggleDestinationFavorite(event, dest)}
                  className={`absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white/90 shadow-sm transition hover:scale-105 ${
                    isFavorited ? "border-rose-200 text-rose-600" : "border-white/60 text-slate-500 hover:text-rose-500"
                  }`}
                  title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-rose-600" : ""}`} />
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-white/75">{country}</p>
                <p className="mt-1 text-2xl font-black">{city}</p>
                <p className="mt-1 text-sm leading-5 text-white/80">{desc}</p>
              </div>
            </motion.div>
          )})}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="container px-4 md:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {WHY_US.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white md:flex md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm text-cyan-200">
                <CalendarCheck className="h-4 w-4" />
                Chuẩn bị cho chuyến đi tiếp theo
              </p>
              <h3 className="mt-2 text-2xl font-black">Tìm chuyến bay hôm nay, check-in dễ dàng ngày mai.</h3>
            </div>
            <button
              onClick={() => navigate("/flights")}
              className="mt-5 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-50 md:mt-0"
            >
              Bắt đầu tìm vé
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
