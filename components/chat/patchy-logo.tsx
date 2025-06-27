import Image from "next/image"
import { cn } from "@/lib/utils"

interface PatchyLogoProps {
  className?: string
}

export function PatchyLogo({ className }: PatchyLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative w-6 h-6 mr-2">
        <Image src="/logo.png" alt="Patchline AI Logo" fill className="object-contain" />
      </div>
      <span className="font-medium text-brand-cyan">Patchy</span>
    </div>
  )
}
