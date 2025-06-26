import Link from "next/link"
import Image from "next/image"
import { Button, GradientOrbs, PageGradient, Card } from "@/components/brand"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Linkedin, Instagram } from "lucide-react"
import { headingStyles } from "@/lib/brand"

export default function AboutPage() {
  const values = [
    {
      title: "Artist-First Empowerment",
      description: "Every feature is designed to protect creators' rights and amplify their opportunities.",
    },
    {
      title: "Human-AI Synergy",
      description: "AI handles the grind; people make the creative calls. Technology augments, never replaces.",
    },
    {
      title: "Radical Transparency & Trust",
      description: "Clear audit trails, bias testing, and explainable outputs at every step.",
    },
    {
      title: "Reliability at Scale",
      description: "Cloud-agnostic, BYOC architecture built for 24/7 uptime as catalogs and classes grow.",
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Our Story Section - Hero with DEFAULT gradient */}
        <section className="relative py-16 pb-8 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="default" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className={`${headingStyles.h2} mb-8 text-center`}>Our Story</h2>
              <Card variant="gradient" className="p-8 backdrop-blur-sm">
                <div className="space-y-4 text-base text-muted-foreground">
                  <p>
                    Patchline AI was born from a simple observation: music professionals spend too much time on repetitive
                    tasks.
                  </p>
                  <p>
                    During his time in both the AI and music industries, Dr. Noori experienced firsthand how
                    administrative work was draining creative energy from talented people. He saw how major labels had
                    access to sophisticated tools and teams that independent artists and smaller labels couldn't afford.
                  </p>
                  <p>
                    In 2024, he set out to build something different: an AI platform that speaks the language of music, 
                    not just tech. Starting with deep research into how labels, artists, and music schools actually work, 
                    he began prototyping AI agents that could handle the repetitive tasks that steal time from creativity.
                  </p>
                  <p>
                    Today, Patchline AI is pioneering a new approach to music technology. Our vision is clear: give every 
                    music professional—from bedroom producers to established labels—access to AI tools that previously only 
                    tech giants could afford. We're not just building software; we're reimagining how the music industry 
                    can work when artificial intelligence handles the admin and humans focus on the art.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Founder Section - RIGHT EDGE */}
        <section className="relative pt-4 pb-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-right" className="opacity-25" />
          <div className="container relative z-10">
            <h2 className={`${headingStyles.h2} mb-12 text-center`}>Meet Our Founder</h2>
            <Card variant="gradient" className="max-w-5xl mx-auto p-8 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 flex flex-col items-center">
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-brand-cyan">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Headshot.jpg-omMnc2assOnpd8GCYZ1kxj2KMiNibK.jpeg"
                      alt="Dr. Mehdi Noori, Founder of Patchline AI"
                      width={256}
                      height={256}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex justify-center mt-4 space-x-4">
                    <Link
                      href="https://www.linkedin.com/in/mehdi-noori/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-brand-cyan/20 p-3 rounded-full hover:bg-brand-cyan/30 transition-colors"
                    >
                      <Linkedin className="h-5 w-5 text-brand-cyan" />
                    </Link>
                    <Link
                      href="https://www.instagram.com/algoryxmusic/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-brand-cyan/20 p-3 rounded-full hover:bg-brand-cyan/30 transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-brand-cyan" />
                    </Link>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <div className="space-y-4 text-base text-muted-foreground">
                    <p>
                      Dr. Mehdi Noori is a rare hybrid of AI scientist and music industry insider. With a Ph.D. in
                      engineering, a postdoc at MIT, and 15+ years leading AI innovation at firms like AWS and Nielsen,
                      he's built scalable GenAI systems used by Fortune 500s across healthcare, finance, and media.
                    </p>
                    <p>
                      But he's also a trained music producer and DJ (ALGORYX). Formally educated at Point Blank, Sound
                      Collective, and Cosmic Academy, and deeply embedded in the creative scene. That dual fluency gives
                      him a unique edge: he's lived the pain points Patchline solves.
                    </p>
                    <p>
                      Before founding Patchline, Mehdi led the Algoryx Art & Tech Lab, where he prototyped AI-native tools
                      for creative workflows. Now, he's applying that experience to reimagine how music teams work: with
                      agentic infrastructure that blends deep technical rigor with human-centered design.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Values Section - LEFT EDGE */}
        <section className="relative py-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-left" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className={`${headingStyles.h2} mb-4`}>Our Principles</h2>
              <p className="text-lg text-muted-foreground">
                These core principles guide everything we do at Patchline AI.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {values.map((value, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  hover="glow"
                  className="p-6 backdrop-blur-sm bg-black/20"
                >
                  <h3 className={`${headingStyles.h3} mb-3`}>{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - SUBTLE BOTTOM */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <PageGradient variant="vibrant" className="opacity-30" />
          <GradientOrbs variant="subtle-bottom" />
          <div className="container relative z-10 text-center">
            <h2 className={`${headingStyles.h2} mb-6`}>Join Us on Our Mission</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              We're building the future of the music business. Let's work together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="gradient" className="min-w-[200px]">
                <Link href="/contact">Book a Demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-[200px]">
                <Link href="/contact">Join Our Team</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
