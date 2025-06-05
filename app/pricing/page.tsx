"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TIER_CONFIGS, UserTier } from "@/lib/tier-config"
import { Badge } from "@/components/ui/badge"

export default function PricingPage() {
  // Filter out GOD_MODE from public pricing
  const plans = Object.values(TIER_CONFIGS).filter(tier => tier.id !== UserTier.GOD_MODE)

  const addOns = [
    {
      name: "Additional Team Members",
      price: "+$9/seat/mo",
      description: "Add more users to your Roster account",
    },
    {
      name: "Premium Agents",
      price: "+$29/agent/mo",
      description: "Add specialized agents when available",
      comingSoon: true,
    },
    {
      name: "Additional Processing",
      price: "$0.01/track",
      description: "For catalogs exceeding your plan limit",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12 neural-network">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
                Fair Pricing for <span className="gradient-text">All Music Professionals</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                We believe AI tools should be accessible to independent creators, not just major labels. Our pricing
                reflects that commitment.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-8">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`glass-effect rounded-xl p-6 relative ${
                    plan.highlighted
                      ? "border-cosmic-teal/50 ring-1 ring-cosmic-teal/50"
                      : "border-border hover:border-cosmic-teal/30"
                  } transition-all duration-300`}
                >
                  {plan.highlighted && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cosmic-teal px-3 py-1 rounded-full text-xs font-medium text-black">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2 font-heading">{plan.name}</h2>
                    <div className="flex items-baseline mb-2">
                      <span className="text-4xl font-bold">
                        {plan.price.monthly === 0 ? "Free" : plan.price.monthly === 299 ? "Custom" : `$${plan.price.monthly}`}
                      </span>
                      {plan.price.monthly > 0 && plan.price.monthly !== 299 && (
                        <span className="text-muted-foreground ml-1">/month</span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{plan.tagline}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  {/* Target Personas */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">IDEAL FOR:</p>
                    <div className="flex flex-wrap gap-1">
                      {plan.personas.slice(0, 3).map((persona, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    asChild
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                        : "bg-transparent border border-cosmic-teal text-cosmic-teal hover:bg-cosmic-teal/10"
                    }`}
                  >
                    <Link href={plan.id === UserTier.ENTERPRISE ? "/contact" : "/dashboard"}>
                      {plan.ctaText}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Add-ons */}
        <section className="py-10">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center font-heading">Optional Add-ons</h2>
              <div className="grid md:grid-cols-3 gap-5">
                {addOns.map((addon, index) => (
                  <div
                    key={index}
                    className="glass-effect rounded-xl p-5 relative hover:border-cosmic-teal/30 transition-all duration-300"
                  >
                    {addon.comingSoon && (
                      <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-muted px-2 py-1 rounded-full text-xs font-medium">
                        Coming Soon
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-1 font-heading">{addon.name}</h3>
                    <p className="text-cosmic-teal font-medium mb-1">{addon.price}</p>
                    <p className="text-muted-foreground text-sm mb-3">{addon.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-cosmic-teal text-cosmic-teal hover:bg-cosmic-teal/10"
                      disabled={addon.comingSoon}
                    >
                      {addon.comingSoon ? "Coming Soon" : "Add to Plan"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Section */}
        <section className="py-10 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 font-heading">Enterprise Solutions</h2>
                <p className="text-lg text-muted-foreground">
                  For larger labels, distributors, and educational institutions, we offer custom solutions including:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  "Private deployment options",
                  "Custom agent development",
                  "Dedicated support team",
                  "SLA guarantees",
                  "Custom integrations",
                  "Advanced analytics",
                  "Tailored onboarding",
                  "Compliance documentation",
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-cosmic-teal shrink-0 mt-0.5" />
                    <span className="text-lg">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button asChild size="lg" className="px-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">Ready to get started?</h2>
              <p className="text-xl text-muted-foreground mb-6">
                Join the music professionals already using Patchline AI.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="px-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  <Link href="/dashboard">Start Free Trial</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 border-cosmic-teal text-cosmic-teal hover:bg-cosmic-teal/10"
                >
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
