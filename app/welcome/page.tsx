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
  Phone,
  Briefcase
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
  const [mounted, setMounted] = useState(false)
  const [ariaMessage, setAriaMessage] = useState("")

  // Parse Calendly parameters
  const name = searchParams.get('invitee_full_name') || 'there';
  const firstName = name.split(' ')[0];
  const email = searchParams.get('invitee_email');
  const eventType = searchParams.get('event_type_name');
  
  // Check screening answers for role detection
  const answers = [];
  for (let i = 1; i <= 10; i++) {
    const answer = searchParams.get(`answer_${i}`);
    if (answer) answers.push(answer.toLowerCase());
  }
  
  const isJobInquiry = answers.some(answer => 
    answer.includes('job') || 
    answer.includes('career') || 
    answer.includes('position') ||
    answer.includes('hiring') ||
    answer.includes('employment')
  );

  useEffect(() => {
    // Parse Calendly event details from URL parameters
    // Updated based on actual Calendly URL structure
    
    const inviteeName = searchParams.get("invitee_full_name") || searchParams.get("invitee_name") || ""
    const inviteeEmail = searchParams.get("invitee_email") || ""
    const eventTypeName = searchParams.get("event_type_name") || ""
    const eventUuid = searchParams.get("invitee_uuid") || ""
    const eventTime = searchParams.get("event_start_time") || ""
    const assignedTo = searchParams.get("assigned_to") || ""
    
    // Parse answer_1, answer_2, etc. from Calendly screening questions
    let detectedRole = "music professional"
    
    try {
      // Detect role from answer_1 or any answer content
      const allAnswersText = answers.join(' ').toLowerCase()
      
      if (allAnswersText.includes("engineer") || allAnswersText.includes("developer")) {
        detectedRole = "engineer"
      } else if (allAnswersText.includes("artist") || allAnswersText.includes("musician")) {
        detectedRole = "artist"
      } else if (allAnswersText.includes("label") || allAnswersText.includes("a&r")) {
        detectedRole = "label executive"
      } else if (allAnswersText.includes("manager")) {
        detectedRole = "artist manager"
      } else if (allAnswersText.includes("investor")) {
        detectedRole = "investor"
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
      processCalendlyEvent(eventUuid, inviteeName, inviteeEmail, eventTypeName, answers, assignedTo)
    }

    // Removed confetti animation

    setIsLoading(false)

    // Show agent after 3 seconds
    setTimeout(() => setShowAgent(true), 3000)

    setMounted(true)

    // Send event data to our API
    if (inviteeEmail) {
      fetch('/api/calendly/process-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteeName,
          email: inviteeEmail,
          eventType: eventTypeName,
          eventStartTime: eventTime,
          inviteeUuid: eventUuid,
          assignedTo: assignedTo,
          answers: answers
        })
      }).catch(console.error)
    }

    // Set appropriate ARIA message based on inquiry type
    if (isJobInquiry) {
      setAriaMessage("Thank you for your interest in joining our team! Someone from our team will reach out to you shortly to discuss potential opportunities at Patchline AI.")
    } else {
      const messages = {
        engineer: `Welcome ${inviteeName}! I see you're interested in the technical side of things. Rest assured, we'll address your questions during our call. Our team is excited to show you how we're revolutionizing the music industry with AI.`,
        artist: `Great to meet you, ${inviteeName}! Your inquiry has been received and we'll make sure to cover everything you need during our scheduled call. Our team can't wait to show you how we can help transform your music career.`,
        "label executive": `Welcome ${inviteeName}! Thank you for scheduling time with us. We'll make sure to address all your questions about how our platform can streamline your operations. Looking forward to our conversation!`,
        "artist manager": `Hi ${inviteeName}! We've received your information and are preparing for our call. Rest assured, we'll show you exactly how our tools can save you time and grow your artists' careers.`,
        investor: `Welcome ${inviteeName}! Thank you for your interest. Our team is preparing comprehensive information for our discussion. We look forward to sharing our vision and metrics with you.`,
        "music professional": `Welcome ${inviteeName}! Thanks for scheduling time with us. Rest assured, we'll address all your questions and show you how Patchline AI can transform your work in the music industry.`
      }
      
      setAriaMessage(messages[detectedRole] || messages["music professional"])
    }
  }, [searchParams, answers])

  // Process Calendly event and trigger workflows
  const processCalendlyEvent = async (eventId: string, name: string, email: string, eventType: string, answers: any, assignedTo: string) => {
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
          answers,
          assignedTo,
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

  if (!mounted) return null

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
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-brand-cyan via-brand-bright-blue to-brand-cyan bg-clip-text text-transparent">
                  Welcome to the Future of Label Ops{personData.name !== "there" ? `, ${personData.name.split(' ')[0]}` : ""}!
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
                    <p className="text-sm leading-relaxed">{ariaMessage}</p>
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
                <Button size="lg" className="bg-brand-cyan hover:bg-brand-cyan/90 text-black" asChild>
                  <Link href="/careers">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Explore Our Job Openings
                  </Link>
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