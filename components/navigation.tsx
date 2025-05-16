"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Updated navigation items based on the specification
  const navItems = [
    { name: "Team", href: "/team" },
    { name: "Pitch Deck", href: "/pitch-deck" },
    { name: "Login", href: "/login" },
    { name: "Contact", href: "/contact" },
  ]

  // Check for scroll for the header background effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const getNavItemClass = (item: { name: string; href: string }) => {
    if (pathname === item.href) {
      return "text-neon-cyan"
    }
    return "text-light/80"
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-eclipse/80 backdrop-blur-md py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <div className="text-neon-cyan font-heading text-2xl font-bold">Patchline</div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-neon-cyan ${getNavItemClass(item)}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <Button variant="ghost" size="icon" className="md:hidden text-light" onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-eclipse/95 z-50 flex flex-col"
          >
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <div className="text-neon-cyan font-heading text-2xl font-bold">Patchline</div>
              </Link>
              <Button variant="ghost" size="icon" className="text-light" onClick={() => setIsOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <motion.nav
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="flex flex-col items-center justify-center flex-1 gap-8"
            >
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-xl font-medium transition-colors hover:text-neon-cyan ${getNavItemClass(item)}`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navigation
