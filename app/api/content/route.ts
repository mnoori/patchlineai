import { NextResponse } from "next/server";
import { ContentPrompt } from "@/lib/blog-types";
import { createContentDraft, getContentDraft, updateContentDraft } from "@/lib/blog-db";

// Simulate AI content generation
async function generateContent(prompt: ContentPrompt): Promise<string> {
  // TODO: Replace with actual API call to an LLM API service
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mockup response for testing
      const intro = `# ${prompt.topic}\n\n`;
      const paragraphs = [
        `As the music industry evolves with technological advancements, artists and labels face new challenges and opportunities.`,
        `In this article, we explore how ${prompt.topic} is changing the landscape for musicians worldwide.`,
        `## Key Innovations\n\nThe most significant developments include AI-assisted composition, automated mastering, and personalized fan experiences.`,
        `## Impact on Artists\n\nCreators can now focus more on creative expression while automation handles technical aspects.`,
        `## Future Outlook\n\nWe anticipate further integration of technology into all aspects of music creation and distribution.`,
      ];
      
      const content = intro + paragraphs.join("\n\n");
      resolve(content);
    }, 2000); // Simulate a 2-second delay for AI generation
  });
}

// POST /api/content - Start content generation
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate the prompt
    if (!data.topic) {
      return NextResponse.json(
        { error: "Missing required field: topic" },
        { status: 400 }
      );
    }
    
    // Create a new draft with the prompt
    const draft = await createContentDraft(data);
    
    // Start the content generation process (async)
    generateContent(data).then(async (content) => {
      // Update the draft with the generated content
      const updatedDraft = await updateContentDraft({
        ...draft,
        content,
        status: "ready",
      });
      
      console.log(`Content generated for draft ID: ${draft.id}`);
    }).catch((error) => {
      console.error(`Error generating content for draft ID: ${draft.id}`, error);
    });
    
    // Return the draft ID immediately, content generation continues in background
    return NextResponse.json({ 
      message: "Content generation started",
      draftId: draft.id 
    });
    
  } catch (error) {
    console.error("Error starting content generation:", error);
    return NextResponse.json(
      { error: "Failed to start content generation" },
      { status: 500 }
    );
  }
}

// GET /api/content?id=123 - Get a content draft by ID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }
  
  try {
    const draft = await getContentDraft(id);
    
    if (!draft) {
      return NextResponse.json(
        { error: "Content draft not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(draft);
  } catch (error) {
    console.error(`Error fetching content draft ID: ${id}`, error);
    return NextResponse.json(
      { error: "Failed to fetch content draft" },
      { status: 500 }
    );
  }
} 