"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GradientOrbs, Card } from "@/components/brand"
import { Mail, MapPin, CheckCircle, Sparkles, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Typewriter effect component
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 30)
      return () => clearTimeout(timer)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, onComplete])

  return <span>{displayedText}</span>
}

export default function ContactPage() {
  const [stage, setStage] = useState<'greeting' | 'form' | 'submitted'>('greeting')
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    message: '',
    newsletter: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormSubmitted(true)
        setStage('submitted')
      } else {
        console.error('Failed to submit form')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-16 relative">
        {/* Distorted orb background */}
        <GradientOrbs variant="vibrant" className="opacity-60" />
        
        <section className="relative py-20 min-h-[calc(100vh-4rem)]">
          <div className="container relative z-10">
            <AnimatePresence mode="wait">
              {stage === 'greeting' && (
                <motion.div
                  key="greeting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-4xl mx-auto text-center"
                >
                  <div className="mb-8">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-brand-cyan/10 backdrop-blur-sm mb-6">
                      <Sparkles className="h-8 w-8 text-brand-cyan animate-pulse" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 font-heading">
                      <TypewriterText 
                        text="Hello! I'm ARIA, your AI music business orchestrator." 
                        onComplete={() => setTimeout(() => setShowForm(true), 500)}
                      />
                    </h1>
                    {showForm && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-xl text-muted-foreground mb-8">
                          <TypewriterText text="I'd love to learn about your music business needs and show you how Patchline can transform your workflow." />
                        </p>
                        <Button
                          onClick={() => setStage('form')}
                          className="bg-brand-cyan hover:bg-brand-cyan/90 text-black group"
                          size="lg"
                        >
                          <span>Let's Get Started</span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {stage === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-5xl mx-auto"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">Request Your Demo</h2>
                    <p className="text-lg text-muted-foreground">
                      Tell me about yourself and I'll connect you with the right team member
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                      <Card variant="glass" className="backdrop-blur-xl border-white/10">
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div 
                              className="space-y-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <Label htmlFor="name">Name</Label>
                              <Input 
                                id="name" 
                                placeholder="Your name" 
                                required 
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="bg-white/5 border-white/10 focus:border-brand-cyan"
                              />
                            </motion.div>
                            <motion.div 
                              className="space-y-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Label htmlFor="email">Email</Label>
                              <Input 
                                id="email" 
                                type="email" 
                                placeholder="your.email@example.com" 
                                required 
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="bg-white/5 border-white/10 focus:border-brand-cyan"
                              />
                            </motion.div>
                            <motion.div 
                              className="space-y-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <Label htmlFor="company">Company/Artist Name</Label>
                              <Input 
                                id="company" 
                                placeholder="Your company or artist name" 
                                value={formData.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="bg-white/5 border-white/10 focus:border-brand-cyan"
                              />
                            </motion.div>
                            <motion.div 
                              className="space-y-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <Label htmlFor="role">Role</Label>
                              <Select onValueChange={(value) => handleInputChange('role', value)}>
                                <SelectTrigger id="role" className="bg-white/5 border-white/10 focus:border-brand-cyan">
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="artist">Artist</SelectItem>
                                  <SelectItem value="label">Label</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="educator">Educator</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </motion.div>
                          </div>

                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <Label htmlFor="message">How can Patchline help you?</Label>
                            <Textarea 
                              id="message" 
                              placeholder="Tell me about your music business challenges and goals..." 
                              rows={5} 
                              required 
                              value={formData.message}
                              onChange={(e) => handleInputChange('message', e.target.value)}
                              className="bg-white/5 border-white/10 focus:border-brand-cyan"
                            />
                          </motion.div>

                          <motion.div 
                            className="flex items-center space-x-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            <Checkbox 
                              id="newsletter" 
                              checked={formData.newsletter}
                              onCheckedChange={(checked) => handleInputChange('newsletter', checked)}
                            />
                            <Label htmlFor="newsletter" className="text-sm font-normal">
                              Keep me updated on AI innovations in music
                            </Label>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                          >
                            <Button
                              type="submit"
                              className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-black"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                "Submit Request"
                              )}
                            </Button>
                          </motion.div>
                        </form>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Card variant="glass" className="p-6 backdrop-blur-xl border-white/10">
                          <div className="flex items-start space-x-4">
                            <div className="rounded-full bg-brand-cyan/20 p-2">
                              <Mail className="h-5 w-5 text-brand-cyan" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium mb-1 font-heading">Email</h3>
                              <p className="text-muted-foreground">mehdi@patchline.ai</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Card variant="glass" className="p-6 backdrop-blur-xl border-white/10">
                          <div className="flex items-start space-x-4">
                            <div className="rounded-full bg-brand-cyan/20 p-2">
                              <MapPin className="h-5 w-5 text-brand-cyan" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium mb-1 font-heading">Location</h3>
                              <p className="text-muted-foreground">New York, NY</p>
                              <p className="text-muted-foreground">United States</p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Card variant="glass" className="p-6 backdrop-blur-xl border-white/10">
                          <h3 className="text-lg font-medium mb-3 font-heading">What happens next?</h3>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start">
                              <span className="text-brand-cyan mr-2">•</span>
                              We'll review your request within 24 hours
                            </li>
                            <li className="flex items-start">
                              <span className="text-brand-cyan mr-2">•</span>
                              Schedule a personalized demo call
                            </li>
                            <li className="flex items-start">
                              <span className="text-brand-cyan mr-2">•</span>
                              Get access to our pilot program
                            </li>
                          </ul>
                        </Card>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {stage === 'submitted' && (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="max-w-2xl mx-auto text-center"
                >
                  <Card variant="glass" className="p-12 backdrop-blur-xl border-white/10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="mx-auto w-16 h-16 rounded-full bg-brand-cyan/20 flex items-center justify-center mb-6"
                    >
                      <CheckCircle className="h-8 w-8 text-brand-cyan" />
                    </motion.div>
                    <h2 className="text-3xl font-bold mb-4 font-heading">Thank You!</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                      <TypewriterText text="Your demo request has been received. I've notified our team and they'll be in touch within 24 hours to schedule your personalized demo." />
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button asChild className="bg-brand-cyan hover:bg-brand-cyan/90 text-black">
                        <Link href="/">Return to Homepage</Link>
                      </Button>
                      <Button asChild variant="outline" className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10">
                        <Link href="/features">Explore Features</Link>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
