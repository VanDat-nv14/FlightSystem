import { FlightSearchForm } from "../../components/customer/FlightSearchForm"

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        {/* Placeholder for background image */}
        <div className="absolute inset-0 bg-primary/10 dark:bg-primary/5" />
        <div className="relative z-10 text-center space-y-4 px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Khám phá thế giới cùng chúng tôi
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Đặt vé máy bay dễ dàng, trải nghiệm hành trình tuyệt vời.
          </p>
        </div>
      </section>

      {/* Search Form */}
      <section className="container px-4 md:px-8 -mt-24 relative z-20">
        <FlightSearchForm />
      </section>
      
      {/* Spacer */}
      <div className="h-32" />
    </div>
  )
}
