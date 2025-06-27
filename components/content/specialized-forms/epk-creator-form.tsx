"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Loader2, User, Music, Quote, Calendar, Contact, Send } from "lucide-react"
import type { EnhancedContentPrompt } from "@/lib/content-types"

interface EPKCreatorFormProps {
  onContentGenerated?: (draftId: string) => void
  initialPrompt?: EnhancedContentPrompt | null
  currentStep?: number
  onStepChange?: (step: number) => void
}

export function EPKCreatorForm({
  onContentGenerated,
  initialPrompt,
  currentStep = 1,
  onStepChange = () => {},
}: EPKCreatorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState<EnhancedContentPrompt>({
    topic: "",
    contentType: "epk",
    tone: "professional",
    length: "medium",
    artistName: "",
    artistBio: "",
    featuredTracks: [{ title: "", duration: "", streamingLinks: [] }],
    pressQuotes: [{ quote: "", source: "", publication: "" }],
    performanceHistory: [{ venue: "", date: "", location: "", capacity: 0 }],
    contactInfo: {
      manager: "",
      booking: "",
      press: "",
      email: "",
      phone: "",
    },
  })

  // Apply initial prompt values and simulate pre-filled data from app
  useEffect(() => {
    if (initialPrompt) {
      setPrompt((prev) => ({
        ...prev,
        ...initialPrompt,
      }))
    }

    // Simulate pre-filling data from existing app content
    // In a real app, this would fetch from user's profile/catalog
    const simulateDataPrefill = () => {
      setPrompt((prev) => ({
        ...prev,
        artistName: prev.artistName || "Luna Waves", // Example pre-filled data
        artistBio:
          prev.artistBio ||
          "Emerging electronic artist blending ambient soundscapes with driving beats. Based in Los Angeles, Luna Waves has been crafting immersive musical experiences that transport listeners to otherworldly realms.",
        featuredTracks:
          prev.featuredTracks?.length === 1 && !prev.featuredTracks[0].title
            ? [
                { title: "Midnight Echoes", duration: "4:23", streamingLinks: ["spotify", "apple-music"] },
                { title: "Digital Dreams", duration: "3:47", streamingLinks: ["spotify", "apple-music"] },
                { title: "Neon Nights", duration: "5:12", streamingLinks: ["spotify", "apple-music"] },
              ]
            : prev.featuredTracks,
        pressQuotes:
          prev.pressQuotes?.length === 1 && !prev.pressQuotes[0].quote
            ? [
                {
                  quote:
                    "Luna Waves creates sonic landscapes that are both ethereal and grounded, a rare combination in today's electronic music scene.",
                  source: "Alex Chen",
                  publication: "Electronic Music Weekly",
                },
                {
                  quote:
                    "A rising star in the ambient electronic genre with an undeniable talent for atmospheric composition.",
                  source: "Sarah Martinez",
                  publication: "Indie Music Blog",
                },
              ]
            : prev.pressQuotes,
        performanceHistory:
          prev.performanceHistory?.length === 1 && !prev.performanceHistory[0].venue
            ? [
                { venue: "The Echo", date: "March 2024", location: "Los Angeles, CA", capacity: 400 },
                { venue: "Soda Bar", date: "February 2024", location: "San Diego, CA", capacity: 200 },
                { venue: "Rickshaw Stop", date: "January 2024", location: "San Francisco, CA", capacity: 300 },
              ]
            : prev.performanceHistory,
        contactInfo: {
          manager: prev.contactInfo?.manager || "Jessica Thompson",
          booking: prev.contactInfo?.booking || "Mike Rodriguez",
          press: prev.contactInfo?.press || "Luna Waves Press Team",
          email: prev.contactInfo?.email || "contact@lunawaves.com",
          phone: prev.contactInfo?.phone || "+1 (555) 123-4567",
        },
      }))
    }

    // Simulate a brief delay for "loading" existing data
    const timer = setTimeout(simulateDataPrefill, 500)
    return () => clearTimeout(timer)
  }, [initialPrompt])

  const addTrack = () => {
    setPrompt((prev) => ({
      ...prev,
      featuredTracks: [...(prev.featuredTracks || []), { title: "", duration: "", streamingLinks: [] }],
    }))
  }

  const removeTrack = (index: number) => {
    setPrompt((prev) => ({
      ...prev,
      featuredTracks: prev.featuredTracks?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateTrack = (index: number, field: string, value: string) => {
    setPrompt((prev) => ({
      ...prev,
      featuredTracks:
        prev.featuredTracks?.map((track, i) => (i === index ? { ...track, [field]: value } : track)) || [],
    }))
  }

  const addPressQuote = () => {
    setPrompt((prev) => ({
      ...prev,
      pressQuotes: [...(prev.pressQuotes || []), { quote: "", source: "", publication: "" }],
    }))
  }

  const removePressQuote = (index: number) => {
    setPrompt((prev) => ({
      ...prev,
      pressQuotes: prev.pressQuotes?.filter((_, i) => i !== index) || [],
    }))
  }

  const updatePressQuote = (index: number, field: string, value: string) => {
    setPrompt((prev) => ({
      ...prev,
      pressQuotes: prev.pressQuotes?.map((quote, i) => (i === index ? { ...quote, [field]: value } : quote)) || [],
    }))
  }

  const addPerformance = () => {
    setPrompt((prev) => ({
      ...prev,
      performanceHistory: [...(prev.performanceHistory || []), { venue: "", date: "", location: "", capacity: 0 }],
    }))
  }

  const removePerformance = (index: number) => {
    setPrompt((prev) => ({
      ...prev,
      performanceHistory: prev.performanceHistory?.filter((_, i) => i !== index) || [],
    }))
  }

  const updatePerformance = (index: number, field: string, value: string | number) => {
    setPrompt((prev) => ({
      ...prev,
      performanceHistory:
        prev.performanceHistory?.map((perf, i) => (i === index ? { ...perf, [field]: value } : perf)) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.artistName?.trim()) return

    setIsGenerating(true)

    try {
      // For demo purposes, use mock data instead of API call
      // When backend is ready, uncomment the API call below

      // Mock response simulation
      setTimeout(() => {
        if (onContentGenerated) {
          onContentGenerated("epk") // Use "epk" as mock draft ID
        }
        setIsGenerating(false)
      }, 2000)

      return // Remove this line when enabling real API

      // Real API call (commented out for demo)
      /*
      // Generate EPK-specific prompt
      const epkPrompt = `
Create a professional Electronic Press Kit (EPK) for ${prompt.artistName}.

Artist Information:
- Name: ${prompt.artistName}
- Bio: ${prompt.artistBio || "Emerging artist with unique sound and vision"}
- Genre/Style: ${prompt.topic || "Contemporary music"}

Featured Tracks:
${prompt.featuredTracks?.map((track) => `- ${track.title} (${track.duration})`).join("\n") || "- Track information to be provided"}

Press Coverage:
${prompt.pressQuotes?.map((quote) => `- "${quote.quote}" - ${quote.source}${quote.publication ? `, ${quote.publication}` : ""}`).join("\n") || "- Press coverage highlights"}

Performance History:
${prompt.performanceHistory?.map((perf) => `- ${perf.venue}, ${perf.location} (${perf.date})`).join("\n") || "- Notable performance venues"}

Contact Information:
- Management: ${prompt.contactInfo?.manager || "To be provided"}
- Booking: ${prompt.contactInfo?.booking || "To be provided"}
- Press: ${prompt.contactInfo?.press || "To be provided"}
- Email: ${prompt.contactInfo?.email || "contact@example.com"}

Create a comprehensive, professional EPK that includes:
1. Artist biography and background
2. Musical style and influences
3. Career highlights and achievements
4. Featured tracks with descriptions
5. Press quotes and media coverage
6. Performance history and notable shows
7. Professional contact information
8. High-quality promotional content

Format this as a professional document suitable for media outlets, venues, and industry professionals.
    `

    const finalPrompt = {
      topic: prompt.artistName || "Artist EPK",
      contentType: "epk",
      customPrompt: epkPrompt,
      modelId: "amazon.nova-micro-v1:0",
      ...prompt
    }

    const response = await fetch("/api/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalPrompt),
    })

    if (!response.ok) {
      throw new Error("Failed to generate EPK")
    }

    const data = await response.json()

    if (onContentGenerated) {
      onContentGenerated(data.draftId)
    }
    */
    } catch (error) {
      console.error("Error generating EPK:", error)
      // For demo, still show preview even if there's an error
      if (onContentGenerated) {
        onContentGenerated("epk")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-cyan/20">
            <User className="h-5 w-5 text-brand-cyan" />
          </div>
          <div>
            <CardTitle>Electronic Press Kit Creator</CardTitle>
            <CardDescription>
              Create a professional EPK for media outlets and industry professionals
              {initialPrompt?.topic && (
                <span className="block text-brand-cyan font-medium mt-1">Based on: {initialPrompt.topic}</span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Artist Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-cyan" />
              <h3 className="text-lg font-semibold">Artist Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="artistName">Artist/Band Name *</Label>
                <Input
                  id="artistName"
                  placeholder="Enter artist or band name"
                  value={prompt.artistName || ""}
                  onChange={(e) => setPrompt({ ...prompt, artistName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Genre/Style</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Indie Rock, Electronic, Hip-Hop"
                  value={prompt.topic}
                  onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="artistBio">Artist Biography</Label>
              <Textarea
                id="artistBio"
                placeholder="Brief artist background, influences, and story..."
                value={prompt.artistBio || ""}
                onChange={(e) => setPrompt({ ...prompt, artistBio: e.target.value })}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">Our AI will expand this into a professional biography</p>
            </div>
          </div>

          <Separator />

          {/* Featured Tracks Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-brand-cyan" />
                <h3 className="text-lg font-semibold">Featured Tracks</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTrack}>
                <Plus className="h-4 w-4 mr-2" />
                Add Track
              </Button>
            </div>

            {prompt.featuredTracks?.map((track, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Track Title</Label>
                    <Input
                      placeholder="Song title"
                      value={track.title}
                      onChange={(e) => updateTrack(index, "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      placeholder="3:45"
                      value={track.duration}
                      onChange={(e) => updateTrack(index, "duration", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTrack(index)}
                      className="w-full"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Press Quotes Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-brand-cyan" />
                <h3 className="text-lg font-semibold">Press Quotes & Reviews</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPressQuote}>
                <Plus className="h-4 w-4 mr-2" />
                Add Quote
              </Button>
            </div>

            {prompt.pressQuotes?.map((quote, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quote</Label>
                    <Textarea
                      placeholder="Press quote or review excerpt..."
                      value={quote.quote}
                      onChange={(e) => updatePressQuote(index, "quote", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Source</Label>
                      <Input
                        placeholder="Reviewer name"
                        value={quote.source}
                        onChange={(e) => updatePressQuote(index, "source", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Publication</Label>
                      <Input
                        placeholder="Magazine, blog, etc."
                        value={quote.publication || ""}
                        onChange={(e) => updatePressQuote(index, "publication", e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePressQuote(index)}
                        className="w-full"
                      >
                        <Minus className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Performance History Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-cyan" />
                <h3 className="text-lg font-semibold">Notable Performances</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPerformance}>
                <Plus className="h-4 w-4 mr-2" />
                Add Performance
              </Button>
            </div>

            {prompt.performanceHistory?.map((performance, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input
                      placeholder="Venue name"
                      value={performance.venue}
                      onChange={(e) => updatePerformance(index, "venue", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="City, State"
                      value={performance.location}
                      onChange={(e) => updatePerformance(index, "location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      placeholder="MM/YYYY"
                      value={performance.date}
                      onChange={(e) => updatePerformance(index, "date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={performance.capacity || ""}
                      onChange={(e) => updatePerformance(index, "capacity", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePerformance(index)}
                      className="w-full"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Contact Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Contact className="h-5 w-5 text-brand-cyan" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Input
                    id="manager"
                    placeholder="Manager name"
                    value={prompt.contactInfo?.manager || ""}
                    onChange={(e) =>
                      setPrompt({
                        ...prompt,
                        contactInfo: { ...prompt.contactInfo, manager: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking">Booking Agent</Label>
                  <Input
                    id="booking"
                    placeholder="Booking agent name"
                    value={prompt.contactInfo?.booking || ""}
                    onChange={(e) =>
                      setPrompt({
                        ...prompt,
                        contactInfo: { ...prompt.contactInfo, booking: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="press">Press Contact</Label>
                  <Input
                    id="press"
                    placeholder="Press contact name"
                    value={prompt.contactInfo?.press || ""}
                    onChange={(e) =>
                      setPrompt({
                        ...prompt,
                        contactInfo: { ...prompt.contactInfo, press: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    value={prompt.contactInfo?.email || ""}
                    onChange={(e) =>
                      setPrompt({
                        ...prompt,
                        contactInfo: { ...prompt.contactInfo, email: e.target.value },
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={prompt.contactInfo?.phone || ""}
                    onChange={(e) =>
                      setPrompt({
                        ...prompt,
                        contactInfo: { ...prompt.contactInfo, phone: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Our AI will create a professional EPK and submit it to relevant media outlets and venues
            </div>
            <Button
              type="submit"
              disabled={isGenerating || !prompt.artistName?.trim()}
              className="bg-brand-cyan hover:bg-brand-cyan/90 text-white min-w-[160px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating EPK...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate & Preview EPK
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
