import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function PricingPage() {
  const plans = [
    {
      name: "Artist",
      price: "$29",
      period: "/month",
      description: "Perfect for independent artists and small teams.",
      features: [
        "2 agents of your choice",
        "1 team seat",
        "Basic reports (PDF only)",
        "Email support",
        "1,000 tracks/month processing",
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Label",
      price: "$199",
      period: "/month",
      description: "For labels and growing music businesses.",
      features: [
        "All agents",
        "5 team seats",
        "Advanced reports with exports",
        "Priority support",
        "10,000 tracks/month processing",
        "API access",
        "Custom integrations",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For larger labels, distributors, and educational institutions.",
      features: [
        "All agents + custom development",
        "Unlimited team seats",
        "Custom reporting solutions",
        "Dedicated support",
        "Unlimited data processing",
        "Priority API access",
        "Custom integrations",
        "SLA guarantees",
        "Private deployment options",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  const addOns = [
    {
      name: "Additional Team Members",
      price: "+$19/seat/mo",
      description: "Add more users to your account",
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
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`glass-effect rounded-xl p-6 relative ${
                    plan.popular
                      ? "border-cosmic-teal/50 ring-1 ring-cosmic-teal/50"
                      : "border-border hover:border-cosmic-teal/30"
                  } transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cosmic-teal px-3 py-1 rounded-full text-xs font-medium text-black">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2 font-heading">{plan.name}</h2>
                    <div className="flex items-baseline mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full ${
                      plan.popular
                        ? "bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                        : "bg-transparent border border-cosmic-teal text-cosmic-teal hover:bg-cosmic-teal/10"
                    }`}
                  >
                    <Link href="/dashboard">{plan.cta}</Link>
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
