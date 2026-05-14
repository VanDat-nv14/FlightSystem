import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, Loader2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { accountService, type UpdateProfileRequest, type UserProfile } from "../../services/account.service"
import { useAuthStore } from "../../stores/useAuthStore"

const genderToValue: Record<string, string> = {
  Male: "0",
  Female: "1",
  Other: "2",
}

function toDateInput(value?: string | null) {
  if (!value) return ""
  return value.slice(0, 10)
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"
}

function buildForm(profile?: UserProfile) {
  return {
    fullName: profile?.fullName ?? "",
    phoneNumber: profile?.phoneNumber ?? "",
    dateOfBirth: toDateInput(profile?.dateOfBirth),
    gender: profile?.gender ? genderToValue[profile.gender] ?? "" : "",
    nationality: profile?.nationality ?? "",
    idCardNumber: profile?.idCardNumber ?? "",
    passportNumber: profile?.passportNumber ?? "",
    passportExpiry: toDateInput(profile?.passportExpiry),
    urlAvatar: profile?.urlAvatar ?? "",
  }
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const queryClient = useQueryClient()
  const authUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [form, setForm] = useState(buildForm())
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["account-profile"],
    queryFn: accountService.getProfile,
  })

  useEffect(() => {
    if (profile) setForm(buildForm(profile))
  }, [profile])

  const avatarPreview = form.urlAvatar || profile?.urlAvatar || authUser?.urlAvatar || ""
  const initials = useMemo(
    () => getInitials(form.fullName || profile?.fullName || authUser?.fullName || "User"),
    [authUser?.fullName, form.fullName, profile?.fullName]
  )

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleAvatarChange(file?: File) {
    setError("")
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh.")
      return
    }
    if (file.size > 1_500_000) {
      setError("Ảnh đại diện tối đa 1.5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => updateField("urlAvatar", String(reader.result ?? ""))
    reader.onerror = () => setError("Không thể đọc file ảnh.")
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setError("")

    if (!form.fullName.trim()) {
      setError("Họ tên không được để trống.")
      return
    }

    const payload: UpdateProfileRequest = {
      fullName: form.fullName.trim(),
      phoneNumber: emptyToNull(form.phoneNumber),
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender === "" ? null : Number(form.gender),
      nationality: emptyToNull(form.nationality),
      idCardNumber: emptyToNull(form.idCardNumber),
      passportNumber: emptyToNull(form.passportNumber),
      passportExpiry: form.passportExpiry || null,
      urlAvatar: form.urlAvatar || null,
    }

    try {
      setIsSaving(true)
      await accountService.updateProfile(payload)
      await queryClient.invalidateQueries({ queryKey: ["account-profile"] })
      updateUser({
        fullName: payload.fullName,
        urlAvatar: payload.urlAvatar,
      })
      setMessage("Cập nhật thông tin cá nhân thành công.")
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thông tin cá nhân</h1>
          <p className="text-sm text-muted-foreground">Cập nhật hồ sơ, giấy tờ và ảnh đại diện của bạn.</p>
        </div>
        {profile?.role && <Badge variant="secondary">{profile.role}</Badge>}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className="rounded-lg border bg-card p-5 h-fit">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar className="h-32 w-32 border shadow-sm">
              <AvatarImage src={avatarPreview} alt={form.fullName} className="object-cover" />
              <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{form.fullName || "Tài khoản"}</div>
              <div className="text-sm text-muted-foreground">{profile?.email}</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleAvatarChange(event.target.files?.[0])}
            />
            <div className="flex w-full flex-col gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4" />
                Chọn ảnh
              </Button>
              {form.urlAvatar && (
                <Button type="button" variant="ghost" className="gap-2 text-muted-foreground" onClick={() => updateField("urlAvatar", "")}>
                  <X className="h-4 w-4" />
                  Xóa ảnh
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Hỗ trợ JPG, PNG, WebP. Dung lượng tối đa 1.5MB.</p>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input id="fullName" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input id="phoneNumber" value={form.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngày sinh</Label>
              <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Giới tính</Label>
              <Select value={form.gender} onValueChange={(value) => updateField("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nam</SelectItem>
                  <SelectItem value="1">Nữ</SelectItem>
                  <SelectItem value="2">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Quốc tịch</Label>
              <Input id="nationality" value={form.nationality} onChange={(event) => updateField("nationality", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idCardNumber">CCCD/CMND</Label>
              <Input id="idCardNumber" value={form.idCardNumber} onChange={(event) => updateField("idCardNumber", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportNumber">Số hộ chiếu</Label>
              <Input id="passportNumber" value={form.passportNumber} onChange={(event) => updateField("passportNumber", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportExpiry">Ngày hết hạn hộ chiếu</Label>
              <Input id="passportExpiry" type="date" value={form.passportExpiry} onChange={(event) => updateField("passportExpiry", event.target.value)} />
            </div>
          </div>

          {(message || error) && (
            <div className={`mt-5 rounded-md border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {error || message}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSaving} className="gap-2 min-w-36">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu thay đổi
            </Button>
          </div>
        </section>
      </form>
    </div>
  )
}
