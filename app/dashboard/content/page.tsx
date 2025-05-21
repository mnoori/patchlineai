"use client";

import { useState } from "react";
import { ContentCreatorForm } from "@/components/content-creator-form";
import { ContentPreview } from "@/components/content-preview";
import { Button } from "@/components/ui/button";
import { ContentDraft } from "@/lib/blog-types";
import { Plus } from "lucide-react";

export default function ContentPage() {
  const [draftId, setDraftId] = useState<string>("");
  
  const handleContentGenerated = (id: string) => {
    setDraftId(id);
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
      
      // TODO: Show success message and redirect to the published blog post
      alert(`Blog post published with ID: ${data.id}`);
      
    } catch (error) {
      console.error("Error publishing blog post:", error);
      // TODO: Show error message
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Post Creator</h1>
          <p className="text-muted-foreground">
            Generate blog posts and content with AI assistance
          </p>
        </div>
        <Button onClick={() => setDraftId("")}>
          <Plus className="mr-2 h-4 w-4" />
          New Content
        </Button>
      </div>
      
      <div className="grid gap-8 mt-8">
        {!draftId ? (
          <ContentCreatorForm onContentGenerated={handleContentGenerated} />
        ) : (
          <ContentPreview draftId={draftId} onPublish={handlePublish} />
        )}
      </div>
    </div>
  );
} 