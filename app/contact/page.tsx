"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import { Mail, MapPin, CheckCircle, Sparkles, ArrowRight, Heart, Music } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Animated dot pattern background - tunnel/corridor effect
function DotPatternBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Center gradient fade - static */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: `radial-gradient(circle at center, 
            rgba(1, 1, 2, 1) 0%, 
            rgba(1, 1, 2, 0.9) 20%, 
            rgba(1, 1, 2, 0.7) 40%, 
            rgba(1, 1, 2, 0.3) 60%, 
            transparent 80%)`
        }}
      />
      
      {/* Static dot pattern - no animation for stability */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 230, 228, 0.3) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(0, 230, 228, 0.25) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(0, 230, 228, 0.2) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(0, 230, 228, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px, 45px 45px, 60px 60px, 75px 75px',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Single animated ring for subtle movement */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.3, 0],
          scale: [0.8, 1.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeOut",
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            border: '1px solid rgba(0, 230, 228, 0.3)',
            borderRadius: '50%',
            width: '200px',
            height: '200px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </motion.div>
      
      {/* Perspective lines - static */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[...Array(8)].map((_, i) => {
          const angle = (i * 45) * Math.PI / 180
          const x = 50 + Math.cos(angle) * 50
          const y = 50 + Math.sin(angle) * 50
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="rgba(0, 230, 228, 0.3)"
              strokeWidth="0.5"
            />
          )
        })}
      </svg>
    </div>
  )
}

export default function ContactPage() {
  const [stage, setStage] = useState<'greeting' | 'form' | 'submitted'>('greeting')
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
        {/* Brand-compliant animated background */}
        <DotPatternBackground />
        <GradientOrbs variant="dispersed" className="opacity-50" />
        
        <section className="relative py-20 min-h-[calc(100vh-4rem)]">
          <div className="container relative z-10">
            <AnimatePresence mode="wait">
              {stage === 'greeting' && (
                <motion.div
                  key="greeting"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="max-w-4xl mx-auto text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center p-6 rounded-full bg-gradient-to-br from-brand-cyan/20 to-brand-cyan/5 backdrop-blur-xl mb-8 shadow-2xl"
                  >
                    <motion.div
                      animate={{ 
                        rotate: 360,
                      }}
                      transition={{ 
                        duration: 20, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    >
                      <Sparkles className="h-12 w-12 text-brand-cyan" />
                    </motion.div>
                  </motion.div>
                  
                  <motion.h1 
                    className="text-4xl md:text-5xl font-bold mb-3 font-heading"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Hey, I'm <span className="text-brand-cyan font-bold">ARIA</span>
                  </motion.h1>
                  
                  <motion.p 
                    className="text-lg text-muted-foreground mb-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Nice to meet you!
                  </motion.p>

                  <motion.p 
                    className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Let's take some of those tedious tasks off your plate...
                  </motion.p>

                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setStage('form')}
                      className="bg-gradient-to-r from-brand-cyan to-brand-bright-blue hover:from-brand-cyan/90 hover:to-brand-bright-blue/90 text-black group px-8 py-6 text-lg rounded-full shadow-2xl"
                    >
                      <span className="font-semibold">Let's Talk About Your Needs</span>
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
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
                  <motion.div 
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-brand-cyan/20 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-brand-cyan" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        <span className="font-bold text-brand-cyan">ARIA</span> is here with you
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Great! Let's get to know each other</h2>
                    <p className="text-lg text-muted-foreground">
                      I'd love to learn about your music journey and how I can help make your life easier
                    </p>
                  </motion.div>

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
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="max-w-2xl mx-auto text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5, delay: 0.2 }}
                  >
                    <Card variant="glass" className="p-12 backdrop-blur-xl border-white/10">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-brand-cyan/30 to-brand-bright-blue/30 flex items-center justify-center mb-6"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <CheckCircle className="h-10 w-10 text-brand-cyan" />
                        </motion.div>
                      </motion.div>
                      
                      <motion.h2 
                        className="text-3xl font-bold mb-4 font-heading"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <span className="bg-gradient-to-r from-brand-cyan to-brand-bright-blue bg-clip-text text-transparent">
                          Request Received!
                        </span>
                      </motion.h2>
                      
                      <motion.p 
                        className="text-lg text-muted-foreground mb-8"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        Our team will reach out within 24 hours to schedule your personalized demo.
                      </motion.p>
                      
                      <motion.div 
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button asChild className="bg-gradient-to-r from-brand-cyan to-brand-bright-blue hover:from-brand-cyan/90 hover:to-brand-bright-blue/90 text-black">
                          <Link href="/">Return Home</Link>
                        </Button>
                        <Button asChild variant="outline" className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10">
                          <Link href="/features">Explore Features</Link>
                        </Button>
                      </motion.div>
                    </Card>
                  </motion.div>


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
