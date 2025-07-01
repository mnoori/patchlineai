import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection, GradientOrbs, PageGradient, Card, Button } from "@/components/brand"
import { Badge } from "@/components/ui/badge"

import { Zap, Shield, Globe, ArrowRight, Music, Users, BarChart3, Clock } from "lucide-react"
import { ARIA_CONFIG } from "@/config/aria"

export default function AriaPage() {
  const aria = ARIA_CONFIG

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero + What is Aria combined */}
        <section className="relative -mt-16 min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="dispersed" />
          <div className="container relative z-10 text-center space-y-10 pt-40">
            <Badge className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 px-4 py-1">
              <span className="text-brand-cyan font-bold">{aria.name}</span>
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight max-w-4xl mx-auto">
              Our Flagship Agentic Record Label
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              <span className="text-brand-cyan font-bold">{aria.name}</span> orchestrates a specialised team of AI agents to run a modern label.
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-10">
              {[
                {
                  icon: <Zap className="h-8 w-8 text-brand-cyan mx-auto" />,
                  title: "Autonomous Operations",
                  desc: "Agents collaborate to execute label workflows without constant oversight.",
                },
                {
                  icon: <Shield className="h-8 w-8 text-brand-cyan mx-auto" />,
                  title: "Human Oversight",
                  desc: "You set strategy & approve key decisions while AI handles execution.",
                },
                {
                  icon: <Globe className="h-8 w-8 text-brand-cyan mx-auto" />,
                  title: "Global Scale",
                  desc: "Operate in every market and timezone without expanding headcount.",
                },
              ].map((item, i) => (
                <Card key={i} variant="gradient" hover="glow" className="p-8 backdrop-blur-sm text-center">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 text-brand-cyan">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </Card>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                <Link href="/contact">{aria.cta.primary}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works – LEFT EDGE */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-background to-background">
          <GradientOrbs variant="edge-left" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-5xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">How <span className="text-brand-cyan font-bold">{aria.name}</span> Works</h2>
            </div>
            {/* simplified steps */}
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  step: "Discovery & Acquisition",
                  desc: "A&R agents scan 99k+ daily uploads and predict breakout potential.",
                },
                {
                  step: "Contracts & Negotiation",
                  desc: "Legal agents draft and negotiate fair contracts in minutes.",
                },
                {
                  step: "Development & Distribution",
                  desc: "Marketing agents build campaigns and distribute to 200+ platforms.",
                },
                {
                  step: "Revenue & Growth",
                  desc: "Finance agents automate royalty calculations and payouts in real-time.",
                },
              ].map((s, idx) => (
                <Card key={idx} variant="gradient" className="p-8 text-left backdrop-blur-xl">
                  <h3 className="text-xl font-bold mb-2 text-brand-cyan">{idx + 1}. {s.step}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA – subtle bottom */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <PageGradient variant="vibrant" className="opacity-30" />
          <GradientOrbs variant="subtle-bottom" />
          <div className="container relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">Ready to Launch Your Music Business?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Let <span className="text-brand-cyan font-bold">{aria.name}</span> handle the operations while you shape the vision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                <Link href="/pricing">{aria.cta.secondary}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 