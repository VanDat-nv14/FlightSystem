import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, Lock, Unlock, Search, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { userService, type UserListItem, type CreateUserRequest, type UpdateUserRequest } from "../../services/user.service"

const ROLES = ["Admin", "Employee", "Customer"]

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  if (role === "Admin") return "destructive"
  if (role === "Employee") return "default"
  return "secondary"
}

interface UserModalProps {
  mode: "create" | "edit"
  user?: UserListItem | null
  onClose: () => void
  onSave: (data: CreateUserRequest | UpdateUserRequest) => void
  isSaving: boolean
}

function UserModal({ mode, user, onClose, onSave, isSaving }: UserModalProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState(user?.role ?? "Customer")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "create") {
      onSave({ fullName, email, phoneNumber, password, role } as CreateUserRequest)
    } else {
      onSave({ fullName, phoneNumber, role } as UpdateUserRequest)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl shadow-xl p-8 w-full max-w-md border"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{mode === "create" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Họ và tên</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Nguyễn Văn A" />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="user@example.com" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Số điện thoại</Label>
            <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} type="tel" placeholder="0987654321" />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label>Mật khẩu</Label>
              <Input value={password} onChange={e => setPassword(e.target.value)} required type="password" placeholder="••••••••" minLength={6} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu</>}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: userService.getAll,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setModalMode(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) => userService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setModalMode(null); setEditingUser(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setDeleteConfirmId(null) },
  })

  const toggleLockMutation = useMutation({
    mutationFn: (id: number) => userService.toggleLock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  })

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleSave(data: CreateUserRequest | UpdateUserRequest) {
    if (modalMode === "create") {
      createMutation.mutate(data as CreateUserRequest)
    } else if (modalMode === "edit" && editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: data as UpdateUserRequest })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h2>
        <Button className="gap-2" onClick={() => setModalMode("create")}>
          <Plus className="w-4 h-4" /> Thêm người dùng
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm kiếm theo tên, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="text-sm">{filtered.length} người dùng</Badge>
      </div>

      <div className="bg-card text-card-foreground rounded-xl shadow-sm border overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-muted-foreground">
            Lỗi tải dữ liệu. Vui lòng thử lại.
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  Không có người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{user.id}</TableCell>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.phoneNumber || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    {user.isLocked
                      ? <Badge variant="destructive">Đã khóa</Badge>
                      : <Badge variant="secondary">Hoạt động</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline" size="icon"
                        title="Chỉnh sửa"
                        onClick={() => { setEditingUser(user); setModalMode("edit") }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline" size="icon"
                        title={user.isLocked ? "Mở khóa" : "Khóa"}
                        onClick={() => toggleLockMutation.mutate(user.id)}
                      >
                        {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      {deleteConfirmId === user.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(user.id)}>
                            Xóa
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>Hủy</Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive" size="icon"
                          title="Xóa"
                          onClick={() => setDeleteConfirmId(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AnimatePresence>
        {modalMode && (
          <UserModal
            mode={modalMode}
            user={editingUser}
            onClose={() => { setModalMode(null); setEditingUser(null) }}
            onSave={handleSave}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
