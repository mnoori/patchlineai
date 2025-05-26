"use client"

import type React from "react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MusicVideoCreatorFormProps {
  onContentGenerated?: (draftId: string) => void
}

interface Prompt {
  topic: string
  budget: string
  videoTheme: string
}

const MusicVideoCreatorForm: React.FC<MusicVideoCreatorFormProps> = ({ onContentGenerated }) => {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState<Prompt>({
    topic: "",
    budget: "low",
    videoTheme: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.topic?.trim()) return

    setIsGenerating(true)

    try {
      // For demo purposes, use mock data instead of API call
      // When backend is ready, uncomment the API call below

      // Mock response simulation
      setTimeout(() => {
        if (onContentGenerated) {
          onContentGenerated("music-video") // Use "music-video" as mock draft ID
        }
        setIsGenerating(false)
      }, 2000)

      return // Remove this line when enabling real API

      // Real API call (commented out for demo)
      /*
      // Generate music video specific prompt
      const videoPrompt = `
Create a professional music video treatment for: ${prompt.topic}

Video Specifications:
- Budget Level: ${prompt.budget}
- Visual Style: ${prompt.videoTheme || "Cinematic and engaging"}
- Duration: Full-length music video (3-5 minutes)

Creative Elements:
1. Concept Overview - Core visual narrative
2. Visual Style - Color palette, cinematography, lighting
3. Narrative Structure - Beginning, middle, end
4. Production Requirements - Locations, crew, equipment

Treatment Sections:
- Executive Summary
- Creative Concept
- Visual References
- Shot List and Storyboard
- Production Timeline
- Budget Breakdown
- Post-Production Plan

Create a comprehensive music video treatment that includes:
1. Compelling visual narrative
2. Detailed production requirements
3. Creative direction and style guide
4. Technical specifications
5. Budget considerations
6. Timeline and deliverables

Format as a professional treatment document ready for production companies and directors.
      `

      const finalPrompt = {
        topic: prompt.topic,
        contentType: "music-video",
        customPrompt: videoPrompt,
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
        throw new Error("Failed to generate music video treatment")
      }

      const data = await response.json()

      if (onContentGenerated) {
        onContentGenerated(data.draftId)
      }
      */
    } catch (error) {
      console.error("Error generating music video treatment:", error)
      // For demo, still show preview even if there's an error
      if (onContentGenerated) {
        onContentGenerated("music-video")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPrompt({ ...prompt, [name]: value })
  }

  const handleSelectChange = (value: string, name: string) => {
    setPrompt({ ...prompt, [name]: value })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="topic">Music Video Topic</Label>
        <Input
          type="text"
          id="topic"
          name="topic"
          placeholder="e.g., A song about overcoming adversity"
          value={prompt.topic}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label htmlFor="budget">Budget Level</Label>
        <Select onValueChange={(value) => handleSelectChange(value, "budget")} defaultValue={prompt.budget}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="videoTheme">Visual Theme</Label>
        <Textarea
          id="videoTheme"
          name="videoTheme"
          placeholder="e.g., Surreal, Animated, Live Performance"
          value={prompt.videoTheme}
          onChange={handleInputChange}
        />
      </div>
      <Button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate Music Video Treatment"}
      </Button>
    </form>
  )
}

export { MusicVideoCreatorForm }
