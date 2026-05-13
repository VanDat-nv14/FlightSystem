import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { Plane, LayoutDashboard, Ticket, Users, FileText, LogOut, Settings, Building2 } from "lucide-react"
import { useAuthStore } from "../stores/useAuthStore"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, to: "/partner" },
  { name: "Chuyến bay", icon: Plane, to: "/partner/flights" },
  { name: "Máy bay", icon: Plane, to: "/partner/aircrafts" },
  { name: "Tuyến bay", icon: Ticket, to: "/partner/routes" },
  { name: "Giá & Hạng vé", icon: Ticket, to: "/partner/fares" },
  { name: "Đặt vé", icon: Ticket, to: "/partner/bookings" },
  { name: "Khuyến mãi", icon: FileText, to: "/partner/promotions" },
  { name: "Báo cáo", icon: FileText, to: "/partner/reports" },
  { name: "Cài đặt hãng", icon: Settings, to: "/partner/settings" },
  { name: "Nhân sự", icon: Users, to: "/partner/team" },
]

export default function PartnerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Lấy 2 chữ cái đầu của tên để làm avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col hidden md:flex">
        <div className="h-16 border-b flex items-center px-6 font-bold text-lg gap-2 text-primary">
          <Building2 className="w-5 h-5" />
          Airline Manager
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/partner"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Bottom actions */}
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
          <div className="font-medium text-sm text-muted-foreground">
            {user?.airlineId ? `Airline ID: ${user.airlineId}` : "Chưa liên kết hãng bay"}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user?.fullName}</div>
              <div className="text-xs text-muted-foreground">Quản lý Hãng bay</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
              {user ? getInitials(user.fullName) : "AM"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-muted/10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
