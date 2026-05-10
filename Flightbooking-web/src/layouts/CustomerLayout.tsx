import { Outlet, Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "../stores/useAuthStore"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, History, UserCircle, Plane } from "lucide-react"

export default function CustomerLayout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b flex items-center px-4 md:px-8 shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="font-bold text-xl text-primary flex items-center gap-2">
          <Plane className="w-6 h-6" />
          <span>SkyBooking</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
            <Link to="/flights" className="transition-colors hover:text-primary">Chuyến bay</Link>
            <Link to="#" className="transition-colors hover:text-primary">Ưu đãi</Link>
            <Link to="#" className="transition-colors hover:text-primary">Hỗ trợ</Link>
          </nav>
          
          <div className="flex items-center space-x-2 ml-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline-block">{user?.fullName || "Tài khoản"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Thông tin cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/history")} className="cursor-pointer">
                    <History className="w-4 h-4 mr-2" />
                    Lịch sử đặt vé
                  </DropdownMenuItem>
                  {user?.role === "Admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                      <Plane className="w-4 h-4 mr-2" />
                      Quản lý hệ thống
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium transition-colors hover:text-primary px-4 py-2">Đăng nhập</Link>
                <Link to="/register" className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="border-t py-6 md:py-12 bg-muted/40">
        <div className="container px-4 md:px-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SkyBooking. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
