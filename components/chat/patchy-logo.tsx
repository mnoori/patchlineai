import { TRSCableIcon } from "../icons/trs-cable-icon"
import { cn } from "@/lib/utils"

interface PatchyLogoProps {
  className?: string
}

export function PatchyLogo({ className }: PatchyLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative w-6 h-6 mr-2">
        <div className="absolute inset-0 bg-cosmic-teal rounded-md opacity-20"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <TRSCableIcon className="w-4 h-4 text-cosmic-teal" />
        </div>
      </div>
      <span className="font-medium text-cosmic-teal">Patchy</span>
    </div>
  )
}
