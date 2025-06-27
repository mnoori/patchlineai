import { NextResponse } from "next/server";
import { ContentPrompt } from "@/lib/blog-types";
import { createContentDraft, getContentDraft, updateContentDraft } from "@/lib/blog-db";
import { CONTENT_DRAFTS_TABLE } from "@/lib/aws-config";
import { generateContentWithBedrock } from "@/lib/bedrock-client";

// Generate content using Amazon Bedrock
async function generateContent(prompt: ContentPrompt): Promise<{content: string, promptUsed?: string}> {
  console.log(`[API /content generateContent] Generating content for topic: "${prompt.topic}" using Bedrock`);
  console.log(`[API /content generateContent] Using model: ${prompt.modelId || 'default'}`);
  
  try {
    // If a custom prompt was provided, use it instead of generating one
    if (prompt.customPrompt) {
      console.log(`[API /content generateContent] Using custom prompt provided (${prompt.customPrompt.length} chars)`);
      
      // Use Bedrock with the custom prompt
      const result = await generateContentWithBedrock(
        prompt, 
        prompt.modelId,
        true,
        prompt.customPrompt
      );
      
      console.log(`[API /content generateContent] Content generation completed with custom prompt for topic: "${prompt.topic}" (${result.content.length} chars)`);
      return result;
    }
    
    // Otherwise use Bedrock with the standard content generation logic
    const result = await generateContentWithBedrock(
      prompt, 
      prompt.modelId, 
      true
    );
    
    console.log(`[API /content generateContent] Content generation completed for topic: "${prompt.topic}" (${result.content.length} chars)`);
    return result;
  } catch (error) {
    console.error(`[API /content generateContent] Error using Bedrock:`, error);
    console.error(`[API /content generateContent] Falling back to mock content generation`);
    
    // Fallback to mock content if Bedrock fails
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
        console.log(`[API /content generateContent] Mock content generation completed for topic: "${prompt.topic}" (${content.length} chars)`);
        
        // Include a mock prompt if requested
        const mockPrompt = `System: You are a professional content writer.\nUser: Write about ${prompt.topic}`;
        
        resolve({ 
          content,
          promptUsed: mockPrompt
        });
      }, 2000); // Simulate a 2-second delay for AI generation
    });
  }
}

// POST /api/content - Start content generation
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log(`[API /content POST] Received request to generate content for topic: "${data.topic}"`);
    console.log(`[API /content POST] Model: ${data.modelId || 'default'}`);
    console.log(`[API /content POST] Using table: ${CONTENT_DRAFTS_TABLE}`);
    
    // Validate the prompt
    if (!data.topic) {
      console.log("[API /content POST] Missing required field: topic");
      return NextResponse.json(
        { error: "Missing required field: topic" },
        { status: 400 }
      );
    }
    
    // Create a new draft with the prompt
    console.log(`[API /content POST] Creating content draft for topic: "${data.topic}"`);
    const draft = await createContentDraft(data);
    console.log(`[API /content POST] Draft created with ID: ${draft.id}`);
    
    // Start the content generation process (async)
    generateContent(data).then(async (result) => {
      console.log(`[API /content POST] Content generated, updating draft ID: ${draft.id}`);
      // Update the draft with the generated content
      const updatedDraft = await updateContentDraft(draft.id, {
        content: result.content,
        status: "generated",
      });
      
      console.log(`[API /content POST] Draft updated successfully. ID: ${draft.id}, content length: ${result.content.length} chars`);
    }).catch((error) => {
      console.error(`[API /content POST] Error generating content for draft ID: ${draft.id}`, error);
      console.error(`[API /content POST] Error details: ${error.message}`);
    });
    
    // Return the draft ID immediately, content generation continues in background
    console.log(`[API /content POST] Returning draft ID to client: ${draft.id}`);
    return NextResponse.json({ 
      message: "Content generation started",
      draftId: draft.id 
    });
    
  } catch (error: any) {
    console.error("[API /content POST] Error starting content generation:", error);
    console.error(`[API /content POST] Error details: ${error.message}`);
    console.error(`[API /content POST] Error type: ${error.__type}`);
    console.error(`[API /content POST] Table being accessed: ${CONTENT_DRAFTS_TABLE}`);
    
    return NextResponse.json(
      { 
        error: "Failed to start content generation",
        details: error.message,
        errorType: error.__type,
        tableAccessed: CONTENT_DRAFTS_TABLE
      },
      { status: 500 }
    );
  }
}

// GET /api/content?id=123 - Get a content draft by ID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  console.log(`[API /content GET] Received request to fetch content for draft ID: ${id}`);
  console.log(`[API /content GET] Using table: ${CONTENT_DRAFTS_TABLE}`);
  
  if (!id) {
    console.log("[API /content GET] Missing required parameter: id");
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }
  
  try {
    console.log(`[API /content GET] Fetching draft with ID: ${id}`);
    const draft = await getContentDraft(id);
    
    if (!draft) {
      console.log(`[API /content GET] Draft not found. ID: ${id}`);
      return NextResponse.json(
        { error: "Content draft not found" },
        { status: 404 }
      );
    }
    
    console.log(`[API /content GET] Draft found. ID: ${id}, status: ${draft.status}`);
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error(`[API /content GET] Error fetching content draft ID: ${id}`, error);
    console.error(`[API /content GET] Error details: ${error.message}`);
    console.error(`[API /content GET] Error type: ${error.__type}`);
    console.error(`[API /content GET] Table being accessed: ${CONTENT_DRAFTS_TABLE}`);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch content draft",
        details: error.message,
        errorType: error.__type,
        tableAccessed: CONTENT_DRAFTS_TABLE
      },
      { status: 500 }
    );
  }
}

// PUT /api/content?id=123 - Update a content draft
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  console.log(`[API /content PUT] Received request to update draft ID: ${id}`);
  console.log(`[API /content PUT] Using table: ${CONTENT_DRAFTS_TABLE}`);
  
  if (!id) {
    console.log("[API /content PUT] Missing required parameter: id");
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }
  
  try {
    // Get existing draft
    console.log(`[API /content PUT] Fetching current draft with ID: ${id}`);
    const currentDraft = await getContentDraft(id);
    
    if (!currentDraft) {
      console.log(`[API /content PUT] Draft not found. ID: ${id}`);
      return NextResponse.json(
        { error: "Content draft not found" },
        { status: 404 }
      );
    }
    
    // Get updated data from request
    const updateData = await req.json();
    
    // Merge with existing draft
    const updatedDraft = {
      ...currentDraft,
      ...updateData,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString(), // Always update timestamp
    };
    
    console.log(`[API /content PUT] Updating draft. ID: ${id}, status: ${updatedDraft.status}`);
    
    // Save updated draft
    const result = await updateContentDraft(id, updateData);
    
    console.log(`[API /content PUT] Draft updated successfully. ID: ${id}`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[API /content PUT] Error updating content draft ID: ${id}`, error);
    console.error(`[API /content PUT] Error details: ${error.message}`);
    console.error(`[API /content PUT] Error type: ${error.__type}`);
    console.error(`[API /content PUT] Table being accessed: ${CONTENT_DRAFTS_TABLE}`);
    
    return NextResponse.json(
      {
        error: "Failed to update content draft",
        details: error.message,
        errorType: error.__type,
        tableAccessed: CONTENT_DRAFTS_TABLE
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'
