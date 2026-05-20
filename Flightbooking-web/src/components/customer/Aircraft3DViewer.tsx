import { useState } from "react"
import { motion } from "framer-motion"
import { Minus, Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Aircraft3DViewerProps {
  modelUrl?: string
}

export function Aircraft3DViewer({ modelUrl }: Aircraft3DViewerProps) {
  const [rotation, setRotation] = useState(18)
  const [zoom, setZoom] = useState(1)

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-sky-950/20">
      {modelUrl ? (
        <div className="flex h-full items-center justify-center text-sm text-white/70">
          Model ready: {modelUrl}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center [perspective:900px]">
          <motion.div
            animate={{ rotateY: rotation, rotateX: -8, scale: zoom, y: [-5, 5, -5] }}
            transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotateY: { duration: 0.35 }, scale: { duration: 0.25 } }}
            className="relative h-28 w-64 [transform-style:preserve-3d]"
          >
            <div className="absolute left-8 top-1/2 h-8 w-48 -translate-y-1/2 rounded-full bg-white shadow-[0_22px_55px_rgba(0,0,0,0.25)]" />
            <div className="absolute left-4 top-1/2 h-9 w-16 -translate-y-1/2 rounded-l-full bg-sky-100" />
            <div className="absolute right-3 top-1/2 h-7 w-10 -translate-y-1/2 rounded-r-full bg-slate-100" />
            <div className="absolute left-24 top-1/2 h-16 w-28 origin-left -translate-y-1/2 skew-x-[-18deg] rounded-[70%_20%_20%_70%] bg-blue-500/90" />
            <div className="absolute left-28 top-1/2 h-16 w-24 origin-left -translate-y-1/2 skew-x-[18deg] rounded-[70%_20%_20%_70%] bg-cyan-300/80 [transform:rotateX(180deg)_translateY(-18px)]" />
            <div className="absolute right-10 top-3 h-14 w-8 -rotate-12 rounded-t-full bg-blue-600" />
            <div className="absolute left-16 top-[46px] flex gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <span key={index} className="h-2 w-2 rounded-full bg-sky-300" />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex gap-2">
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setRotation(value => value - 35)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom(value => Math.max(0.8, value - 0.1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom(value => Math.min(1.35, value + 0.1))}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
