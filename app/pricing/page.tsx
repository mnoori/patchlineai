"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { GradientOrbs, PageGradient, Card, Button } from "@/components/brand"
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section - Compact */}
        <section className="relative py-12 pb-4 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="subtle" className="opacity-80" />
          <div className="container relative z-10">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white mb-2">
                Pricing
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Choose the plan that works for you
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Plans - RIGHT EDGE */}
        <section className="relative pt-2 pb-12 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-right" className="opacity-25" />
          <div className="container relative z-10">
            <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  variant={plan.highlighted ? "gradient" : "outlined"}
                  hover="glow"
                  className={`p-8 backdrop-blur-sm ${plan.highlighted ? "" : "bg-black/20"} relative`}
                >
                  {plan.highlighted && (
                    <Badge className="bg-brand-cyan text-black border-0 px-4 py-1 absolute top-8 right-8">
                      Most Popular
                    </Badge>
                  )}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-3">{plan.name}</h2>
                    <div className="flex items-baseline mb-3">
                      <span className="text-4xl font-bold">
                        {plan.price.monthly === 0 ? "Free" : plan.price.monthly === 299 ? "Custom" : `$${plan.price.monthly}`}
                      </span>
                      {plan.price.monthly > 0 && plan.price.monthly !== 299 && (
                        <span className="text-muted-foreground ml-2">/month</span>
                      )}
                    </div>
                    <p className="text-lg font-medium">{plan.tagline}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features
                      .filter(feature => !feature.includes("Up to 5,000 tracks"))
                      .map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-brand-cyan mr-3 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    asChild
                    variant={plan.highlighted ? "gradient" : "outline"}
                    className="w-full mb-6"
                  >
                    <Link href={plan.id === UserTier.ULTRA ? "/contact" : "/dashboard"}>
                      {plan.ctaText}
                    </Link>
                  </Button>

                  {/* Target Personas */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-3">IDEAL FOR:</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.personas.slice(0, 3).map((persona, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Add-ons - LEFT EDGE */}
        <section className="relative py-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-left" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Optional Add-ons</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {addOns.map((addon, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    hover="glow"
                    className="p-6 backdrop-blur-sm bg-black/20 relative"
                  >
                    {addon.comingSoon && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-2">{addon.name}</h3>
                    <p className="text-brand-cyan font-medium mb-3">{addon.price}</p>
                    <p className="text-muted-foreground text-sm mb-4">{addon.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={addon.comingSoon}
                    >
                      {addon.comingSoon ? "Coming Soon" : "Add to Plan"}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Section - RIGHT EDGE */}
        <section className="relative py-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-right" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Solutions</h2>
                <p className="text-lg text-muted-foreground">
                  For larger labels, distributors, and educational institutions, we offer custom solutions including:
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-12">
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
                    <Check className="h-5 w-5 text-brand-cyan shrink-0 mt-0.5" />
                    <span className="text-lg text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - SUBTLE BOTTOM */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <PageGradient variant="vibrant" className="opacity-30" />
          <GradientOrbs variant="subtle-bottom" />
          <div className="container relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join the music professionals already using Patchline AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                <Link href="/dashboard">Start Free Trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-[200px]">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
