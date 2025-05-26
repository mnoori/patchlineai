"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Music, Quote, Contact, Download, Send, Loader2, Check, ChevronLeft } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import type { ContentDraft } from "@/lib/blog-types"

interface EPKPreviewProps {
  draft: ContentDraft
  onBack?: () => void
  onSubmit?: (draft: ContentDraft) => void
}

export function EPKPreview({ draft, onBack, onSubmit }: EPKPreviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")

  const handleDownloadPDF = () => {
    toast.success("EPK downloaded as PDF", {
      description: "Your professional EPK has been saved to your downloads folder",
    })
  }

  const handleSubmitToMedia = async () => {
    setIsSubmitting(true)

    // Simulate agent submission process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setIsSubmitted(true)
    setIsSubmitting(false)

    toast.success("EPK submitted successfully!", {
      description: "Your EPK has been sent to 47 media outlets and 23 venues",
      action: {
        label: "View Submissions",
        onClick: () => console.log("View submissions"),
      },
    })

    if (onSubmit) {
      onSubmit(draft)
    }
  }

  const artistName = draft.prompt.artistName || "Artist Name"
  const genre = draft.prompt.topic || "Music"

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20">
              <User className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <CardTitle>Electronic Press Kit Preview</CardTitle>
              <CardDescription>
                Professional EPK for {artistName} • {genre}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground rounded-full px-2 py-1 bg-muted">
            <User className="h-3 w-3 mr-1" />
            Generated EPK
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">EPK Preview</TabsTrigger>
            <TabsTrigger value="markdown">Source Content</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="preview" className="pt-2">
          <CardContent>
            <div className="max-h-[32rem] overflow-y-auto">
              {/* EPK Header */}
              <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">{artistName}</h1>
                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant="secondary">{genre}</Badge>
                      <Badge variant="outline">Professional EPK</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {draft.prompt.artistBio?.substring(0, 150) ||
                        "Professional artist biography and press information"}
                      ...
                    </p>
                  </div>
                </div>
              </div>

              {/* EPK Sections */}
              <div className="space-y-6">
                {/* Artist Biography */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-teal-500" />
                    <h2 className="text-lg font-semibold">Artist Biography</h2>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{draft.content.substring(0, 500)}...</ReactMarkdown>
                  </div>
                </div>

                <Separator />

                {/* Featured Tracks */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-teal-500" />
                    <h2 className="text-lg font-semibold">Featured Tracks</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draft.prompt.featuredTracks?.slice(0, 4).map((track, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{track.title}</p>
                            <p className="text-sm text-muted-foreground">{track.duration}</p>
                          </div>
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Card>
                    )) || <p className="text-muted-foreground col-span-2">Featured tracks will be listed here</p>}
                  </div>
                </div>

                <Separator />

                {/* Press Quotes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Quote className="h-5 w-5 text-teal-500" />
                    <h2 className="text-lg font-semibold">Press Coverage</h2>
                  </div>
                  <div className="space-y-3">
                    {draft.prompt.pressQuotes?.slice(0, 3).map((quote, index) => (
                      <Card key={index} className="p-4">
                        <blockquote className="italic mb-2">"{quote.quote}"</blockquote>
                        <cite className="text-sm text-muted-foreground">
                          — {quote.source}
                          {quote.publication && `, ${quote.publication}`}
                        </cite>
                      </Card>
                    )) || <p className="text-muted-foreground">Press quotes and reviews will be displayed here</p>}
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Contact className="h-5 w-5 text-teal-500" />
                    <h2 className="text-lg font-semibold">Contact Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Management:</strong> {draft.prompt.contactInfo?.manager || "Contact information"}
                      </p>
                      <p className="text-sm">
                        <strong>Booking:</strong> {draft.prompt.contactInfo?.booking || "Booking information"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Press:</strong> {draft.prompt.contactInfo?.press || "Press contact"}
                      </p>
                      <p className="text-sm">
                        <strong>Email:</strong> {draft.prompt.contactInfo?.email || "contact@example.com"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="markdown" className="pt-2">
          <CardContent>
            <div className="max-h-[32rem] overflow-y-auto p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-xs">{draft.content}</pre>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Agent Action Info */}
            <div className="text-right">
              <p className="text-sm font-medium">AI Agent Action</p>
              <p className="text-xs text-muted-foreground">Submit to media outlets & venues</p>
            </div>

            <Button
              onClick={handleSubmitToMedia}
              disabled={isSubmitting || isSubmitted}
              className="bg-teal-500 hover:bg-teal-600 text-white min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting EPK...
                </>
              ) : isSubmitted ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submitted
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to Media
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
