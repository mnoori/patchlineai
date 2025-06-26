import { Logo as BrandLogo } from '@/components/brand'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return <BrandLogo size="lg" showText={true} className={className} />
}
