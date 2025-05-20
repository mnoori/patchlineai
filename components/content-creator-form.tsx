"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { ContentPrompt } from "@/lib/blog-types";

interface ContentCreatorFormProps {
  onContentGenerated?: (draftId: string) => void;
}

export function ContentCreatorForm({ onContentGenerated }: ContentCreatorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<ContentPrompt>({
    topic: "",
    tone: "professional",
    length: "medium",
    contentType: "blog",
  });
  const [keywords, setKeywords] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Prepare the prompt with keywords as array
      const finalPrompt: ContentPrompt = {
        ...prompt,
        keywords: keywords.split(",").map(k => k.trim()).filter(k => k),
      };

      // Send to the API
      const response = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPrompt),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      const data = await response.json();
      
      // Call the callback with the draft ID
      if (onContentGenerated) {
        onContentGenerated(data.draftId);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      // TODO: Add error handling/notification
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Content Creator</CardTitle>
        <CardDescription>
          Generate high-quality blog content with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="The State of AI in Music"
                  value={prompt.topic}
                  onChange={(e) => setPrompt({ ...prompt, topic: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma separated)</Label>
                <Input
                  id="keywords"
                  placeholder="AI, music production, artists, music industry"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
            </TabsContent>
            <TabsContent value="advanced" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={prompt.tone}
                    onValueChange={(value: any) => setPrompt({ ...prompt, tone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Select
                    value={prompt.length}
                    onValueChange={(value: any) => setPrompt({ ...prompt, length: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (~500 words)</SelectItem>
                      <SelectItem value="medium">Medium (~1000 words)</SelectItem>
                      <SelectItem value="long">Long (~2000 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="Music producers, indie artists, record labels"
                  value={prompt.targetAudience || ""}
                  onChange={(e) =>
                    setPrompt({ ...prompt, targetAudience: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callToAction">Call to Action</Label>
                <Input
                  id="callToAction"
                  placeholder="Sign up for our newsletter"
                  value={prompt.callToAction || ""}
                  onChange={(e) =>
                    setPrompt({ ...prompt, callToAction: e.target.value })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>
          <Button
            type="submit"
            className="w-full"
            disabled={isGenerating || !prompt.topic}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Content"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 