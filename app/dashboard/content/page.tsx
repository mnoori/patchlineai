"use client";

import { useState, useEffect } from "react";
import { ContentCreatorForm } from "../../../components/content-creator-form";
import { ContentPreview } from "../../../components/content-preview";
import { ContentIdeaCarousel } from "../../../components/content-idea-carousel";
import { Button } from "@/components/ui/button";
import { ContentDraft, ContentPrompt } from "@/lib/blog-types";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContentPage() {
  const [draftId, setDraftId] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<ContentPrompt | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showCarousel, setShowCarousel] = useState(true);
  const [preserveScroll, setPreserveScroll] = useState(false);
  
  // Scroll to top on initial load, but only if not coming back from preview
  useEffect(() => {
    // Check if we're returning from preview (sessionStorage will have the form state)
    const hasStoredState = typeof window !== 'undefined' && 
      sessionStorage.getItem('content-creator-form-state') !== null;
    
    // Only scroll to top if we're not returning from preview
    if (!hasStoredState && !preserveScroll) {
      window.scrollTo(0, 0);
    }
  }, [preserveScroll]);
  
  const handleContentGenerated = (id: string) => {
    setDraftId(id);
  };
  
  const handleSelectIdea = (prompt: ContentPrompt) => {
    setSelectedPrompt(prompt);
    setCurrentStep(2);
  };
  
  const handleNewContent = () => {
    // Clear session storage to start fresh
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('content-creator-form-state');
    }
    
    setSelectedPrompt(null);
    setCurrentStep(1);
    setDraftId("");
    setShowCarousel(true);
    setPreserveScroll(false);
    
    // Scroll to top with a slight delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };
  
  const toggleCarousel = () => {
    setShowCarousel(prev => !prev);
  };
  
  const handlePublish = async (draft: ContentDraft) => {
    try {
      // Convert draft to a blog post
      const blogPost = {
        title: draft.prompt.topic,
        content: draft.content,
        author: {
          id: "user-1", // TODO: Use actual user ID
          name: "AI Creator", // TODO: Use actual user name
        },
        status: "published",
        tags: draft.prompt.keywords || [],
        category: draft.prompt.contentType || "blog",
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
      
      const data = await response.json();
      
      // Reset state after publishing
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('content-creator-form-state');
      }
      
      setDraftId("");
      setSelectedPrompt(null);
      setCurrentStep(1);
      setPreserveScroll(false);
      
      // Show success message
      alert(`Blog post published with ID: ${data.id}`);
      
    } catch (error) {
      console.error("Error publishing blog post:", error);
      // TODO: Show error message
    }
  };
  
  const handleBackFromPreview = () => {
    // Clear draft but stay on step 3 so user can review prompt again
    setDraftId("");
    setCurrentStep(3);
    setPreserveScroll(true); // Don't scroll to top when returning from preview
  };
  
  return (
    <div className="space-y-8 container mx-auto px-4 min-h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="flex items-center justify-between pt-4 sticky top-0 z-20 bg-background pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Post Creator</h1>
          <p className="text-muted-foreground">
            Generate blog posts and content with AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleCarousel} className="gap-1">
            {showCarousel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showCarousel ? "Hide Ideas" : "Show Ideas"}
          </Button>
          <Button onClick={handleNewContent}>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </div>
      </div>
      
      <div className="grid gap-8">
        {/* Content Ideas Carousel - Always available but can be hidden/shown */}
        {showCarousel && !draftId && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300 relative z-0">
            <ContentIdeaCarousel 
              onSelectIdea={handleSelectIdea} 
              selectedIdea={selectedPrompt?.topic || ""}
            />
          </div>
        )}
        
        {/* Content Creator / Preview */}
        <div className="flex justify-center w-full">
          {draftId ? (
            <ContentPreview 
              draftId={draftId} 
              onPublish={handlePublish} 
              originalImage={selectedPrompt?.topic ? 
                getImageForTopic(selectedPrompt.topic) : undefined
              }
              onBack={handleBackFromPreview}
            />
          ) : (
            <div id="content-form" className={cn(
              "animate-in w-full", 
              selectedPrompt ? "fade-in slide-in-from-bottom-4 duration-500" : ""
            )}>
              <ContentCreatorForm 
                onContentGenerated={handleContentGenerated} 
                initialPrompt={selectedPrompt}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get the image URL for a topic
function getImageForTopic(topic: string): string | undefined {
  const topics: Record<string, string> = {
    "The State of AI in Music: Beyond the Hype": "/music-industry-ai-blog.png",
    "How Independent Labels Can Compete Using AI": "/independent-labels-ai.png",
    "Metadata: The Hidden Value in Your Music Catalog": "/music-metadata-management.png",
    "Agent-Based Workflows: The Future of Creative Production": "/ai-agent-workflows.png"
  };
  
  return topics[topic];
} 