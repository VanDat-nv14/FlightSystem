import { useMemo, useState } from "react";
import { Check, Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "../../stores/useAuthStore";

type PromotionStatus = "Active" | "Paused" | "Expired";

interface Promotion {
  id: string;
  code: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
}

const STATUS_LABEL: Record<PromotionStatus, string> = {
  Active: "Đang chạy",
  Paused: "Tạm dừng",
  Expired: "Hết hạn",
};

function storageKey(airlineId?: number) {
  return `partner-promotions-${airlineId ?? "none"}`;
}

function loadPromotions(airlineId?: number): Promotion[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(airlineId)) || "[]");
  } catch {
    return [];
  }
}

function savePromotions(airlineId: number | undefined, data: Promotion[]) {
  localStorage.setItem(storageKey(airlineId), JSON.stringify(data));
}

export default function PartnerPromotionsPage() {
  const { user } = useAuthStore();
  const [promotions, setPromotions] = useState<Promotion[]>(() => loadPromotions(user?.airlineId));
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [status, setStatus] = useState<PromotionStatus>("Active");

  const filtered = useMemo(() => promotions.filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [promotions, search]);

  function persist(next: Promotion[]) {
    setPromotions(next);
    savePromotions(user?.airlineId, next);
  }

  function resetForm() {
    setEditingId(null);
    setCode("");
    setName("");
    setDiscountPercent("10");
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setStatus("Active");
  }

  function editPromotion(item: Promotion) {
    setEditingId(item.id);
    setCode(item.code);
    setName(item.name);
    setDiscountPercent(item.discountPercent.toString());
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setStatus(item.status);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Promotion = {
      id: editingId ?? crypto.randomUUID(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      discountPercent: Math.max(1, Math.min(100, Number(discountPercent) || 1)),
      startDate,
      endDate,
      status,
    };

    const next = editingId
      ? promotions.map((item) => item.id === editingId ? payload : item)
      : [payload, ...promotions];

    persist(next);
    resetForm();
  }

  function remove(id: string) {
    persist(promotions.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Khuyến mãi</h2>
        <p className="text-muted-foreground text-sm mt-1">Tạo và quản lý mã ưu đãi nội bộ cho hãng bay.</p>
      </div>

      <form onSubmit={submit} className="rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2 xl:col-span-1">
            <Label>Mã</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="SKY10" className="uppercase" />
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
                <SelectItem value="Expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1 gap-2">
              {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "Lưu" : "Thêm"}
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
      </form>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm mã hoặc tên..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Chưa có khuyến mãi nào.</TableCell>
              </TableRow>
            ) : filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono font-bold text-primary">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.discountPercent}%</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.startDate} - {item.endDate}</TableCell>
                <TableCell><Badge variant={item.status === "Active" ? "default" : item.status === "Paused" ? "secondary" : "destructive"}>{STATUS_LABEL[item.status]}</Badge></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => editPromotion(item)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
