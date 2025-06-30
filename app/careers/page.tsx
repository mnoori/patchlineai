import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, MapPin, DollarSign, Percent, Calendar, Code2, Brain, Zap, Users } from "lucide-react"
import { GradientOrbs, PageGradient, Card, Button } from "@/components/brand"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Careers | Patchline AI",
  description: "Join us in building the future of AI-powered music business infrastructure.",
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section with DISPERSED orbs */}
        <section className="relative py-16 pb-8 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="dispersed" />
          <div className="container relative z-10">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white mb-2">
                Careers
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Join us in building the future of music business infrastructure
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section - LEFT EDGE */}
        <section className="relative pt-4 pb-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-left" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-7xl mx-auto">
              <Card variant="gradient" className="p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-brand-cyan">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  We're building an Agentic AI Platform for the Business of Music.
                </p>
                <p className="text-lg text-muted-foreground">
                  Our mission is simple: <span className="text-white font-semibold">give music professionals their time back.</span>
                </p>
                <p className="text-muted-foreground mt-4">
                  Label operations today are weighed down by repetitive workflows—metadata tagging, rights management, 
                  royalty mapping, catalogue QA, content creation and release planning. We're using disruptive AI systems 
                  to handle the grunt work, so teams across A&R, publishing ops, and catalogue strategy can focus on 
                  higher-leverage work.
                </p>
                <p className="text-muted-foreground mt-4">
                  The recorded music industry surpassed $29.6B in 2024. We have a clear plan to go after it. 
                  Strategy's done. Design's live. First deals in motion. <span className="text-white font-semibold">Now we need you.</span>
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Job Posting - RIGHT EDGE */}
        <section className="relative py-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-right" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Open Positions</h2>
              
              {/* Job Card */}
              <Card variant="outlined" hover="glow" className="overflow-hidden backdrop-blur-sm bg-black/20">
                <div className="p-8 md:p-10">
                  {/* Job Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-brand-cyan mb-2">
                        Lead/Founding AI Engineer
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>$60k – $70k</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Percent className="h-4 w-4" />
                          <span>0.5% – 1.5%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>Remote / Brooklyn</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                        Actively Hiring
                      </span>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>Posted Today</span>
                      </div>
                    </div>
                  </div>

                  {/* What You'll Do */}
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-brand-cyan" />
                      What You'll Do
                    </h4>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span><strong className="text-white">Architect and ship.</strong> You'll design and build full-stack AI-powered tools using AWS (Bedrock, Amplify, Lambda, Step Functions), vector databases, and a React + Next.js frontend.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span><strong className="text-white">Train our proprietary model.</strong> You'll lead the fine-tuning of a domain-specific LLM built for music metadata, rights intelligence, and royalty workflows.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span><strong className="text-white">Integrate deeply.</strong> You'll connect our platform into the messy world of music business APIs, spreadsheets, and legacy software.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span><strong className="text-white">Move fast.</strong> We ship every 2 weeks and demo live. Expect autonomy, trust, and accountability.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span><strong className="text-white">Collaborate closely.</strong> You'll co-design the roadmap with the founder, mentor junior contributors, and help shape the culture and bar of the engineering team.</span>
                      </li>
                    </ul>
                  </div>

                  {/* What You Bring */}
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-brand-cyan" />
                      What You Bring (Preferred)
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span>5+ years experience in full-stack engineering, with at least 2 years in production-grade ML/LLM systems</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span>Strong TypeScript and Python fundamentals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span>Deep AWS or equivalent cloud expertise, including serverless, CI/CD, and infra-as-code</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span>Experience integrating LLMs, vector DBs, and multi-agent orchestration (LangGraph, Autogen, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span>Experience with AI content creation tools</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span>Experience with workflow automation tools such as Zapier</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-cyan mt-1">•</span>
                        <span>A strong curiosity for music-tech and how the industry actually works</span>
                      </li>
                    </ul>
                  </div>

                  {/* Compensation & Perks */}
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-brand-cyan" />
                      Compensation & Perks
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <DollarSign className="h-5 w-5 text-brand-cyan mt-0.5" />
                          <div>
                            <p className="font-medium text-white">Contract Rate</p>
                            <p className="text-sm text-muted-foreground">$30/hr for initial sprint (with room to scale as revenue/funding grows)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Percent className="h-5 w-5 text-brand-cyan mt-0.5" />
                          <div>
                            <p className="font-medium text-white">Equity</p>
                            <p className="text-sm text-muted-foreground">XX% (flexible based on contribution), 4-year vest, 1-year cliff, acceleration on exit</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-brand-cyan">🎵</span>
                          <div>
                            <p className="font-medium text-white">Music Festival Pass</p>
                            <p className="text-sm text-muted-foreground">Annual ticket + travel to a global music festival of your choice</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-brand-cyan">☀️</span>
                          <div>
                            <p className="font-medium text-white">Summer Off-Fridays</p>
                            <p className="text-sm text-muted-foreground">From May through August</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-brand-cyan mt-0.5" />
                          <div>
                            <p className="font-medium text-white">Workstyle</p>
                            <p className="text-sm text-muted-foreground">Work wherever you thrive; drop by our Brooklyn studio anytime for a jam session</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="border-t border-border pt-8">
                    <p className="text-lg font-semibold mb-4">
                      Ready to build the future of music business infrastructure?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild variant="gradient" size="lg">
                        <a 
                          href="https://wellfound.com/jobs/3329710-lead-founding-ai-engineer?utm_campaign=startup_share&utm_content=startup_share_module&utm_medium=social&utm_term=patchline-ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                        >
                          Apply on Wellfound
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                      <Button asChild variant="outline" size="lg">
                        <Link href="/contact" className="inline-flex items-center">
                          Contact Us
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <p className="text-muted-foreground mt-6 text-lg italic">
                      Let's give music teams their time back—and make the boring parts beautiful.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Culture Section - SUBTLE BOTTOM */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <PageGradient variant="vibrant" className="opacity-30" />
          <GradientOrbs variant="subtle-bottom" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Card variant="glass" className="p-8 md:p-12 backdrop-blur-xl">
                <Users className="h-12 w-12 text-brand-cyan mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">Join Our Team</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  We're a small, passionate team building something that matters. If you're excited about 
                  using AI to transform how the music industry works, we'd love to hear from you.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
