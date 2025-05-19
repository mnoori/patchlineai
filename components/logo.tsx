import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image src="/logo.png" alt="Patchline AI Logo" width={40} height={40} className="h-8 w-8 mr-2" />
      <span className="font-heading font-bold text-xl">Patchline AI</span>
    </div>
  )
}
