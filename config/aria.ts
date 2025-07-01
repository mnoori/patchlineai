export const ARIA_CONFIG = {
  name: "ARIA",
  displayName: "ARIA",
  fullName: "ARIA - AI-Powered Music Business Assistant",
  description: "Your AI-powered music business assistant",
  tagline: "Experience the future of music business automation",
  badge: {
    text: "NEW",
    variant: "new" as const,
    className: "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
  },
  cta: {
    primary: "Request a Demo",
    secondary: "View Pricing"
  }
} as const

export type AriaConfig = typeof ARIA_CONFIG 