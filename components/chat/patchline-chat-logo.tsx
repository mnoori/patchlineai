import Image from "next/image"

export function PatchlineChatLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative w-6 h-6 mr-2">
        <Image src="/logo.png" alt="Patchline AI Logo" fill className="object-contain" />
      </div>
      <span className="font-semibold text-brand-cyan">Patch</span>
      <span className="font-normal text-foreground">AI</span>
    </div>
  )
}
