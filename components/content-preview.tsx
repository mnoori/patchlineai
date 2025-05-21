"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentDraft, BlogPost } from "@/lib/blog-types";
import { Loader2, Edit, Copy, Download, Save, Sparkles, Zap, Check, AlertCircle, Calendar, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ContentPreviewProps {
  draftId: string;
  onPublish?: (draft: ContentDraft) => void;
  originalImage?: string;
  onBack?: () => void;
}

export function ContentPreview({ draftId, onPublish, originalImage, onBack }: ContentPreviewProps) {
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
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
      toast.success("Content copied to clipboard");
    }
  };

  const handleBackClick = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    }
  };
  
  const handlePublish = async () => {
    if (!draft) return;
    
    try {
      setIsPublishing(true);
      
      // Get current date for the post
      const now = new Date();
      const publishedDate = now.toISOString();
      
      // Format a human-readable date for display
      const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Generate a more unique title if needed
      const title = draft.prompt.topic;
      
      // Get keywords as an array
      const keywords = draft.prompt.keywords || [];
      
      // Generate a clean slug without timestamp suffix
      const cleanSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      // Add timestamp suffix to ensure uniqueness (6 digits format)
      const timestamp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const uniqueSlug = `${cleanSlug}-${timestamp}`;
      
      // Convert draft to BlogPost format
      const blogPost = {
        title: title,
        content: draft.content,
        author: {
          id: "system-user", // TODO: Use actual user ID from authentication
          name: "AI Content Creator"
        },
        status: "published",
        tags: keywords,
        category: draft.prompt.contentType || "blog",
        publishedDate: publishedDate,
        // Use unique slug with timestamp to avoid duplicate content URLs
        slug: uniqueSlug,
        seoDescription: draft.content.substring(0, 160), // First 160 chars as description
        heroImage: originalImage || "/music-industry-ai-blog.png", // Use the original image if provided
      };
      
      // Post to the blog API
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogPost),
      });
      
      if (!response.ok) {
        throw new Error("Failed to publish blog post");
      }
      
      const publishedPost = await response.json();
      
      // Update draft status to "approved"
      await fetch(`/api/content?id=${draft.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...draft,
          status: "approved"
        }),
      });
      
      // Update local state
      setDraft({
        ...draft,
        status: "approved"
      });
      
      // Store the published post URL for future reference
      const postUrl = `/blog/${publishedPost.slug}`;
      localStorage.setItem('lastPublishedPostUrl', postUrl);
      
      // Show success message
      toast.success("Published successfully!", {
        description: "Your post is now live on the blog",
        action: {
          label: "View Post",
          onClick: () => window.open(postUrl, "_blank"),
        },
      });
      
      // Call the onPublish callback if provided
      if (onPublish) {
        onPublish(draft);
      }
    } catch (error) {
      console.error("Error publishing blog post:", error);
      toast.error("Failed to publish", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  // If no draft ID, show a placeholder
  if (!draftId) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
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
      <Card className="w-full max-w-5xl mx-auto">
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
  
  // Format current date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Get category from prompt or default to "Blog"
  const category = draft.prompt.contentType ? 
    draft.prompt.contentType.charAt(0).toUpperCase() + draft.prompt.contentType.slice(1) : 
    "Blog";
  
  return (
    <Card className="w-full max-w-6xl mx-auto">
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="markdown" className="pt-2">
          <CardContent>
            <div className="max-h-[28rem] overflow-y-auto p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-xs">{draft.content}</pre>
            </div>
          </CardContent>
        </TabsContent>
        <TabsContent value="preview" className="pt-2">
          <CardContent>
            <div className="max-h-[28rem] overflow-y-auto">
              {/* Blog post preview in website style */}
              <div className="space-y-4">
                {/* Featured Blog Post Card - Similar to blog page */}
                <div className="glass-effect rounded-xl overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative h-64 md:h-full">
                      <Image
                        src={originalImage || "/music-industry-ai-blog.png"}
                        alt={draft.prompt.topic}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-cosmic-teal/20 text-cosmic-teal">
                          {category}
                        </span>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {currentDate}
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
                        {draft.prompt.topic}
                      </h2>
                      <div className="text-muted-foreground mb-6 flex-grow line-clamp-3">
                        {draft.content.substring(0, 150)}...
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actual content below */}
                <div className="mt-8 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{draft.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyContent}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        <Button 
          onClick={handlePublish} 
          disabled={isPublishing || draft.status === "approved"}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : draft.status === "approved" ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Published
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Publish to Blog
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 