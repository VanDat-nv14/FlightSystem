import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit2, Lock, Plus, Search, Unlock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { partnerTeamService } from "../../services/partner-team.service";
import type { CreateUserRequest, UpdateUserRequest, UserListItem } from "../../services/user.service";
import { useAuthStore } from "../../stores/useAuthStore";

interface TeamModalProps {
  mode: "create" | "edit";
  user?: UserListItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: CreateUserRequest | UpdateUserRequest) => void;
}

function TeamModal({ mode, user, isSaving, onClose, onSave }: TeamModalProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create") {
      onSave({ fullName, email, phoneNumber, password, role: "AirlineManager" });
    } else {
      onSave({ fullName, phoneNumber, role: "AirlineManager" });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{mode === "create" ? "Thêm nhân sự" : "Cập nhật nhân sự"}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Họ và tên</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label>Số điện thoại</Label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label>Mật khẩu</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isSaving}>
              <Check className="h-4 w-4" />
              Lưu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PartnerTeamPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [message, setMessage] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["partner-team", currentUser?.airlineId],
    queryFn: partnerTeamService.getAll,
    enabled: !!currentUser?.airlineId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => partnerTeamService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-team"] });
      setModalMode(null);
      setMessage("Đã thêm nhân sự mới.");
    },
    onError: (err: any) => setMessage(err?.response?.data?.message || "Không thể thêm nhân sự."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) => partnerTeamService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-team"] });
      setModalMode(null);
      setEditingUser(null);
      setMessage("Đã cập nhật nhân sự.");
    },
    onError: (err: any) => setMessage(err?.response?.data?.message || "Không thể cập nhật nhân sự."),
  });

  const lockMutation = useMutation({
    mutationFn: (id: number) => partnerTeamService.toggleLock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-team"] }),
  });

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleSave(data: CreateUserRequest | UpdateUserRequest) {
    if (modalMode === "create") createMutation.mutate(data as CreateUserRequest);
    if (modalMode === "edit" && editingUser) updateMutation.mutate({ id: editingUser.id, data: data as UpdateUserRequest });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nhân sự</h2>
          <p className="text-muted-foreground text-sm mt-1">Quản lý tài khoản quản trị thuộc hãng bay của bạn.</p>
        </div>
        <Button className="gap-2" onClick={() => setModalMode("create")}>
          <Plus className="h-4 w-4" />
          Thêm nhân sự
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline">{filtered.length} nhân sự</Badge>
      </div>

      {message && <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{message}</div>}

      <div className="relative min-h-[280px] overflow-hidden rounded-lg border bg-card">
        {isLoading && <div className="absolute inset-0 z-10 grid place-items-center bg-background/50 text-sm text-muted-foreground">Đang tải...</div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân sự</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Chưa có nhân sự nào.</TableCell>
              </TableRow>
            ) : filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.fullName}</div>
                  <div className="text-xs text-muted-foreground">ID #{item.id}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{item.email}</div>
                  <div className="text-xs text-muted-foreground">{item.phoneNumber || "-"}</div>
                </TableCell>
                <TableCell><Badge>{item.role}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>{item.isLocked ? <Badge variant="destructive">Đã khóa</Badge> : <Badge variant="secondary">Hoạt động</Badge>}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setEditingUser(item); setModalMode("edit"); }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => lockMutation.mutate(item.id)}>
                      {item.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {modalMode && (
        <TeamModal
          mode={modalMode}
          user={editingUser}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => { setModalMode(null); setEditingUser(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
