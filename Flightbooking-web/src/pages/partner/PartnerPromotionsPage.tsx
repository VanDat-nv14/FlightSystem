import { useMemo, useState } from "react";
import { Check, Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControl } from "@/components/ui/pagination-control";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { promotionService, type CreatePromotionRequest, type UpdatePromotionRequest, type PromotionDto } from "../../services/promotion.service";

type PromotionStatus = "Active" | "Paused" | "Expired";

const STATUS_LABEL: Record<string, string> = {
  Active: "Đang chạy",
  Paused: "Tạm dừng",
  Expired: "Hết hạn",
  Upcoming: "Sắp diễn ra",
};

export default function PartnerPromotionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [status, setStatus] = useState<PromotionStatus>("Active");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["partner-promotions"],
    queryFn: promotionService.getMine,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromotionRequest) => promotionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-promotions"] });
      resetForm();
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || "Có lỗi xảy ra khi tạo khuyến mãi.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePromotionRequest }) =>
      promotionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-promotions"] });
      resetForm();
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => promotionService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-promotions"] }),
  });

  const filtered = useMemo(() =>
    promotions.filter((p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
    ), [promotions, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedPromotions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function resetForm() {
    setEditingId(null);
    setCode("");
    setName("");
    setDiscountPercent("10");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setStatus("Active");
  }

  function editPromotion(item: PromotionDto) {
    setEditingId(item.id);
    setCode(item.code);
    setName(item.name);
    setDiscountPercent(item.discountPercent.toString());
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setStatus((item.status === "Expired" || item.status === "Upcoming" ? "Active" : item.status) as PromotionStatus);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      discountPercent: Math.max(1, Math.min(100, Number(discountPercent) || 1)),
      startDate,
      endDate,
      status,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Khuyến mãi</h2>
        <p className="text-muted-foreground text-sm mt-1">Tạo và quản lý mã ưu đãi cho hãng bay của bạn.</p>
      </div>

      <form onSubmit={submit} className="rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2 xl:col-span-1">
            <Label>Mã</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="SKY10"
              className="uppercase"
              disabled={editingId !== null} // Không cho đổi mã khi đang edit
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label>Tên chương trình</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ưu đãi hè" />
          </div>
          <div className="space-y-2">
            <Label>Giảm (%)</Label>
            <Input type="number" min={1} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PromotionStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Đang chạy</SelectItem>
                <SelectItem value="Paused">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1 gap-2" disabled={isPending}>
              {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isPending ? "Đang lưu..." : editingId ? "Lưu" : "Thêm"}
            </Button>
            {editingId && <Button type="button" variant="outline" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Ngày bắt đầu</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Ngày kết thúc</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>
        {errorMsg && (
          <p className="mt-3 text-sm text-red-500 font-medium">{errorMsg}</p>
        )}
      </form>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm mã hoặc tên..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <Badge variant="outline">{filtered.length} mã</Badge>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã ưu đãi</TableHead>
              <TableHead>Tên chương trình</TableHead>
              <TableHead>Giảm</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Đang tải...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Chưa có khuyến mãi nào.</TableCell>
              </TableRow>
            ) : paginatedPromotions.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono font-bold text-primary">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.discountPercent}%</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.startDate} → {item.endDate}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.status === "Active" ? "default" :
                    item.status === "Paused" ? "secondary" :
                    item.status === "Upcoming" ? "outline" : "destructive"
                  }>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => editPromotion(item)}><Edit2 className="h-4 w-4" /></Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 bg-card p-3 rounded-lg border shadow-sm">
          <div className="text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{paginatedPromotions.length}</span> trên tổng số <span className="font-medium text-foreground">{filtered.length}</span> mã
          </div>
          <PaginationControl currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
