import Link from "next/link"
import Image from "next/image"
import { GradientOrbs, PageGradient, Card, Button } from "@/components/brand"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"

import {
  Search,
  FileText,
  Users,
  Database,
  Zap,
  MapPin,
  BarChart3,
  ArrowRight,
  Check,
  Cloud,
  Shield,
  FileTextIcon as FileText2,
} from "lucide-react"

export default function FeaturesPage() {
  const agents = [
    {
      icon: <Search className="h-10 w-10 text-brand-cyan" />,
      name: "Scout Agent",
      description: "Discover promising unsigned talent based on growth metrics, sound profile, and genre match before your competitors.",
      capabilities: [
        "Scores 99k+ songs daily using stream velocity and metadata",
        "Identifies artists with growth patterns similar to past successes",
        "Filters by genre, audience demographics, and sonic qualities",
        "Sends alerts when artists match your label's sound profile",
      ],
      image: "/music-analytics-dashboard.png",
    },
    {
      icon: <FileText className="h-10 w-10 text-brand-cyan" />,
      name: "Legal Agent",
      description: "Automatically monitor contracts and flag potential risks across your entire catalog to prevent costly oversights.",
      capabilities: [
        "Drafts contracts, flags rights issues, suggests licensing terms",
        "Identifies conflicting terms across multiple agreements",
        "Provides alerts for expiring contracts and deadlines",
        "Summarizes complex legal language in plain English",
      ],
      image: "/contract-management-dashboard.png",
    },
    {
      icon: <Database className="h-10 w-10 text-brand-cyan" />,
      name: "Metadata Agent",
      description: "Audit and auto-fill missing metadata fields in bulk to ensure your catalog is properly organized and ready for sync opportunities.",
      capabilities: [
        "Auto-tags catalogs, cleans up metadata, ensures sync-ready formatting",
        "Identifies missing or incorrect metadata across platforms",
        "Batch updates fields across multiple distribution channels",
        "Generates consistent metadata for new releases",
      ],
      image: "/music-metadata-management.png",
    },
    {
      icon: <Users className="h-10 w-10 text-brand-cyan" />,
      name: "Fan Agent",
      description: "Generate engaging content ideas and campaign posts tailored to different fan segments to maximize engagement.",
      capabilities: [
        "Generates GPT-based outreach tailored to fan segments",
        "Creates platform-specific social media content",
        "Schedules posts based on optimal engagement times",
        "Analyzes which content resonates with your audience",
      ],
      image: "/placeholder-owl5i.png",
    },
  ]

  const comingSoonAgents = [
    {
      icon: <Zap className="h-8 w-8 text-brand-cyan" />,
      name: "Tour Planner Agent",
      description: "Optimize tour routing and promotional strategies based on streaming and social data.",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-brand-cyan" />,
      name: "Release Optimizer Agent",
      description: "Maximize the impact of your releases with data-driven recommendations.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-brand-cyan" />,
      name: "Sync Agent",
      description: "Identify sync opportunities and manage licensing for film, TV, and advertising.",
    },
    {
      icon: <FileText2 className="h-8 w-8 text-brand-cyan" />,
      name: "Build Your Own Agent",
      description: "Create custom agents tailored to your specific workflow needs.",
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 pb-8 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="subtle" />
          <div className="container relative z-10 text-center px-4 pt-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white mb-4">
              AI Agents for Music Workflows
            </h1>
          </div>
        </section>

        {/* Agents Section */}
        <section className="relative pt-4 pb-8 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="transition" className="opacity-25" />
          <div className="container relative z-10">
            <div className="space-y-16">
              {agents.map((agent, index) => (
                <Card key={index} variant="gradient" className="overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className={`p-12 space-y-6 ${index % 2 === 1 ? "md:order-2" : ""}`}>
                      <div className="flex items-center gap-4">
                        {agent.icon}
                        <h2 className="text-2xl md:text-3xl font-bold">{agent.name}</h2>
                      </div>
                      <p className="text-lg text-muted-foreground">{agent.description}</p>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Key Capabilities:</h3>
                        <ul className="space-y-2">
                          {agent.capabilities.map((capability, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="h-5 w-5 text-brand-cyan mr-3 mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4">
                        <Button asChild variant="gradient" className="whitespace-nowrap">
                          <Link href="/contact" className="inline-flex items-center">
                            Try {agent.name}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className={`relative ${index % 2 === 1 ? "md:order-1" : ""}`}>
                      <Image
                        src={agent.image || "/placeholder.svg"}
                        alt={`${agent.name} interface`}
                        width={800}
                        height={600}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="relative py-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="transition" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">The Agent Ecosystem is Growing</h2>
              <p className="text-lg text-muted-foreground mt-4">
                We're constantly developing new agents to address more music industry workflows.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {comingSoonAgents.map((agent, index) => (
                <Card key={index} variant="outlined" hover="glow" className="p-6 text-center backdrop-blur-sm bg-black/20">
                  <div className="mb-4 flex justify-center">{agent.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{agent.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{agent.description}</p>
                  <Badge className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30">
                    Coming Soon
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Architecture Section */}
        <section className="relative py-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="transition" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Built for the Real World</h2>
              <p className="text-lg text-muted-foreground mt-4">
                Enterprise-grade infrastructure designed for music industry workflows.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Cloud className="h-8 w-8 text-brand-cyan" />,
                  title: "Cloud-Agnostic",
                  description: "Deploy on AWS, Azure, GCP, or your preferred cloud provider.",
                },
                {
                  icon: <Database className="h-8 w-8 text-brand-cyan" />,
                  title: "BYOC Support",
                  description: "Bring Your Own Cloud for complete data sovereignty.",
                },
                {
                  icon: <Shield className="h-8 w-8 text-brand-cyan" />,
                  title: "Enterprise Security",
                  description: "Industry-standard security and compliance protocols.",
                },
                {
                  icon: <FileText className="h-8 w-8 text-brand-cyan" />,
                  title: "Full Transparency",
                  description: "Transparent agent operations with complete audit trails.",
                },
              ].map((item, index) => (
                <Card key={index} variant="outlined" hover="glow" className="p-6 text-center backdrop-blur-sm bg-black/20">
                  <div className="mb-4 flex justify-center">{item.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <PageGradient variant="vibrant" className="opacity-30" />
          <GradientOrbs variant="subtle-bottom" />
          <div className="container relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">Ready to Transform Your Music Business?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join labels, artists, and music schools already using Patchline to work smarter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                <Link href="/contact">Request a Demo</Link>
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
