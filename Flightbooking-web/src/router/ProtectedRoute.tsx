import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../stores/useAuthStore"

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Nếu đã đăng nhập nhưng không có role phù hợp, chuyển hướng về trang chủ
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
