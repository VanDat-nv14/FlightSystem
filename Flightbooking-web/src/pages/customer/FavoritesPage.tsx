import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Plane, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { favoriteService } from "../../services/favorite.service";

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["customer-favorites"],
    queryFn: () => favoriteService.getMyFavorites(),
  });

  const removeFavorite = useMutation({
    mutationFn: favoriteService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-favorites"] }),
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container px-4 md:px-8">
        <div className="mb-8">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-600">
            <Heart className="h-4 w-4 fill-rose-600" />
            Của bạn
          </p>
          <h1 className="text-3xl font-black text-slate-900">Danh sách yêu thích</h1>
          <p className="mt-2 text-slate-500">Các chuyến bay và điểm đến bạn đã lưu lại.</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-white p-8 text-slate-500">Đang tải...</div>
        ) : favorites.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Heart className="mx-auto mb-4 h-10 w-10 text-slate-200" />
            <p className="font-semibold text-slate-900">Bạn chưa lưu mục yêu thích nào.</p>
            <p className="mt-1 text-sm text-slate-500">Bấm biểu tượng trái tim ở điểm đến hoặc chuyến bay để lưu lại.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map(item => {
              const Icon = item.itemType === "Flight" ? Plane : MapPin;
              return (
                <div key={item.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-slate-100">
                      <Icon className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                        {item.itemType === "Flight" ? "Chuyến bay" : "Điểm đến"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-red-600 hover:text-red-700"
                      onClick={() => removeFavorite.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Bỏ yêu thích
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
