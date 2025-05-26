import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Linkedin, Instagram } from "lucide-react"

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
    {
      title: "Inclusive Community",
      description: "Tools priced and designed so labels, educators, and individual artists all thrive together.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-12 neural-network">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
                Less Admin. More Music with the <span className="gradient-text">Agentic AI Backbone</span> for the Music
                Industry.
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Automating the busywork so artists and labels can move faster, smarter, and with more creative freedom.
              </p>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-10 bg-cosmic-space/50">
          <div className="container">
            <h2 className="text-3xl font-bold mb-5 font-heading text-center">Meet Our Founder</h2>
            <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto">
              <div className="md:w-1/3 flex flex-col items-center">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-cosmic-teal">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Headshot.jpg-omMnc2assOnpd8GCYZ1kxj2KMiNibK.jpeg"
                    alt="Dr. Mehdi Noori, Founder of Patchline AI"
                    width={256}
                    height={256}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex justify-center mt-3 space-x-4">
                  <Link
                    href="https://www.linkedin.com/in/mehdi-noori/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-cosmic-teal/20 p-2 rounded-full hover:bg-cosmic-teal/30 transition-colors"
                  >
                    <Linkedin className="h-5 w-5 text-cosmic-teal" />
                  </Link>
                  <Link
                    href="https://www.instagram.com/algoryxmusic/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-cosmic-teal/20 p-2 rounded-full hover:bg-cosmic-teal/30 transition-colors"
                  >
                    <Instagram className="h-5 w-5 text-cosmic-teal" />
                  </Link>
                </div>
              </div>
              <div className="md:w-2/3">
                <div className="space-y-3 text-base">
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
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-10">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 font-heading text-center">Our Story</h2>
              <div className="space-y-3 text-base">
                <p>
                  Patchline AI was born from a simple observation: music professionals spend too much time on repetitive
                  tasks and not enough time on creative work.
                </p>
                <p>
                  During his time in both the AI and music industries, Dr. Noori experienced firsthand how
                  administrative work was draining creative energy from talented people. He saw how major labels had
                  access to sophisticated tools and teams that independent artists and smaller labels couldn't afford.
                </p>
                <p>
                  In 2024, he assembled a team of AI researchers and music industry veterans to explore how artificial
                  intelligence could democratize access to professional tools. They built the first prototype of the
                  Scout Agent to help A&R teams discover promising talent more efficiently.
                </p>
                <p>
                  The results were immediate: teams saved hours of manual work and discovered artists they would have
                  otherwise missed. This early success led to the development of our full suite of AI agents, each
                  designed to solve specific pain points in the music business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-10 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h2 className="text-3xl font-bold mb-3 font-heading">Our Principles</h2>
              <p className="text-lg text-muted-foreground">
                These core principles guide everything we do at Patchline AI.
              </p>
            </div>
            <div className="grid gap-4 max-w-4xl mx-auto">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="glass-effect rounded-xl p-5 hover:border-cosmic-teal/30 transition-all duration-300"
                >
                  <h3 className="text-xl font-bold mb-2 font-heading">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 bg-cosmic-space/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">Join us on our mission</h2>
              <p className="text-xl text-muted-foreground mb-6">
                We're building the future of the music business. Let's work together.
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
                  <Link href="#">Join Our Team</Link>
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
