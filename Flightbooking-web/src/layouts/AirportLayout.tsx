import { Outlet, useNavigate } from "react-router-dom"
import { Plane, LogOut, ShieldAlert, Activity } from "lucide-react"
import { useAuthStore } from "../stores/useAuthStore"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AirportLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="h-16 border-b border-slate-800 flex items-center px-6 font-bold text-lg gap-2 text-sky-400">
          <Plane className="w-5 h-5 animate-pulse" />
          <span>Airport Control</span>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">Trạm Kiểm Soát</div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              {user?.airportCode || "SGN"}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Nhân viên mặt đất</div>
          </div>

          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-sm font-medium">
              <Activity className="w-4 h-4" />
              <span>Bảng Điều Hành</span>
            </div>
          </nav>
        </div>
        
        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-800">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Khu vực điều hành bay của Sân bay <strong>{user?.airportCode}</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{user?.fullName}</div>
              <div className="text-xs text-slate-400">Điều hành viên ({user?.airportCode})</div>
            </div>
            <Avatar className="h-9 w-9 border border-slate-700">
              <AvatarImage src={user?.urlAvatar || ""} alt={user?.fullName || "Staff"} className="object-cover" />
              <AvatarFallback className="bg-sky-500/20 text-sky-400 text-sm font-medium">
                {user ? getInitials(user.fullName) : "AP"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
