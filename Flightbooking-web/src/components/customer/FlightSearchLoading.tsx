import { motion } from "framer-motion"
import { Plane } from "lucide-react"

export function FlightSearchLoading() {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-sm font-semibold text-gray-600">
        <span>Điểm đi</span>
        <span>Điểm đến</span>
      </div>
      <div className="relative h-16">
        <div className="absolute left-3 right-3 top-1/2 border-t-2 border-dashed border-blue-200" />
        <div className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-blue-500 bg-white" />
        <div className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-blue-500" />
        <motion.div
          className="absolute top-1/2 text-blue-600"
          initial={{ left: "2%", y: "-50%" }}
          animate={{ left: "92%", y: "-50%" }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plane className="h-7 w-7 rotate-45 drop-shadow" />
        </motion.div>
      </div>
      <div className="mt-3 flex justify-center">
        <motion.div
          className="h-2 w-24 rounded-full bg-blue-100"
          animate={{ opacity: [0.45, 1, 0.45], scaleX: [0.85, 1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>
    </div>
  )
}
