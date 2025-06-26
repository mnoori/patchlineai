import Link from "next/link"
import { Logo } from "@/components/logo"
import { GradientOrbs } from "@/components/brand"

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-gradient-to-b from-background/50 to-background backdrop-blur-sm overflow-hidden">
      {/* Very subtle gradient continuation */}
      <GradientOrbs variant="subtle-bottom" className="opacity-10" />
      <div className="container py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo className="h-8 w-auto" />
            <p className="text-sm text-muted-foreground">The Invisible Agentic AI Layer for the Music Industry</p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-brand-cyan transition-colors">
                <span className="sr-only">Twitter</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-brand-cyan transition-colors">
                <span className="sr-only">Instagram</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-brand-cyan transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4 font-heading">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4 font-heading">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4 font-heading">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-brand-cyan transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Patchline AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
