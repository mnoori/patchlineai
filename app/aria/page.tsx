import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, Globe, BarChart3, Users, Music, Shield, Clock } from "lucide-react"

export default function AriaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12 md:py-16 neural-network">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-6 bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/30">
                Introducing Aria
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                The World's First <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">Agentic Record Label</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                An AI-first, full-stack infrastructure that automates label operations while you maintain 
                creative control. Scale your label intelligently with autonomous workflows.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="px-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  <Link href="/dashboard">Start Free Trial</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8">
                  <Link href="#demo">Watch Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What is Aria Section */}
        <section className="py-12">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">What is <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">Aria</span>?</h2>
              <div className="prose prose-lg mx-auto text-center">
                <p className="text-muted-foreground">
                  Aria is Patchline's flagship agentic record label system. It orchestrates a team of specialized 
                  AI agents to handle every aspect of running a modern label - from A&R discovery to royalty 
                  distribution. Think of it as your label's AI-powered executive team that never sleeps.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-cosmic-teal" />
                  </div>
                  <h3 className="font-bold mb-2">Autonomous Operations</h3>
                  <p className="text-sm text-muted-foreground">
                    AI agents work together to run your label operations without constant human intervention
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-cosmic-teal" />
                  </div>
                  <h3 className="font-bold mb-2">Human Oversight</h3>
                  <p className="text-sm text-muted-foreground">
                    You set the strategy and approve key decisions while AI handles the execution
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-cosmic-teal" />
                  </div>
                  <h3 className="font-bold mb-2">Global Scale</h3>
                  <p className="text-sm text-muted-foreground">
                    Operate in every market and timezone simultaneously without expanding your team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">How <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">Aria</span> Works</h2>
              
              <div className="space-y-8">
                <div className="glass-effect rounded-xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-4">1. Discovery & Acquisition</h3>
                  <p className="text-muted-foreground mb-4">
                    Aria's A&R agents continuously scan streaming platforms, social media, and music blogs to identify 
                    unsigned talent with breakout potential. Using predictive analytics, they assess artists based on 
                    growth velocity, engagement patterns, and market fit.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Analyzes 99,000+ daily track uploads</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Predicts breakout potential with 89% accuracy</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Automatically initiates artist outreach</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-effect rounded-xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-4">2. Contract & Negotiation</h3>
                  <p className="text-muted-foreground mb-4">
                    Legal agents draft fair, artist-friendly contracts in minutes instead of weeks. They handle 
                    negotiations based on market standards and artist potential, ensuring both parties benefit 
                    from the partnership.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Generates contracts from optimized templates</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Manages rights across 150+ countries</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Digital signature integration for instant execution</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-effect rounded-xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-4">3. Development & Distribution</h3>
                  <p className="text-muted-foreground mb-4">
                    Marketing and operations agents work together to develop artist brands, create campaigns, 
                    and distribute music globally. Every release is optimized for maximum impact across all 
                    platforms.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Distributes to 200+ platforms globally</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Creates personalized marketing campaigns</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Manages social media and fan engagement</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-effect rounded-xl p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-4">4. Revenue & Growth</h3>
                  <p className="text-muted-foreground mb-4">
                    Financial agents handle royalty calculations, distributions, and revenue optimization in 
                    real-time. Every stream is tracked, every payment is automated, and every artist gets 
                    transparent reporting.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Real-time royalty calculations and payments</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Transparent financial reporting</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5" />
                      <span>Revenue optimization strategies</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Why Choose <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">Aria</span>?</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold mb-2">For Independent Labels</h3>
                    <p className="text-muted-foreground">
                      Compete with majors without the overhead. Aria gives you enterprise-level capabilities 
                      at a fraction of the cost.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">For Established Labels</h3>
                    <p className="text-muted-foreground">
                      Augment your team with AI that handles routine tasks, letting your staff focus on 
                      high-value creative work.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">For Artists Running Labels</h3>
                    <p className="text-muted-foreground">
                      Focus on your music while Aria handles the business. It's like having a full label 
                      team in your pocket.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="glass-effect rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Time Saved</span>
                      <span className="text-2xl font-bold text-cosmic-teal">80%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cosmic-teal rounded-full" style={{ width: '80%' }} />
                    </div>
                  </div>
                  
                  <div className="glass-effect rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Cost Reduction</span>
                      <span className="text-2xl font-bold text-cosmic-teal">65%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cosmic-teal rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  
                  <div className="glass-effect rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Artist Satisfaction</span>
                      <span className="text-2xl font-bold text-cosmic-teal">94%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cosmic-teal rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Launch Your Agentic Label?
              </h2>
              <p className="text-xl text-muted-foreground mb-6">
                Join the future of record labels. Let <span className="bg-gradient-to-r from-purple-400 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent font-semibold">Aria</span> handle 
                the operations while you shape the vision.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="px-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  <Link href="/dashboard">Start 14-Day Free Trial</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8">
                  <Link href="/pricing">View Pricing</Link>
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