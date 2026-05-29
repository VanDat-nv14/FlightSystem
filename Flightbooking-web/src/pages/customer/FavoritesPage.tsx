import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Heart, Plane, MapPin, Trash2, Search, Lock,
  Compass, Star
} from "lucide-react"
import { favoriteService, type FavoriteItemType } from "../../services/favorite.service"
import { useAuthStore } from "../../stores/useAuthStore"

type TabType = "all" | "Airport" | "Flight"

const TABS: { key: TabType; label: string; icon: typeof Plane }[] = [
  { key: "all", label: "Tất cả", icon: Star },
  { key: "Airport", label: "Điểm đến", icon: MapPin },
  { key: "Flight", label: "Chuyến bay", icon: Plane },
]

export default function FavoritesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>("all")

  const itemTypeParam: FavoriteItemType | undefined =
    activeTab === "all" ? undefined : activeTab

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["customer-favorites", activeTab],
    queryFn: () => favoriteService.getMyFavorites(itemTypeParam),
    enabled: isAuthenticated,
  })

  const removeFavorite = useMutation({
    mutationFn: favoriteService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-favorites"] })
    },
  })

  // Nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50">
            <Lock className="h-9 w-9 text-rose-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Đăng nhập để xem yêu thích</h2>
          <p className="mt-3 text-slate-500">Lưu điểm đến và chuyến bay yêu thích để truy cập nhanh hơn.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full rounded-2xl bg-[#006CE4] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Đăng nhập ngay
          </button>
        </motion.div>
      </div>
    )
  }

  const tomorrow = new Date(Date.now() + 86400_000).toISOString().split("T")[0]

  function handleBookFlight(itemId: number) {
    navigate(`/flights?flightId=${itemId}`)
  }

  function handleSearchDestination(title: string) {
    // Extract airport code from title like "Hà Nội (HAN)"
    const match = title.match(/\(([A-Z]{3})\)/)
    const code = match ? match[1] : ""
    navigate(`/flights?destinationCode=${code}&departureDate=${tomorrow}&passengerCount=1`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-8 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-500">
                <Heart className="h-4 w-4 fill-rose-500" />
                Của bạn
              </p>
              <h1 className="text-3xl font-black text-slate-900">Danh sách yêu thích</h1>
              <p className="mt-1.5 text-slate-500">Các điểm đến và chuyến bay bạn đã lưu lại.</p>
            </div>
            <button
              onClick={() => navigate("/flights")}
              className="hidden shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 md:flex"
            >
              <Search className="h-4 w-4" />
              Tìm chuyến bay
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-[#006CE4] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-full bg-[#006CE4]"
                    style={{ zIndex: -1 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:px-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white border border-slate-100 overflow-hidden">
                <div className="h-40 bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-9 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-50">
              <Heart className="h-11 w-11 text-rose-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              {activeTab === "all"
                ? "Bạn chưa lưu mục yêu thích nào"
                : activeTab === "Airport"
                ? "Chưa có điểm đến yêu thích"
                : "Chưa có chuyến bay yêu thích"}
            </h3>
            <p className="mt-2 max-w-xs text-slate-500">
              Bấm biểu tượng ❤️ trên điểm đến hoặc chuyến bay để lưu lại ở đây.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#006CE4] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <Compass className="h-4 w-4" />
              Khám phá điểm đến
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {favorites.map((item, index) => {
                const isAirport = item.itemType === "Airport"
                const Icon = isAirport ? MapPin : Plane

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    {/* Image / Placeholder */}
                    {item.imageUrl ? (
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-white ${isAirport ? "bg-blue-600" : "bg-emerald-600"}`}>
                          {isAirport ? "Điểm đến" : "Chuyến bay"}
                        </span>
                      </div>
                    ) : (
                      <div className={`flex h-44 items-center justify-center ${isAirport ? "bg-gradient-to-br from-blue-50 to-blue-100" : "bg-gradient-to-br from-emerald-50 to-emerald-100"}`}>
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isAirport ? "bg-blue-100" : "bg-emerald-100"}`}>
                          <Icon className={`h-8 w-8 ${isAirport ? "text-blue-400" : "text-emerald-400"}`} />
                        </div>
                        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-white ${isAirport ? "bg-blue-600" : "bg-emerald-600"}`}>
                          {isAirport ? "Điểm đến" : "Chuyến bay"}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="mt-0.5 text-sm text-slate-500 truncate">{item.subtitle}</p>
                          )}
                        </div>
                        <Heart className="h-4 w-4 shrink-0 fill-rose-500 text-rose-500 mt-0.5" />
                      </div>

                      <p className="mt-2 text-[11px] text-slate-400">
                        Đã lưu: {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </p>

                      {/* Action buttons */}
                      <div className="mt-4 flex gap-2">
                        {isAirport ? (
                          <button
                            onClick={() => handleSearchDestination(item.title)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#006CE4] py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
                          >
                            <Search className="h-4 w-4" />
                            Tìm chuyến bay
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBookFlight(item.itemId)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                          >
                            <Plane className="h-4 w-4" />
                            Đặt vé ngay
                          </button>
                        )}
                        <button
                          onClick={() => removeFavorite.mutate(item.id)}
                          disabled={removeFavorite.isPending}
                          className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:opacity-50"
                          title="Bỏ yêu thích"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
