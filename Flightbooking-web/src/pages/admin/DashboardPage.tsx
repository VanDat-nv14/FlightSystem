export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Tổng quan</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Tổng doanh thu", value: "$45,231.89", desc: "+20.1% so với tháng trước" },
          { title: "Chuyến bay", value: "320", desc: "+15% so với tháng trước" },
          { title: "Khách hàng mới", value: "+2350", desc: "+180.1% so với tháng trước" },
          { title: "Số lượng đặt vé", value: "1,234", desc: "+19% so với tháng trước" },
        ].map((stat, idx) => (
          <div key={idx} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-2">
            <h3 className="tracking-tight text-sm font-medium">{stat.title}</h3>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 col-span-4 min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Revenue Chart Placeholder</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 col-span-3 min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Recent Bookings Placeholder</p>
        </div>
      </div>
    </div>
  )
}
