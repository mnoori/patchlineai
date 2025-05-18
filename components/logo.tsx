import { cn } from "@/lib/utils"
import { TRSCableLogo } from "./icons/trs-cable-logo"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <TRSCableLogo className="h-8 w-8 mr-2 text-cosmic-teal" />
      <span className="font-heading font-bold text-xl">Patchline AI</span>
    </div>
  )
}
