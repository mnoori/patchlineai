"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentDraft } from "@/lib/blog-types";
import { Loader2, Edit, Copy, Download, Save, Sparkles, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ContentPreviewProps {
  draftId: string;
  onPublish?: (draft: ContentDraft) => void;
}

export function ContentPreview({ draftId, onPublish }: ContentPreviewProps) {
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("preview");
  
  useEffect(() => {
    // If no draft ID, don't try to load
    if (!draftId) {
      setIsLoading(false);
      return;
    }
    
    // Poll for content until it's ready
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/content?id=${draftId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch draft");
        }
        
        const data = await response.json();
        setDraft(data);
        
        // If status is no longer "generating", stop polling
        if (data.status !== "generating") {
          setIsLoading(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error fetching draft:", error);
        setIsLoading(false);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds
    
    // Clean up on unmount
    return () => clearInterval(pollInterval);
  }, [draftId]);
  
  const handleCopyContent = () => {
    if (draft?.content) {
      navigator.clipboard.writeText(draft.content);
      // TODO: Add notification for successful copy
    }
  };
  
  const handlePublish = () => {
    if (draft && onPublish) {
      onPublish(draft);
    }
  };
  
  // If no draft ID, show a placeholder
  if (!draftId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
          <CardDescription>
            Generate content to preview it here
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No content generated yet
        </CardContent>
      </Card>
    );
  }
  
  // Show loading state
  if (isLoading || !draft) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
          <CardDescription>
            Generating your content...
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">
              We're working on your content. This may take a few moments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get model information
  const modelId = draft.prompt.modelId || "default";
  const modelName = modelId.includes("claude") 
    ? `Claude ${modelId.includes("3-7") ? "3.7" : "3.5"}`
    : modelId.includes("nova-premier") 
      ? "Nova Premier" 
      : modelId.includes("nova-micro") 
        ? "Nova Micro" 
        : "AI";
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Content Preview</CardTitle>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground rounded-full px-2 py-1 bg-muted">
            <Sparkles className="h-3 w-3 mr-1" />
            Generated with {modelName}
          </div>
        </div>
        <CardDescription>
          {draft.status === "ready" ? "Your content is ready" : draft.status}
        </CardDescription>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            {draft.promptUsed && <TabsTrigger value="prompt">AI Prompt</TabsTrigger>}
          </TabsList>
        </div>
        <TabsContent value="preview" className="pt-2">
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <div className="max-h-[28rem] overflow-y-auto p-4">
              <ReactMarkdown>{draft.content}</ReactMarkdown>
            </div>
          </CardContent>
        </TabsContent>
        <TabsContent value="markdown" className="pt-2">
          <CardContent>
            <div className="max-h-[28rem] overflow-y-auto p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-xs">{draft.content}</pre>
            </div>
          </CardContent>
        </TabsContent>
        {draft.promptUsed && (
          <TabsContent value="prompt" className="pt-2">
            <CardContent>
              <div className="flex items-center mb-2 gap-1">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Prompt sent to the AI model</span>
              </div>
              <div className="max-h-[28rem] overflow-y-auto p-4 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap text-xs font-mono">{draft.promptUsed}</pre>
              </div>
            </CardContent>
          </TabsContent>
        )}
      </Tabs>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopyContent}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        <Button onClick={handlePublish}>
          <Save className="h-4 w-4 mr-2" />
          Publish to Blog
        </Button>
      </CardFooter>
    </Card>
  );
} 