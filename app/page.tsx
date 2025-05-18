import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Waveform } from "@/components/waveform"
import { AnimatedCounter } from "@/components/animated-counter"
import { Search, FileText, Users, Database, Sparkles, Zap, Globe, Layers, Music2 } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section with Waveform Background */}
        <section className="relative py-12 md:py-16 overflow-hidden neural-network">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50 pointer-events-none" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full border border-cosmic-teal/30 bg-cosmic-teal/10 text-cosmic-teal text-sm">
                <Sparkles className="h-4 w-4 mr-2" />
                <span>Revolutionizing the music industry</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                Orchestrate your Music Business with <span className="gradient-text">AI Agents</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                A full-stack, AI-first platform with specialized agents, Patchline connects your data, simplifies your
                workflows, and gives music professionals time back.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="px-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  <Link href="#">Book a Demo</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Waveform visualization */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 opacity-40">
            <Waveform barCount={40} className="h-16" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>

        {/* Problem Statement with Animated Counters */}
        <section className="py-8 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">The Music Industry Challenge</h2>

              <div className="grid md:grid-cols-3 gap-4 mb-5">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 text-cosmic-teal">
                    <AnimatedCounter end={180} suffix="M+" />
                  </div>
                  <p className="text-muted-foreground">Songs Released Globally by 2024</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 text-cosmic-teal">
                    <AnimatedCounter end={99} suffix="K+" />
                  </div>
                  <p className="text-muted-foreground">Daily Track Uploads</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 text-cosmic-teal">
                    <AnimatedCounter end={87} suffix="%" />
                  </div>
                  <p className="text-muted-foreground">Receive fewer than 1,000 streams</p>
                </div>
              </div>

              <p className="text-lg text-center text-muted-foreground">
                The music industry is oversaturated at the bottom, concentrated at the top. Independent creators lack
                access to the professional tools major labels use. Human-led A&R can't keep up with the volume of new
                music. Metadata chaos, rights complexity, and fragmented operations slow everyone down.
              </p>
            </div>
          </div>
        </section>

        {/* Solution Overview */}
        <section className="py-8">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Agent-Driven Infrastructure for Music Professionals
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our AI agents handle the tedious tasks so you can focus on what matters most - creating music.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Search className="h-10 w-10 text-cosmic-teal" />,
                  title: "Scout Agent",
                  description: "Find promising talent based on growth metrics and sonic qualities",
                },
                {
                  icon: <FileText className="h-10 w-10 text-cosmic-teal" />,
                  title: "Legal Agent",
                  description: "Draft contracts, flag rights issues, suggest licensing terms",
                },
                {
                  icon: <Database className="h-10 w-10 text-cosmic-teal" />,
                  title: "Metadata Agent",
                  description: "Auto-tag catalogs, clean metadata, ensure sync-ready formatting",
                },
                {
                  icon: <Users className="h-10 w-10 text-cosmic-teal" />,
                  title: "Fan Agent",
                  description: "Generate tailored outreach for different fan segments",
                },
                {
                  icon: <Zap className="h-10 w-10 text-cosmic-pink" />,
                  title: "Build Your Own",
                  description: "Create custom agents for your specific workflow needs",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="glass-effect rounded-xl p-6 transition-all duration-300 hover:border-cosmic-teal/50"
                >
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2 font-heading">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Advantages */}
        <section className="py-8 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Advantages</h2>
              <p className="text-xl text-muted-foreground">What makes Patchline different</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: <Music2 className="h-8 w-8 text-cosmic-teal" />,
                  title: "Vertical Focus",
                  description: "Built specifically for music's complex data and nuanced workflows",
                },
                {
                  icon: <Layers className="h-8 w-8 text-cosmic-teal" />,
                  title: "End-to-End Orchestration",
                  description: "Not a point tool, but a complete AI operations layer",
                },
                {
                  icon: <Zap className="h-8 w-8 text-cosmic-teal" />,
                  title: "Fast Setup",
                  description: "Pre-built agents with customizable hooks to your existing systems",
                },
                {
                  icon: <Globe className="h-8 w-8 text-cosmic-teal" />,
                  title: "Cross-Entity Usability",
                  description: "Works for labels, artists, educators, and operations teams",
                },
              ].map((item, index) => (
                <div key={index} className="text-center p-6">
                  <div className="mx-auto mb-4 rounded-full bg-cosmic-teal/10 p-3 w-16 h-16 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-heading">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder Quote */}
        <section className="py-8">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="glass-effect rounded-xl p-8 text-center shimmer-bg">
                <p className="text-xl md:text-2xl italic mb-6">
                  "We're building the future where AI handles the business, so artists and labels can focus on the
                  music."
                </p>
                <footer className="text-muted-foreground">
                  <p className="font-medium">— Founder & CEO</p>
                </footer>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the Pilot Program</h2>
              <p className="text-xl text-muted-foreground mb-8">
                We're looking for labels, schools, and artists to shape the future of music AI
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="px-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  <Link href="#">Book a Demo</Link>
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
