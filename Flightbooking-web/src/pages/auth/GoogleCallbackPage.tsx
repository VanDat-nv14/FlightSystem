import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plane } from "lucide-react"
import { useAuthStore, type User } from "../../stores/useAuthStore"

function getRedirectPath(role: string) {
  if (role === "Admin" || role === "Employee") return "/admin"
  if (role === "AirlineManager") return "/partner"
  return "/"
}

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const accessToken = params.get("accessToken")
      const refreshToken = params.get("refreshToken")
      const userRaw = params.get("user")

      if (!accessToken || !refreshToken || !userRaw) {
        navigate("/login?error=google_failed", { replace: true })
        return
      }

      const user = JSON.parse(userRaw) as User
      if (!user?.id || !user.email || !user.role) {
        navigate("/login?error=google_failed", { replace: true })
        return
      }

      setAuth(user, accessToken, refreshToken)
      navigate(getRedirectPath(user.role), { replace: true })
    } catch {
      navigate("/login?error=google_failed", { replace: true })
    }
  }, [navigate, setAuth])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Plane className="h-6 w-6 text-primary animate-pulse" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Đăng nhập Google</h1>
        <p className="text-sm text-muted-foreground">Đang hoàn tất phiên đăng nhập của bạn...</p>
      </div>
    </div>
  )
}
