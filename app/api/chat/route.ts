import { NextResponse } from "next/server";
import { BedrockClient, createBedrockClient } from "@/lib/bedrock-client";

// POST /api/chat - Send a message to the chatbot
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log(`[API /chat POST] Received chat message: "${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}"`);
    console.log(`[API /chat POST] Using model: ${data.modelId || 'default'}`);

    // Validate the message
    if (!data.message) {
      console.log("[API /chat POST] Missing required field: message");
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 }
      );
    }

    // Create a Bedrock client with the specified model
    const modelId = data.modelId || process.env.BEDROCK_MODEL_ID || "amazon.nova-micro-v1:0";
    const bedrockClient = new BedrockClient(
      modelId,
      "You are Patchy, a helpful assistant specialized in music production, the music industry, and catalog management. You provide concise, helpful responses based on your knowledge. Your responses should be professional and informative."
    );

    // Generate response from Bedrock
    console.log(`[API /chat POST] Generating response using model ${modelId}`);
    const response = await bedrockClient.generateResponse(data.message);
    console.log(`[API /chat POST] Response generated (${response.length} chars)`);

    return NextResponse.json({ 
      response,
      model: modelId
    });

  } catch (error: any) {
    console.error("[API /chat POST] Error generating chat response:", error);
    console.error(`[API /chat POST] Error details: ${error.message}`);
    
    return NextResponse.json(
      { 
        error: "Failed to generate chat response",
        details: error.message
      },
      { status: 500 }
    );
  }
}
