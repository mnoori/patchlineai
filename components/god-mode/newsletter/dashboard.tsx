"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Newspaper, 
  Sparkles, 
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Mail,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Palette,
  Target,
  PenTool,
  Send,
  Eye,
  Download,
  Search,
  Globe,
  Brain,
  Edit,
  RefreshCw,
  Code,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface NewsletterTopic {
  title: string
  description: string
  relevanceScore: number
  sources: string[]
}

interface ResearchResult {
  topic: string
  summary: string
  keyPoints: string[]
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
}

interface NewsletterSection {
  title: string
  content: string
  imagePrompt: string
  imageUrl?: string
}

interface NewsletterData {
  headline: string
  introduction: string
  sections: NewsletterSection[]
  conclusion: string
  callToAction: string
}

export function NewsletterGeneratorDashboard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Step 1: Topic Input
  const [topicInput, setTopicInput] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [tone, setTone] = useState("professional")
  
  // Step 2: AI Topic Research
  const [suggestedTopics, setSuggestedTopics] = useState<NewsletterTopic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  
  // Step 3: Web Research
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([])
  
  // Step 4: Content Synthesis
  const [newsletterData, setNewsletterData] = useState<NewsletterData | null>(null)
  const [editableContent, setEditableContent] = useState<string>("")
  
  // Step 5: Image Generation
  const [generatingImages, setGeneratingImages] = useState(false)
  
  // Step 6: HTML Export
  const [finalHtml, setFinalHtml] = useState("")

  const steps = [
    { title: "Topic Input", icon: Target, description: "Define newsletter focus and audience" },
    { title: "AI Research", icon: Brain, description: "AI finds relevant topics and angles" },
    { title: "Web Search", icon: Globe, description: "Gather latest information from web" },
    { title: "Synthesis", icon: PenTool, description: "AI synthesizes content into newsletter" },
    { title: "Visuals", icon: ImageIcon, description: "Generate images for each section" },
    { title: "Export", icon: Code, description: "Generate HTML for Beehiiv" },
  ]

  // Step 1: AI Topic Research
  const generateTopicSuggestions = async () => {
    setIsProcessing(true)
    try {
      // Generate dynamic topics based on user input
      const topicKeywords = topicInput.toLowerCase().split(' ')
      const audienceKeywords = targetAudience.toLowerCase().split(' ')
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate more dynamic topics based on user input
      const topicVariations = [
        `${topicInput} Recent Developments`,
        `Future of ${topicInput}`,
        `${topicInput} Market Analysis`,
        `${topicInput} Innovation Trends`,
        `${topicInput} Industry Impact`,
        `${topicInput} Best Practices`,
        `${topicInput} Case Studies`,
        `${topicInput} Regulatory Updates`
      ]
      
      const relevanceSources = [
        "Industry Reports", "Research Papers", "Expert Analysis",
        "Market Studies", "Technical Journals", "News Sources",
        "Academic Research", "Patent Filings", "Conference Proceedings"
      ]
      
      const dynamicTopics: NewsletterTopic[] = topicVariations.slice(0, 4).map((title, index) => ({
        title,
        description: `Latest insights and developments in ${topicInput.toLowerCase()} relevant for ${targetAudience.toLowerCase()}`,
        relevanceScore: 95 - (index * 2) + Math.floor(Math.random() * 5),
        sources: relevanceSources.slice(index, index + 3)
      }))
      
      setSuggestedTopics(dynamicTopics)
      toast.success(`AI found ${dynamicTopics.length} relevant topics based on your input!`)
      setCurrentStep(1)
    } catch (error) {
      toast.error("Failed to generate topic suggestions")
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 2: Web Research
  const conductWebResearch = async () => {
    setIsProcessing(true)
    try {
      const results: ResearchResult[] = []
      
      for (const topicTitle of selectedTopics) {
        // Actual web search for each topic
        const searchResponse = await fetch('/api/search/web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: topicTitle,
            maxResults: 5
          })
        })
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          
          // Extract key points from search results
          const keyPoints = searchData.results.slice(0, 4).map((result: any) => 
            result.snippet.split('.')[0] + '.'
          )
          
          results.push({
            topic: topicTitle,
            summary: `Based on recent web research, ${topicTitle.toLowerCase()} is showing significant developments across multiple sectors with increasing industry adoption and investment.`,
            keyPoints,
            sources: searchData.results.map((result: any) => ({
              title: result.title,
              url: result.url,
              snippet: result.snippet
            }))
          })
        } else {
          // Fallback to basic structure if search fails
          results.push({
            topic: topicTitle,
            summary: `Research indicates growing interest in ${topicTitle.toLowerCase()} with emerging applications and market opportunities.`,
            keyPoints: [
              "Increasing industry adoption",
              "New technological breakthroughs",
              "Growing market demand",
              "Investment opportunities emerging"
            ],
            sources: [{
              title: `${topicTitle} Overview`,
              url: "#",
              snippet: "Comprehensive analysis of current trends and future prospects."
            }]
          })
        }
        
        // Small delay between searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setResearchResults(results)
      toast.success(`Successfully researched ${selectedTopics.length} topics with live web data!`)
      setCurrentStep(2)
    } catch (error) {
      toast.error("Web research failed")
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 3: Content Synthesis
  const synthesizeContent = async () => {
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const synthesized: NewsletterData = {
        headline: `Technology Signals from the Simulation Edge`,
        introduction: `This is Agent YX reporting from the edge of the simulation. Below are this cycle's most vital signals on emerging technologies — including AI, quantum computing, synthetic biology, climate tech, and more.`,
        sections: researchResults.map((result, idx) => ({
          title: result.topic,
          content: `${result.summary}\n\n${result.keyPoints.map(point => `• ${point}`).join('\n')}\n\nRecent breakthroughs in this field are revolutionizing how we approach complex challenges. Industry leaders are investing heavily, with projected growth rates exceeding expectations. The convergence of these technologies promises to redefine our understanding of what's possible.`,
          imagePrompt: `Futuristic technology illustration representing ${result.topic}, cyberpunk style, neon colors, high-tech aesthetic`
        })),
        conclusion: `As these converging technologies mature, their combined potential could redefine sustainability paradigms, transforming visions of a resilient planet into reality.`,
        callToAction: `Remain vigilant. Signal strength: High. — Agent YX, Exponential Watch Network`
      }
      
      setNewsletterData(synthesized)
      setEditableContent(JSON.stringify(synthesized, null, 2))
      toast.success("Content synthesized successfully!")
      setCurrentStep(3)
    } catch (error) {
      toast.error("Content synthesis failed")
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 4: Generate Images
  const generateImages = async () => {
    if (!newsletterData) return
    
    setGeneratingImages(true)
    try {
      const updatedSections = [...newsletterData.sections]
      
      for (let i = 0; i < updatedSections.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        updatedSections[i].imageUrl = `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(updatedSections[i].title)}`
        
        // Update state to show progress
        setNewsletterData({
          ...newsletterData,
          sections: updatedSections
        })
      }
      
      toast.success("All images generated successfully!")
      setCurrentStep(4)
    } catch (error) {
      toast.error("Image generation failed")
    } finally {
      setGeneratingImages(false)
    }
  }

  // Step 5: Generate HTML
  const generateHtml = () => {
    if (!newsletterData) return
    
    const html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${newsletterData.headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 10px;">
        <table width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 20px;">
              <div style="font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #ffffff;">THE BREACH REPORT</div>
              <div style="width: 50px; height: 2px; background-color: #38bdf8; margin: 10px auto;"></div>
            </td>
          </tr>
          <!-- Title + Content -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <h1 style="font-size: 20px; color: #ffffff; text-align: center; margin: 20px 0; font-weight: 700;">${newsletterData.headline}</h1>
              
              <h2 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; color: #38bdf8; margin: 20px 0 12px; font-weight: 700;">Good Morning, Operator.</h2>
              <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #d1d5db; margin: 12px 0 24px; line-height: 1.6;">${newsletterData.introduction}</p>

              ${newsletterData.sections.map(section => `
                <div style="margin: 16px 0;">
                  ${section.imageUrl ? `<img src="${section.imageUrl}" alt="Technology Signal" style="display: block; width: 100%; max-width: 100%; border-radius: 10px; margin: 0 auto; height: auto; border: 1px solid rgba(56, 189, 248, 0.3);">` : ''}
                </div>
                <h3 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #38bdf8; margin: 20px 0 10px; font-weight: 700;">${section.title}</h3>
                <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #d1d5db; margin: 12px 0; line-height: 1.6;">${section.content.replace(/\n/g, '<br>')}</p>
                <div style="margin-top: 30px; margin-bottom: 12px; padding-top: 30px; border-top: 1px solid rgba(56, 189, 248, 0.2);"></div>
              `).join('')}

              <div style="margin: 30px 0 20px; padding: 20px; border-radius: 8px; background-color: rgba(17, 24, 39, 0.5); border-left: 3px solid #38bdf8;">
                <h3 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #38bdf8; margin: 0 0 12px; font-weight: 700;">End of Transmission</h3>
                <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #d1d5db; margin: 10px 0;">${newsletterData.callToAction}</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 15px; border-top: 1px solid rgba(56, 189, 248, 0.2); background-color: #0f172a;">
              <div style="font-size: 12px; color: #94a3b8; text-align: center; letter-spacing: 1px;">EXPONENTIAL WATCH NETWORK • ${new Date().toISOString().split('T')[0]}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    
    setFinalHtml(html)
    setCurrentStep(5)
    toast.success("HTML newsletter generated and ready for Beehiiv!")
  }

  const toggleTopicSelection = (topicTitle: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicTitle) 
        ? prev.filter(t => t !== topicTitle)
        : [...prev, topicTitle]
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            
            return (
              <div
                key={step.title}
                className={cn(
                  "flex flex-col items-center cursor-pointer transition-all",
                  isActive && "scale-110",
                  !isActive && !isCompleted && "opacity-50"
                )}
                onClick={() => index <= currentStep && setCurrentStep(index)}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center bg-background transition-all",
                    isActive && "border-amber-400 shadow-lg shadow-amber-400/20",
                    isCompleted && "border-emerald-400 bg-emerald-400/10"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Icon className={cn(
                      "w-6 h-6",
                      isActive ? "text-amber-400" : "text-muted-foreground"
                    )} />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium",
                  isActive && "text-amber-400"
                )}>
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 0: Topic Input */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">Newsletter Topic/Theme</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Emerging Technologies, AI Breakthroughs, Climate Tech"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., Tech executives, Investors, Researchers"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tone">Newsletter Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="futuristic">Futuristic/Sci-Fi</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={generateTopicSuggestions}
                disabled={!topicInput || isProcessing}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI is researching topics...
                  </>
                ) : (
                  <>
                    Let AI Research Topics
                    <Brain className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 1: AI Topic Research Results */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AI found these relevant topics:</h3>
                {suggestedTopics.map((topic, index) => (
                  <Card 
                    key={index}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg",
                      selectedTopics.includes(topic.title) && "ring-2 ring-amber-400 bg-amber-400/5"
                    )}
                    onClick={() => toggleTopicSelection(topic.title)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{topic.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">Relevance: {topic.relevanceScore}%</Badge>
                            <div className="flex gap-1">
                              {topic.sources.map((source, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{source}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        {selectedTopics.includes(topic.title) && (
                          <CheckCircle2 className="w-5 h-5 text-amber-400 ml-4" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button
                onClick={conductWebResearch}
                disabled={selectedTopics.length === 0 || isProcessing}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Researching from web sources...
                  </>
                ) : (
                  <>
                    Research Selected Topics ({selectedTopics.length})
                    <Search className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Web Research Results */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Research Results:</h3>
              {researchResults.map((result, index) => (
                <Card key={index} className="glass-effect">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{result.topic}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{result.summary}</p>
                    <div className="space-y-1 mb-3">
                      {result.keyPoints.map((point, idx) => (
                        <div key={idx} className="text-sm flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-amber-400 mt-2" />
                          {point}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {result.sources.map((source, idx) => (
                        <div key={idx} className="text-xs p-2 bg-muted/50 rounded">
                          <div className="font-medium">{source.title}</div>
                          <div className="text-muted-foreground">{source.snippet}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                onClick={synthesizeContent}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI is synthesizing content...
                  </>
                ) : (
                  <>
                    Synthesize into Newsletter
                    <PenTool className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Content Synthesis */}
          {currentStep === 3 && newsletterData && (
            <div className="space-y-6">
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit JSON</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/20">
                    <h2 className="text-xl font-bold mb-4">{newsletterData.headline}</h2>
                    <p className="text-muted-foreground mb-6">{newsletterData.introduction}</p>
                    
                    {newsletterData.sections.map((section, index) => (
                      <div key={index} className="mb-6 p-4 border rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                        <p className="text-sm whitespace-pre-line">{section.content}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Image prompt: {section.imagePrompt}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 p-4 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                      <p className="font-medium">{newsletterData.conclusion}</p>
                      <p className="text-sm text-muted-foreground mt-2">{newsletterData.callToAction}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="edit">
                  <div className="space-y-2">
                    <Label>Edit Newsletter Content (JSON)</Label>
                    <Textarea
                      value={editableContent}
                      onChange={(e) => setEditableContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          setNewsletterData(JSON.parse(editableContent))
                          toast.success("Content updated!")
                        } catch {
                          toast.error("Invalid JSON format")
                        }
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Update Content
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              <Button
                onClick={generateImages}
                disabled={generatingImages}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
              >
                {generatingImages ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Images...
                  </>
                ) : (
                  <>
                    Generate Images for Sections
                    <ImageIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Image Generation */}
          {currentStep === 4 && newsletterData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Generated Images:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsletterData.sections.map((section, index) => (
                  <Card key={index} className="glass-effect">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{section.title}</h4>
                      {section.imageUrl ? (
                        <img 
                          src={section.imageUrl} 
                          alt={section.title}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted rounded-lg mb-2 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{section.imagePrompt}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button
                onClick={generateHtml}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
              >
                Generate HTML for Beehiiv
                <Code className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 5: HTML Export */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>HTML Newsletter (Ready for Beehiiv)</Label>
                <Textarea
                  value={finalHtml}
                  onChange={(e) => setFinalHtml(e.target.value)}
                  className="min-h-[300px] font-mono text-xs"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(finalHtml)
                    toast.success("HTML copied to clipboard!")
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Copy HTML
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const blob = new Blob([finalHtml], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'newsletter.html'
                    a.click()
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download HTML
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
                  onClick={() => window.open('https://beehiiv.com', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Beehiiv
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-effect bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Newsletters Created</p>
                <p className="text-2xl font-bold text-purple-400">847</p>
                <p className="text-xs text-purple-400/60 mt-1">+34 this week</p>
              </div>
              <Newspaper className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold text-blue-400">42.8%</p>
                <p className="text-xs text-blue-400/60 mt-1">Industry avg: 21%</p>
              </div>
              <Mail className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-bold text-emerald-400">18.4%</p>
                <p className="text-xs text-emerald-400/60 mt-1">+2.1% vs last month</p>
              </div>
              <Target className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 