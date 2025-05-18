"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { AuthButton } from "@/components/auth-button"

const navItems = [
  { name: "Home", href: "/" },
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
                  "text-sm font-medium transition-colors hover:text-cosmic-teal",
                  pathname === item.href ? "text-cosmic-teal" : "text-muted-foreground",
                )}
              >
                {item.name}
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
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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
                "block py-2 text-base font-medium transition-colors hover:text-cosmic-teal",
                pathname === item.href ? "text-cosmic-teal" : "text-muted-foreground",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 flex flex-col space-y-3">
            <Button asChild className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
