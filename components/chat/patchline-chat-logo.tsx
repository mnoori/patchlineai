import { Sparkles } from "lucide-react"

export function PatchlineChatLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative w-6 h-6 mr-2">
        <div className="absolute inset-0 bg-cosmic-teal rounded-full opacity-20"></div>
        <Sparkles className="absolute inset-0 w-6 h-6 text-cosmic-teal" />
      </div>
      <span className="font-semibold text-cosmic-teal">Patch</span>
      <span className="font-normal text-foreground">AI</span>
    </div>
  )
}
