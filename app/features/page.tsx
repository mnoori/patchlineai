import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FeaturesPage() {
  const agents = [
    {
      icon: <Search className="h-10 w-10 text-cosmic-teal" />,
      name: "Scout Agent",
      description:
        "Discover promising unsigned talent based on growth metrics, sound profile, and genre match before your competitors.",
      capabilities: [
        "Scores 99k+ songs daily using stream velocity, buzz, and metadata",
        "Identifies artists with growth patterns similar to past successes",
        "Filters by genre, audience demographics, and sonic qualities",
        "Sends alerts when artists match your label's sound profile",
      ],
      useCase:
        "Discover artists with growth potential that match your label's sound before they break into the mainstream.",
      image: "/music-analytics-dashboard.png",
      howItWorks: [
        "Ingests streaming data from multiple platforms (Spotify, SoundCloud, etc.)",
        "Analyzes growth patterns, engagement metrics, and sonic qualities",
        "Compares against your historical data and preferences",
        "Ranks and presents artists based on customizable scoring algorithms",
      ],
    },
    {
      icon: <FileText className="h-10 w-10 text-cosmic-teal" />,
      name: "Legal Agent",
      description:
        "Automatically monitor contracts and flag potential risks across your entire catalog to prevent costly oversights.",
      capabilities: [
        "Drafts contracts, flags rights issues, suggests licensing terms",
        "Identifies conflicting terms across multiple agreements",
        "Provides alerts for expiring contracts and deadlines",
        "Summarizes complex legal language in plain English",
      ],
      useCase: "Identify expiring contracts and rights issues before they become expensive problems.",
      image: "/contract-management-dashboard.png",
      howItWorks: [
        "Scans and indexes all contract documents using OCR and NLP",
        "Identifies key terms, dates, and obligations",
        "Compares against industry standards and your historical agreements",
        "Flags potential issues and suggests improvements",
      ],
    },
    {
      icon: <Database className="h-10 w-10 text-cosmic-teal" />,
      name: "Metadata Agent",
      description:
        "Audit and auto-fill missing metadata fields in bulk to ensure your catalog is properly organized and ready for sync opportunities.",
      capabilities: [
        "Auto-tags catalogs, cleans up metadata, ensures sync-ready formatting",
        "Identifies missing or incorrect metadata across platforms",
        "Batch updates fields across multiple distribution channels",
        "Generates consistent metadata for new releases",
      ],
      useCase: "Prepare your catalog for sync opportunities with complete, standardized metadata.",
      image: "/music-metadata-management.png",
      howItWorks: [
        "Analyzes your existing metadata across platforms",
        "Identifies gaps, inconsistencies, and errors",
        "Suggests corrections based on industry standards and your preferences",
        "Provides batch editing tools for efficient updates",
      ],
    },
    {
      icon: <Users className="h-10 w-10 text-cosmic-teal" />,
      name: "Fan Agent",
      description:
        "Generate engaging content ideas and campaign posts tailored to different fan segments to maximize engagement.",
      capabilities: [
        "Generates GPT-based outreach tailored to fan segments",
        "Creates platform-specific social media content",
        "Schedules posts based on optimal engagement times",
        "Analyzes which content resonates with your audience",
      ],
      useCase: "Create personalized campaigns that resonate with different listener groups.",
      image: "/placeholder-owl5i.png",
      howItWorks: [
        "Segments your audience based on listening habits and engagement",
        "Analyzes successful content patterns from your history and industry trends",
        "Generates tailored content ideas for each segment",
        "Provides scheduling and performance tracking",
      ],
    },
  ]

  const comingSoonAgents = [
    {
      icon: <Zap className="h-8 w-8 text-cosmic-pink" />,
      name: "Tour Planner Agent",
      description:
        "Optimize tour routing, venue selection, and promotional strategies based on streaming and social data.",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-cosmic-pink" />,
      name: "Release Optimizer Agent",
      description: "Maximize the impact of your releases with data-driven recommendations for timing and promotion.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-cosmic-pink" />,
      name: "Sync Agent",
      description: "Identify sync opportunities and manage licensing for film, TV, and advertising placements.",
    },
    {
      icon: <FileText2 className="h-8 w-8 text-cosmic-pink" />,
      name: "Build Your Own Agent",
      description: "Create custom agents tailored to your specific workflow needs using our developer framework.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-20 neural-network">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">
                AI Agents for Every <span className="gradient-text">Music Workflow</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Our suite of specialized AI agents handles the tedious tasks so you can focus on what matters most -
                creating and promoting great music.
              </p>
            </div>
          </div>
        </section>

        {/* Agents Section */}
        <section className="py-10">
          <div className="container">
            <div className="space-y-32">
              {agents.map((agent, index) => (
                <div key={index} className="relative">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className={`space-y-6 ${index % 2 === 1 ? "md:order-2" : ""}`}>
                      <div className="flex items-center space-x-3">
                        {agent.icon}
                        <h2 className="text-2xl md:text-3xl font-bold font-heading">{agent.name}</h2>
                      </div>
                      <p className="text-lg text-muted-foreground">{agent.description}</p>
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium font-heading">Key Capabilities:</h3>
                        <ul className="space-y-2">
                          {agent.capabilities.map((capability, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="h-5 w-5 text-cosmic-teal mr-2 mt-0.5 shrink-0" />
                              <span>{capability}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium font-heading">Use Case:</h3>
                        <p>{agent.useCase}</p>
                      </div>
                      <Button asChild className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                        <Link href="/dashboard">
                          Try {agent.name} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <div className={`${index % 2 === 1 ? "md:order-1" : ""}`}>
                      <div className="glass-effect rounded-xl overflow-hidden">
                        <Image
                          src={agent.image || "/placeholder.svg"}
                          alt={`${agent.name} interface`}
                          width={600}
                          height={400}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="how-it-works" className="border-cosmic-teal/30">
                        <AccordionTrigger className="text-lg font-heading text-cosmic-teal hover:text-cosmic-teal/90">
                          How It Works
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 border-l-2 border-cosmic-teal/30 mt-2">
                            <ol className="space-y-3">
                              {agent.howItWorks.map((step, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="font-medium text-cosmic-teal mr-2">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-20 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 font-heading">The Agent Ecosystem is Growing</h2>
              <p className="text-lg text-muted-foreground">
                We're constantly developing new agents to address more music industry workflows.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {comingSoonAgents.map((agent, index) => (
                <div key={index} className="glass-effect rounded-xl p-6 text-center">
                  <div className="mx-auto mb-4 rounded-full bg-cosmic-pink/10 p-3 w-16 h-16 flex items-center justify-center">
                    {agent.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-heading">{agent.name}</h3>
                  <p className="text-muted-foreground mb-4">{agent.description}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cosmic-pink/20 text-cosmic-pink">
                    Coming Soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 font-heading">Built for the Real World</h2>
              <p className="text-lg text-muted-foreground">
                Enterprise-grade infrastructure designed for music industry workflows.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: <Cloud className="h-8 w-8 text-cosmic-teal" />,
                  title: "Cloud-Agnostic",
                  description: "Deploy on AWS, Azure, GCP, or your preferred cloud provider.",
                },
                {
                  icon: <Database className="h-8 w-8 text-cosmic-teal" />,
                  title: "BYOC Support",
                  description: "Bring Your Own Cloud for complete data sovereignty.",
                },
                {
                  icon: <Shield className="h-8 w-8 text-cosmic-teal" />,
                  title: "Enterprise Security",
                  description: "Industry-standard security and compliance protocols.",
                },
                {
                  icon: <FileText className="h-8 w-8 text-cosmic-teal" />,
                  title: "Full Transparency",
                  description: "Transparent agent operations with complete audit trails.",
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

        {/* CTA Section */}
        <section className="py-20 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
                Ready to transform your music business?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join labels, artists, and music schools already using Patchline AI to work smarter.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="px-8 bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  <Link href="#">Book a Demo</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 border-cosmic-teal text-cosmic-teal hover:bg-cosmic-teal/10"
                >
                  <Link href="#">Join Waitlist</Link>
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
