import { ArrowRight, CheckCircle, Shield, Bell, BarChart, Users } from "lucide-react"
import Link from "next/link"
import AgentDiagram from "@/components/ai-agent/agent-diagram"
import ArchitectureSection from "@/components/ai-agent/architecture-section"
import EmailSignup from "@/components/ai-agent/email-signup"
import DashboardPreview from "@/components/ai-agent/dashboard-preview"
import FeatureComparison from "@/components/ai-agent/feature-comparison"
import DeveloperSection from "@/components/ai-agent/developer-section"
import PitchDeckCTA from "@/components/ai-agent/pitch-deck-cta"
import ErrorBoundary from "@/components/error-boundary"

export default function PatchlinePage() {
  return (
    <main className="min-h-screen bg-eclipse text-light overflow-hidden">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-neon-magenta">Patchline:</span>{" "}
            <span className="bg-gradient-to-r from-neon-cyan to-neon-magenta text-transparent bg-clip-text">
              Orchestrate your Music Business with AI Agents
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-light/80 mb-10 max-w-3xl mx-auto">
            A full-stack, AI-first platform with specialized agents that automate and optimize workflows across A&R,
            legal, catalog management, sync licensing, and fan engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#cta"
              className="bg-neon-cyan text-eclipse hover:bg-neon-cyan/80 px-6 py-3 rounded-md text-lg font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              Book a Demo <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#dashboard"
              className="bg-eclipse border border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-eclipse px-6 py-3 rounded-md text-lg font-medium transition-colors"
            >
              See the Platform
            </Link>
          </div>
          <p className="text-light/70 mt-6 text-sm">AgentOS for the Music Industry</p>
        </div>
      </section>

      {/* Pitch Deck CTA */}
      <section className="container mx-auto px-4 mb-20">
        <PitchDeckCTA />
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            The Music Industry is Ready for <span className="text-neon-cyan">AI Transformation</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-eclipse/50 border border-light/10 p-6 rounded-lg hover:border-neon-cyan/50 transition-all">
              <h3 className="text-xl font-semibold mb-3">Operational Inefficiency</h3>
              <p className="text-light/80">
                Independent labels struggle with manual workflows that major labels automate with expensive custom
                systems.
              </p>
            </div>
            <div className="bg-eclipse/50 border border-light/10 p-6 rounded-lg hover:border-neon-cyan/50 transition-all">
              <h3 className="text-xl font-semibold mb-3">Scattered Tools</h3>
              <p className="text-light/80">
                Fragmented workflows across dozens of platforms create inefficiency and data silos.
              </p>
            </div>
            <div className="bg-eclipse/50 border border-light/10 p-6 rounded-lg hover:border-neon-cyan/50 transition-all">
              <h3 className="text-xl font-semibold mb-3">Missed Opportunities</h3>
              <p className="text-light/80">
                Manual processes can't keep pace with the volume of potential artists, tracks, and licensing deals.
              </p>
            </div>
            <div className="bg-eclipse/50 border border-light/10 p-6 rounded-lg hover:border-neon-cyan/50 transition-all">
              <h3 className="text-xl font-semibold mb-3">Legal Friction</h3>
              <p className="text-light/80">
                Contract review and rights management create bottlenecks that slow down business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-magenta/5"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Your <span className="text-neon-cyan">Command Center</span>
          </h2>
          <p className="text-xl text-light/80 text-center mb-16 max-w-3xl mx-auto">
            A unified platform where AI agents handle complex tasks while keeping humans in control
          </p>

          <ErrorBoundary>
            <DashboardPreview />
          </ErrorBoundary>
        </div>
      </section>

      {/* Solution Overview */}
      <section id="solution" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Our <span className="text-neon-cyan">Solution</span>
          </h2>
          <p className="text-xl text-light/80 text-center mb-16 max-w-3xl mx-auto">
            A modular ecosystem of specialized AI agents that work together to transform your music business
          </p>

          <ErrorBoundary>
            <AgentDiagram />
          </ErrorBoundary>

          <div className="mt-16 text-center">
            <p className="text-lg text-light/80 max-w-3xl mx-auto">
              Our platform connects specialized AI agents through an intelligent orchestration layer, enabling seamless
              workflows across all aspects of the music business while maintaining human oversight.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            How It <span className="text-neon-magenta">Works</span>
          </h2>
          <p className="text-xl text-light/80 text-center mb-16 max-w-3xl mx-auto">
            Our architecture combines powerful AI agents with human expertise
          </p>

          <ErrorBoundary>
            <ArchitectureSection />
          </ErrorBoundary>
        </div>
      </section>

      {/* Feature Comparison */}
      <section id="features" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Operational <span className="text-neon-cyan">Superpowers</span>
          </h2>
          <p className="text-xl text-light/80 text-center mb-16 max-w-3xl mx-auto">
            See how our platform compares to traditional music business operations
          </p>

          <FeatureComparison />
        </div>
      </section>

      {/* Developer Section */}
      <section id="developers" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-magenta/5"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            For <span className="text-neon-magenta">Developers</span>
          </h2>
          <p className="text-xl text-light/80 text-center mb-16 max-w-3xl mx-auto">
            Integrate our AI agents into your existing workflows and applications
          </p>

          <DeveloperSection />
        </div>
      </section>

      {/* Human in the Loop Section */}
      <section id="human-in-the-loop" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Human-in-the-<span className="text-neon-cyan">Loop</span>
          </h2>
          <p className="text-xl text-light/80 text-center mb-8 max-w-3xl mx-auto">
            Our platform enhances human expertise rather than replacing it
          </p>

          <div className="max-w-4xl mx-auto glassmorphic rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-neon-cyan/20 p-3 rounded-full">
                    <Users className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Collaborative Decision Making</h3>
                    <p className="text-light/80">
                      AI agents handle research and analysis, but humans make the final decisions on signings,
                      contracts, and creative direction.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-neon-magenta/20 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-neon-magenta" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Compliance & Oversight</h3>
                    <p className="text-light/80">
                      Built-in guardrails ensure all agent actions comply with your label's policies, industry
                      regulations, and ethical standards.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-neon-green/20 p-3 rounded-full">
                    <Bell className="h-6 w-6 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Approval Workflows</h3>
                    <p className="text-light/80">
                      Configure which actions require human approval and which can be automated, with customizable
                      thresholds and criteria.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-neon-cyan/20 p-3 rounded-full">
                    <BarChart className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Performance Feedback</h3>
                    <p className="text-light/80">
                      Agents learn from human feedback, continuously improving their recommendations and adapting to
                      your label's evolving preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now / Market Shift */}
      <section className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Why <span className="text-neon-magenta">Now</span>
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-eclipse/50 border border-light/10 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">The AI Paradigm Shift</h3>
              <p className="text-light/80 mb-6">
                The industry is moving from model-centric to agent-centric AI, where intelligent systems can perform
                complex tasks autonomously. The music industry, with its structured workflows and digital-first
                approach, is perfectly positioned to benefit from this shift.
              </p>
              <div className="flex flex-col space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-neon-cyan" />
                  </div>
                  <p className="ml-3 text-light/80">
                    <span className="font-medium">Model-centric → Agent-centric:</span> AI is evolving from
                    single-purpose models to orchestrated agents that can handle complex workflows
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-neon-cyan" />
                  </div>
                  <p className="ml-3 text-light/80">
                    <span className="font-medium">Digital transformation:</span> The music industry has already
                    digitized its core assets and processes
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-neon-cyan" />
                  </div>
                  <p className="ml-3 text-light/80">
                    <span className="font-medium">Scale challenges:</span> The volume of content being created demands
                    intelligent automation
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-neon-cyan" />
                  </div>
                  <p className="ml-3 text-light/80">
                    <span className="font-medium">Democratization:</span> Independent labels need enterprise-level tools
                    to compete with major labels
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Vision */}
      <section className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-magenta/5"></div>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Our <span className="text-neon-cyan">Vision</span>
          </h2>
          <p className="text-xl text-light/80 max-w-3xl mx-auto mb-10">
            We're bringing AgentOps to creative industries, starting with music. Our mission is to empower independent
            labels with enterprise-level operational efficiency, enabling them to compete directly with major labels
            while maintaining their creative independence.
          </p>
          <div className="flex justify-center">
            <div className="glassmorphic px-8 py-6 rounded-lg inline-block">
              <p className="text-lg italic text-light/80">
                "We're building the future where AI handles the business, so artists and labels can focus on the music."
              </p>
              <p className="mt-4 font-medium">— Founder & CEO</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="cta" className="py-20 relative">
        <div className="absolute inset-0 noise-bg opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 via-transparent to-neon-magenta/20"></div>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the AI Music Revolution</h2>
          <p className="text-xl text-light/80 max-w-2xl mx-auto mb-10">
            Be among the first to transform your music business with our AI agent platform. Limited spots available for
            our pilot program.
          </p>

          <EmailSignup />

          <p className="mt-6 text-sm text-light/70">
            By signing up, you'll receive updates about our product and early access opportunities.
          </p>
        </div>
      </section>
    </main>
  )
}
