"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { AuthButton } from "@/components/auth-button"

import { AGENTS } from "@/config/agents"

const navItems = [
  { name: "Home", href: "/" },
  { name: AGENTS.aria.displayName, href: "/aria", badge: "NEW" },
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container flex items-center justify-between py-4">
        <div className="flex items-center">
          <Link href="/" className="mr-8">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-brand-cyan",
                  pathname === item.href ? "text-brand-cyan" : "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  {item.name}
                  {item.badge && (
                    <Badge className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <AuthButton />
        </div>
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="md:hidden py-4 px-4 space-y-4 border-t border-border">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "block py-2 text-base font-medium transition-colors hover:text-brand-cyan",
                pathname === item.href ? "text-brand-cyan" : "text-muted-foreground",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center gap-2">
                {item.name}
                {item.badge && (
                  <Badge className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </span>
            </Link>
          ))}
          <div className="pt-4 flex flex-col space-y-3">
            <Button asChild variant="gradient">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
import { Button } from "@/components/brand"
