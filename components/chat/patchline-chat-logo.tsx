import { Logo } from '@/components/brand/logo'

export function PatchlineChatLogo({ className }: { className?: string }) {
  return (
    <Logo size="sm" showText className={className} background="gradient" />
  )
}
