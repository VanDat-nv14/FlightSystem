import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { Plane, LayoutDashboard, Ticket, Users, FileText, LogOut, Building2 } from "lucide-react"
import { useAuthStore } from "../stores/useAuthStore"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { name: "Hãng bay", icon: Building2, to: "/admin/airlines" },
  { name: "Chuyến bay", icon: Plane, to: "/admin/flights" },
  { name: "Tuyến bay", icon: Ticket, to: "/admin/routes" },
  { name: "Sân bay", icon: Plane, to: "/admin/airports" },
  { name: "Máy bay", icon: Plane, to: "/admin/aircrafts" },
  { name: "Đặt vé", icon: Ticket, to: "/admin/bookings" },
  { name: "Người dùng", icon: Users, to: "/admin/users" },
  { name: "Báo cáo", icon: FileText, to: "/admin/reports" },
]

export default function AdminLayout() {
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
        <div className="h-16 border-b flex items-center px-6 font-bold text-lg gap-2">
          <Plane className="w-5 h-5 text-primary" />
          Admin Portal
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
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
          <div className="font-medium text-sm text-muted-foreground">SkyBooking Admin</div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user?.fullName}</div>
              <div className="text-xs text-muted-foreground">{user?.role}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
              {user ? getInitials(user.fullName) : "AD"}
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
