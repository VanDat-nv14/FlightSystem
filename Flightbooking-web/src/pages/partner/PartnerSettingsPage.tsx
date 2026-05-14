import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ImagePlus, Loader2, Settings, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { partnerAirlineService, type UpdatePartnerAirlineRequest } from "../../services/partner-airline.service";
import { useAuthStore } from "../../stores/useAuthStore";

export default function PartnerSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState("");

  const { data: airline, isLoading, error } = useQuery({
    queryKey: ["partner-airline", user?.airlineId],
    queryFn: partnerAirlineService.getMine,
    enabled: !!user?.airlineId,
  });

  useEffect(() => {
    if (!airline) return;
    setName(airline.name ?? "");
    setCountry(airline.country ?? "");
    setLogoUrl(airline.logoUrl ?? "");
    setIsActive(airline.isActive);
  }, [airline]);

  const mutation = useMutation({
    mutationFn: (data: UpdatePartnerAirlineRequest) => partnerAirlineService.updateMine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-airline"] });
      setMessage("Đã lưu cài đặt hãng bay.");
    },
    onError: (err: any) => setMessage(err?.response?.data?.message || "Không thể lưu cài đặt hãng bay."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      name,
      country: country.trim() || null,
      logoUrl: logoUrl.trim() || null,
      isActive,
    });
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn file hình ảnh.");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setMessage("Ảnh logo tối đa 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(String(reader.result));
      setMessage("Đã chọn ảnh logo từ máy tính. Bấm Lưu thay đổi để cập nhật.");
    };
    reader.readAsDataURL(file);
  }

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center text-muted-foreground">Đang tải cài đặt...</div>;
  }

  if (error || !airline) {
    return <div className="flex h-48 items-center justify-center text-destructive">Không thể tải thông tin hãng bay.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cài đặt hãng</h2>
        <p className="text-muted-foreground text-sm mt-1">Cập nhật thông tin hiển thị của hãng bay.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Thông tin hãng bay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mã hãng</Label>
                  <Input value={airline.code} disabled className="font-semibold bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Quốc gia</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Vietnam" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tên hãng</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tên hãng bay" />
              </div>

              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="flex flex-wrap gap-2">
                <Label htmlFor="airline-logo-file" className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
                  <Upload className="mr-2 h-4 w-4" />
                  Chọn ảnh từ máy tính
                </Label>
                <input
                  id="airline-logo-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
                {logoUrl && (
                  <Button type="button" variant="outline" className="gap-2" onClick={() => setLogoUrl("")}>
                    <Trash2 className="h-4 w-4" />
                    Xóa logo
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Mở bán chuyến bay</div>
                  <p className="text-sm text-muted-foreground">Tắt mục này nếu hãng tạm ngưng hoạt động trên hệ thống.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              {message && <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{message}</div>}

              <Button type="submit" className="gap-2" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Lưu thay đổi
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImagePlus className="h-5 w-5 text-primary" />
              Logo hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="h-full w-full object-contain p-6" />
              ) : (
                <div className="text-4xl font-bold text-primary">{airline.code}</div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Trạng thái: <span className="font-medium text-foreground">{airline.status}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
