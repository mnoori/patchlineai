"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MapPin, Calendar, CheckCircle } from "lucide-react"

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate form submission
    setTimeout(() => {
      setIsLoading(false)
      setFormSubmitted(true)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">Get in Touch</h1>
              <p className="text-xl text-muted-foreground">
                Have questions about Patchline AI? We'd love to hear from you.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="md:col-span-2">
                {formSubmitted ? (
                  <div className="glass-effect rounded-xl p-8 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-cosmic-teal/20 flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-cosmic-teal" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 font-heading">Thank You!</h2>
                    <p className="text-muted-foreground mb-6">
                      Your message has been received. We'll get back to you as soon as possible.
                    </p>
                    <Button asChild className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                      <Link href="/">Return to Homepage</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="glass-effect rounded-xl p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="your.email@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company/Artist Name</Label>
                        <Input id="company" placeholder="Your company or artist name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select>
                          <SelectTrigger id="role">
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
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label>I'm interested in (select all that apply)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {["Scout Agent", "Legal Agent", "Metadata Agent", "Fan Agent", "Education Agent"].map(
                          (agent) => (
                            <div key={agent} className="flex items-center space-x-2">
                              <Checkbox id={agent.toLowerCase().replace(" ", "-")} />
                              <Label htmlFor={agent.toLowerCase().replace(" ", "-")} className="text-sm font-normal">
                                {agent}
                              </Label>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="How can we help you?" rows={5} required />
                    </div>

                    <div className="flex items-center space-x-2 mb-6">
                      <Checkbox id="newsletter" />
                      <Label htmlFor="newsletter" className="text-sm font-normal">
                        Subscribe to our newsletter for updates on AI in music
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-cosmic-teal hover:bg-cosmic-teal/90 text-black"
                      disabled={isLoading}
                    >
                      {isLoading ? "Submitting..." : "Submit"}
                    </Button>
                  </form>
                )}
              </div>

              <div className="space-y-6">
                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-cosmic-teal/20 p-2">
                      <Mail className="h-5 w-5 text-cosmic-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1 font-heading">Email</h3>
                      <p className="text-muted-foreground">hello@patchline.ai</p>
                    </div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-cosmic-teal/20 p-2">
                      <Calendar className="h-5 w-5 text-cosmic-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1 font-heading">Book a Demo</h3>
                      <p className="text-muted-foreground mb-3">Schedule a personalized demo with our team.</p>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-cosmic-teal text-cosmic-teal hover:bg-cosmic-teal/10"
                      >
                        <Link href="#">Schedule Now</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-cosmic-teal/20 p-2">
                      <MapPin className="h-5 w-5 text-cosmic-teal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1 font-heading">Location</h3>
                      <p className="text-muted-foreground">San Francisco, CA</p>
                      <p className="text-muted-foreground">United States</p>
                    </div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-3 font-heading">Connect With Us</h3>
                  <div className="flex space-x-4">
                    <Link
                      href="#"
                      className="rounded-full bg-cosmic-teal/20 p-2 hover:bg-cosmic-teal/30 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-cosmic-teal"
                      >
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                      </svg>
                    </Link>
                    <Link
                      href="#"
                      className="rounded-full bg-cosmic-teal/20 p-2 hover:bg-cosmic-teal/30 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-cosmic-teal"
                      >
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                    </Link>
                    <Link
                      href="#"
                      className="rounded-full bg-cosmic-teal/20 p-2 hover:bg-cosmic-teal/30 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-cosmic-teal"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect width="4" height="12" x="2" y="9" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
