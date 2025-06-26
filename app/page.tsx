import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Waveform } from "@/components/waveform"
import { AnimatedCounter } from "@/components/animated-counter"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Users, Database, Sparkles, Zap, Globe, Layers, Music2, ArrowRight } from "lucide-react"
import { Button, GradientText, Card, CardHeader, CardTitle, CardDescription, CardContent, PageGradient, GradientOrbs, MeshGradient, HeroSection } from "@/components/brand"
import { AGENTS } from "@/config/agents"

export default function Home() {
  const ariaAgent = AGENTS.aria
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative -mt-16 min-h-screen flex items-center justify-center">
          <HeroSection
            title="Revolutionizing the Music Industry"
            subtitle="with Intelligent Infrastructure"
            features={[
              { title: "Label OS", description: "Smart dashboards for record labels" },
              { title: "Modular AI Agents", description: "Specialized tools for royalties, metadata, and marketing" },
              { title: "Real-Time Collaboration", description: "AI tools for artists, managers, and teams to co-create" },
            ]}
            showLogo
            logoSize="xl"
            className="pt-16"
          />

          {/* CTA Buttons */}
          <div className="absolute bottom-20 left-0 right-0 z-20">
            <div className="container">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                  <Link href="/contact">Book a Demo</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-w-[200px]">
                  <Link href="#demo">Watch Video</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ARIA Introduction Section - RIGHT EDGE */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-right" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto">
              <Card variant="gradient" className="p-10 text-center backdrop-blur-xl">
                <Badge className="mb-6 bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20 px-4 py-1">
                  Flagship Product
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Meet <span className={ariaAgent.gradientClass}>{ariaAgent.displayName}</span> — Your Agentic Record Label
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                  {ariaAgent.displayName} is our most advanced offering - an AI-first infrastructure that orchestrates all your agents 
                  to create autonomous label operations. From talent discovery to revenue distribution, 
                  {ariaAgent.displayName} handles the complex workflows while you maintain creative control.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild variant="gradient" size="lg" className="group">
                    <Link href="/aria" className="flex items-center">
                      <span>Explore {ariaAgent.displayName}</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/dashboard">Try Free</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Problem Statement - LEFT EDGE */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background">
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-center">The Music Industry Challenge</h2>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-3 text-brand-cyan">
                    <AnimatedCounter end={180} suffix="M+" />
                  </div>
                  <p className="text-muted-foreground text-lg">Songs Released Globally by 2024</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-3 text-brand-cyan">
                    <AnimatedCounter end={99} suffix="K+" />
                  </div>
                  <p className="text-muted-foreground text-lg">Daily Track Uploads</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-3 text-brand-cyan">
                    <AnimatedCounter end={87} suffix="%" />
                  </div>
                  <p className="text-muted-foreground text-lg">Receive fewer than 1,000 streams</p>
                </div>
              </div>

              <p className="text-lg text-center text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                The music industry is oversaturated at the bottom, concentrated at the top. Independent creators lack
                access to the professional tools major labels use. Human-led A&R can't keep up with the volume of new
                music. Metadata chaos, rights complexity, and fragmented operations slow everyone down.
              </p>
            </div>
          </div>
        </section>

        {/* Solution Overview - LEFT EDGE */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-background to-background">
          <GradientOrbs variant="edge-left" className="opacity-25" />
          <div className="container relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-6">
                Agent-Driven Infrastructure for Music Professionals
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our AI agents handle the tedious tasks so you can focus on what matters most - creating music.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Search className="h-10 w-10 text-brand-cyan" />,
                  title: "Scout Agent",
                  description: "Find promising talent based on growth metrics and sonic qualities",
                },
                {
                  icon: <FileText className="h-10 w-10 text-brand-cyan" />,
                  title: "Legal Agent",
                  description: "Draft contracts, flag rights issues, suggest licensing terms",
                },
                {
                  icon: <Database className="h-10 w-10 text-brand-cyan" />,
                  title: "Metadata Agent",
                  description: "Auto-tag catalogs, clean metadata, ensure sync-ready formatting",
                },
                {
                  icon: <Users className="h-10 w-10 text-brand-cyan" />,
                  title: "Fan Agent",
                  description: "Generate tailored outreach for different fan segments",
                },
                {
                  icon: <Zap className="h-10 w-10 text-brand-bright-blue" />,
                  title: "Build Your Own",
                  description: "Create custom agents for your specific workflow needs",
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  hover="glow"
                  className="p-8 backdrop-blur-sm bg-black/20"
                >
                  <div className="mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Core Advantages - Transition glow */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-background to-background">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-6">Core Advantages</h2>
              <p className="text-xl text-muted-foreground">What makes Patchline different</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: <Music2 className="h-8 w-8 text-brand-cyan" />,
                  title: "Vertical Focus",
                  description: "Built specifically for music's complex data and nuanced workflows",
                },
                {
                  icon: <Layers className="h-8 w-8 text-brand-cyan" />,
                  title: "End-to-End Orchestration",
                  description: "Not a point tool, but a complete AI operations layer",
                },
                {
                  icon: <Zap className="h-8 w-8 text-brand-cyan" />,
                  title: "Fast Setup",
                  description: "Pre-built agents with customizable hooks to your existing systems",
                },
                {
                  icon: <Globe className="h-8 w-8 text-brand-cyan" />,
                  title: "Cross-Entity Usability",
                  description: "Works for labels, artists, educators, and operations teams",
                },
              ].map((item, index) => (
                <div key={index} className="text-center p-6">
                  <div className="mx-auto mb-6 rounded-full bg-brand-cyan/10 backdrop-blur-sm p-4 w-20 h-20 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder Quote - LEFT EDGE */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-background via-background to-background">
          <GradientOrbs variant="edge-left" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto">
              <Card variant="glass" className="p-10 text-center backdrop-blur-xl border-white/5">
                <p className="text-xl md:text-2xl italic mb-8 leading-relaxed">
                  "In today's music industry, time spent on admin is time lost on discovering, developing, and amplifying talent. We're giving that time back to labels and everyone who makes this industry thrive."
                </p>
                <footer className="text-muted-foreground">
                  <p className="font-medium text-lg">— Founder & CEO</p>
                </footer>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section with gradient - SUBTLE BOTTOM */}
        <section className="relative py-20 pb-32 bg-gradient-to-b from-background via-background to-background">
          <PageGradient variant="vibrant" className="opacity-30" />
          <GradientOrbs variant="subtle-bottom" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-semibold mb-8">Join the Pilot Program</h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                We're looking for labels, schools, and artists to shape the future of music AI
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                  <Link href="/contact">Book a Demo</Link>
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
