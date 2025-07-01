"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Music, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Sparkles,
  Calendar,
  ChevronRight,
  Zap,
  Globe,
  BarChart3,
  Headphones,
  Award,
  Clock,
  Mail,
  Phone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/brand"
import { ARIA_CONFIG } from "@/config/aria"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Footer } from "@/components/footer"

// Industry data
const INDUSTRY_STATS = {
  globalMarket: "$31.2B",
  growthRate: "8.5%",
  streamingRevenue: "$19.3B",
  artistsOnPlatforms: "11M+",
  dailyStreams: "3.2B",
  playlistsCreated: "4B+"
}

function WelcomeContent() {
  const searchParams = useSearchParams()
  const [personData, setPersonData] = useState({
    name: "there",
    email: "",
    eventType: "",
    eventTime: "",
    answers: {},
    role: "music professional"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showAgent, setShowAgent] = useState(false)
  const [agentMessage, setAgentMessage] = useState("")
  const [isProcessingEvent, setIsProcessingEvent] = useState(false)

  useEffect(() => {
    // Parse Calendly event details from URL parameters
    // Based on Calendly v2 API, they pass: invitee_full_name, invitee_email, event_type_name, scheduled_event_uuid, etc.
    
    const inviteeName = searchParams.get("invitee_full_name") || searchParams.get("invitee_name") || ""
    const inviteeEmail = searchParams.get("invitee_email") || ""
    const eventTypeName = searchParams.get("event_type_name") || ""
    const eventUuid = searchParams.get("scheduled_event_uuid") || ""
    const eventTime = searchParams.get("event_start_time") || ""
    
    // Parse answers from questions_and_answers parameter (if using screening questions)
    const answersParam = searchParams.get("questions_and_answers") || ""
    let answers = {}
    let detectedRole = "music professional"
    
    try {
      // Calendly passes answers as URL-encoded JSON or query string
      if (answersParam) {
        // Try to detect role from answers
        const answersLower = answersParam.toLowerCase()
        if (answersLower.includes("engineer") || answersLower.includes("developer")) {
          detectedRole = "engineer"
        } else if (answersLower.includes("artist") || answersLower.includes("musician")) {
          detectedRole = "artist"
        } else if (answersLower.includes("label") || answersLower.includes("a&r")) {
          detectedRole = "label executive"
        } else if (answersLower.includes("manager")) {
          detectedRole = "artist manager"
        } else if (answersLower.includes("investor")) {
          detectedRole = "investor"
        }
      }
    } catch (e) {
      console.error("Error parsing answers:", e)
    }

    // Set person data
    setPersonData({
      name: inviteeName || "there",
      email: inviteeEmail,
      eventType: eventTypeName,
      eventTime: eventTime,
      answers: answers,
      role: detectedRole
    })

    // If we have event details, process them
    if (eventUuid) {
      setIsProcessingEvent(true)
      // Here you could make an API call to store the event details
      // and trigger any agentic workflows
      processCalendlyEvent(eventUuid, inviteeName, inviteeEmail, eventTypeName)
    }

    // Removed confetti animation

    setIsLoading(false)

    // Show agent after 3 seconds
    setTimeout(() => setShowAgent(true), 3000)
  }, [searchParams])

  // Process Calendly event and trigger workflows
  const processCalendlyEvent = async (eventId: string, name: string, email: string, eventType: string) => {
    try {
      // Call your API to process the event
      const response = await fetch('/api/calendly/process-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          inviteeName: name,
          inviteeEmail: email,
          eventType,
          timestamp: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        console.log('Event processed successfully')
        setIsProcessingEvent(false)
      }
    } catch (error) {
      console.error('Error processing event:', error)
      setIsProcessingEvent(false)
    }
  }

  // Generate personalized agent message
  useEffect(() => {
    if (showAgent && personData.name) {
      const messages = {
        engineer: `Hi ${personData.name}! I've analyzed your technical background. Our agent architecture would be perfect for someone with your skills. I can show you how we're using Claude 3.5 and multi-agent orchestration to revolutionize music tech...`,
        artist: `Welcome ${personData.name}! I see you're an artist. I've already found 23 playlist opportunities for artists in your genre. Our agents handle everything from metadata optimization to royalty tracking...`,
        "label executive": `Welcome ${personData.name}! Based on your role, you'll love how our agents automate A&R workflows. We're already managing catalogs worth $4.2M in rights...`,
        "artist manager": `Great to meet you ${personData.name}! Our agents can save you 32+ hours weekly on routine tasks. From tour planning to social media, we've got you covered...`,
        investor: `Welcome ${personData.name}! I've prepared some key metrics for you: 284% average revenue increase, $31.2B addressable market, and we're growing at 42% MoM...`,
        "music professional": `Welcome to the future of music business, ${personData.name}! Our AI agents are transforming how professionals like you work. Let me show you some possibilities...`
      }
      
      setAgentMessage(messages[personData.role] || messages["music professional"])
    }
  }, [showAgent, personData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="h-8 w-8 text-brand-cyan" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-16">
        <div className="container flex items-center justify-between h-full px-4">
          <Logo size="lg" showText={true} />
          <div className="flex items-center gap-4">
            {isProcessingEvent && (
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Processing Event
              </Badge>
            )}
            <Badge variant="outline" className="text-brand-cyan border-brand-cyan/30">
              Exclusive Preview
            </Badge>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="pt-16 pb-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Badge className="mb-4 bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30">
                <Sparkles className="h-3 w-3 mr-1" />
                {personData.name !== "there" ? `Personalized for ${personData.name}` : "Welcome to Patchline AI"}
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-brand-cyan via-brand-bright-blue to-brand-cyan bg-clip-text text-transparent">
                  Welcome to the Future of Label Ops{personData.name !== "there" ? `, ${personData.name}` : ""}!
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                You're about to discover how AI agents are revolutionizing the {INDUSTRY_STATS.globalMarket} music industry. 
                {personData.eventType && ` Thank you for scheduling a ${personData.eventType}.`}
              </p>

              <div className="flex items-center justify-center gap-4 mb-12 flex-wrap">
                {personData.eventType && (
                  <Badge variant="secondary" className="px-4 py-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    {personData.eventType}
                  </Badge>
                )}
                <Badge variant="secondary" className="px-4 py-2">
                  <Users className="h-4 w-4 mr-2" />
                  {personData.role}
                </Badge>
                {personData.email && (
                  <Badge variant="secondary" className="px-4 py-2">
                    <Mail className="h-4 w-4 mr-2" />
                    Confirmation sent
                  </Badge>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Agent Interaction */}
        <AnimatePresence>
          {showAgent && (
            <motion.section
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="pb-16 px-4"
            >
              <div className="container max-w-4xl mx-auto">
                <Card className="bg-gradient-to-br from-brand-cyan/5 to-brand-bright-blue/5 border-brand-cyan/20 p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-cyan to-brand-bright-blue flex items-center justify-center">
                      <Zap className="h-6 w-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-brand-cyan">{ARIA_CONFIG.displayName}</h3>
                      <p className="text-sm text-muted-foreground">AI Music Business Assistant</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                      Active
                    </Badge>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-background/50 rounded-lg p-4"
                  >
                    <p className="text-sm leading-relaxed">{agentMessage}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-4 flex justify-center"
                  >
                    <Button size="sm" variant="outline" className="text-xs" asChild>
                      <Link href="/aria">
                        Check me out!
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </motion.div>
                </Card>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Market Opportunity */}
        <section className="pb-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-brand-cyan/10 to-brand-bright-blue/10 rounded-2xl p-8 text-center"
            >
              <BarChart3 className="h-12 w-12 text-brand-cyan mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">The Opportunity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-brand-cyan">{INDUSTRY_STATS.globalMarket}</div>
                  <div className="text-sm text-muted-foreground">Total Addressable Market</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-cyan">{INDUSTRY_STATS.growthRate}</div>
                  <div className="text-sm text-muted-foreground">Annual Growth Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-cyan">{INDUSTRY_STATS.artistsOnPlatforms}</div>
                  <div className="text-sm text-muted-foreground">Artists Need Our Help</div>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The music industry is experiencing unprecedented growth, but artists and professionals 
                are overwhelmed. Our AI agents are the solution to scaling success in this new era.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Call Preparation */}
        <section className="pb-24 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-2xl font-bold mb-4">
                {personData.eventTime ? "We'll See You Soon!" : "Ready for Your Call?"}
              </h3>
              <p className="text-muted-foreground mb-8">
                We can't wait to show you how Patchline AI will transform your work in the music industry.
                {personData.email && " Check your email for calendar details."}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" className="bg-brand-cyan hover:bg-brand-cyan/90 text-black">
                  <Calendar className="h-5 w-5 mr-2" />
                  Add to Calendar
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/aria">
                    Learn More about <span className="font-bold text-brand-cyan ml-1">ARIA</span>
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Zap className="h-8 w-8 text-brand-cyan animate-pulse" />
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  )
} 