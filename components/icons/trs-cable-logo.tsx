import Image from "next/image"

export function TRSCableLogo({ className }: { className?: string }) {
  return (
    <Image src="/logo.png" alt="Patchline AI Logo" width={40} height={40} className={className} />
  )
}
