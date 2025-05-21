import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { AWS_REGION } from "./aws-config";
import { createDynamoDBClient } from "./dynamodb-client";

/**
 * Class to handle interactions with AWS Bedrock models.
 * Uses the AWS SDK v3 with proper credential handling.
 */
export class BedrockClient {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private systemPrompt: string;

  /**
   * Create a new Bedrock client
   * @param modelId AWS Bedrock model ID to use
   * @param systemPrompt System prompt for the AI
   */
  constructor(
    modelId: string = process.env.BEDROCK_MODEL_ID || "amazon.nova-micro-v1:0",
    systemPrompt: string = process.env.SYSTEM_PROMPT || "You are a helpful assistant. Provide clear, concise responses."
  ) {
    console.log(`[Bedrock] Initializing client with model: ${modelId}`);
    console.log("[Bedrock] Credentials check:", {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "set" : "undefined",
      ACCESS_KEY_ID: process.env.ACCESS_KEY_ID ? "set" : "undefined",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "set" : "undefined", 
      SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY ? "set" : "undefined",
      AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN ? "set" : "undefined"
    });

    const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
    const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
    const SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;

    // Create client with explicit credentials
    this.client = new BedrockRuntimeClient({ 
      region: AWS_REGION,
      credentials: ACCESS_KEY && SECRET_KEY ? {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
        ...(SESSION_TOKEN && { sessionToken: SESSION_TOKEN })
      } : undefined
    });
    
    this.modelId = modelId;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Generate a response from the Bedrock model
   * @param message User message to process
   * @returns AI response text
   */
  async generateResponse(message: string): Promise<string> {
    console.log(`[Bedrock] Generating response for message: ${message.substring(0, 50)}...`);
    
    const isNova = this.modelId.startsWith("amazon.nova");
    
    // Format the request body based on model type
    const requestBody = isNova 
      ? {
          inferenceConfig: { max_new_tokens: 1000 },
          messages: [
            {
              role: "user",
              content: [{ text: message }]
            }
          ]
        }
      : {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: message }
          ]
        };
    
    try {
      // Send request to Bedrock
      const response = await this.client.send(
        new InvokeModelCommand({
          modelId: this.modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify(requestBody)
        })
      );
      
      // Parse the response
      const responseBody = new TextDecoder().decode(response.body);
      const payload = JSON.parse(responseBody);
      
      // Extract the text based on model type
      const aiResponse = isNova
        ? payload?.output?.message?.content?.[0]?.text || "No response generated."
        : payload?.content?.[0]?.text || "No response generated.";
      
      console.log(`[Bedrock] Response generated: ${aiResponse.substring(0, 50)}...`);
      return aiResponse;
    } catch (error) {
      console.error("[Bedrock] Error generating response:", error);
      throw error;
    }
  }
}

/**
 * Singleton instance of BedrockClient to be used across the application
 */
export const bedrockClient = new BedrockClient();

/**
 * Create a properly configured Bedrock client using explicit credentials
 * to avoid CredentialsProviderError in Amplify SSR environments.
 */
export function createBedrockClient() {
  const REGION = process.env.AWS_REGION || process.env.REGION_AWS || "us-east-1";
  const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
  const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
  const SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;

  // Log presence of credentials (not values)
  console.log(`[Bedrock] Client initialized with region: ${REGION}`);
  console.log("[Bedrock] Credentials check:", {
    ACCESS_KEY_ID: ACCESS_KEY ? "set" : "undefined",
    SECRET_KEY: SECRET_KEY ? "set" : "undefined",
    SESSION_TOKEN: SESSION_TOKEN ? "set" : "undefined"
  });

  return new BedrockRuntimeClient({
    region: REGION,
    credentials: ACCESS_KEY && SECRET_KEY ? {
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      ...(SESSION_TOKEN && { sessionToken: SESSION_TOKEN })
    } : undefined
  });
}

/**
 * Available Bedrock AI models
 */
export const BEDROCK_MODELS = [
  {
    id: "amazon.nova-micro-v1:0",
    name: "Amazon Nova Micro",
    description: "Fast, lightweight model (free tier eligible)"
  },
  {
    id: "amazon.nova-premier-v1:0",
    name: "Amazon Nova Premier",
    description: "Improved quality Nova model"
  },
  {
    id: "anthropic.claude-3-5-haiku-20241022-v1:0",
    name: "Claude 3.5 Haiku",
    description: "Fast Claude model with good quality"
  },
  {
    id: "anthropic.claude-3-7-sonnet-20250219-v1:0",
    name: "Claude 3.7 Sonnet",
    description: "Premium quality model, highest cost"
  }
];

/**
 * Generate content using Amazon Bedrock
 * 
 * @param prompt Content generation prompt details
 * @param modelId Bedrock model ID to use
 * @returns Generated content as a string
 */
export async function generateContentWithBedrock(
  prompt: any,
  modelId: string = process.env.BEDROCK_MODEL_ID || "amazon.nova-micro-v1:0",
  showPrompt: boolean = false
): Promise<{content: string, promptUsed?: string}> {
  console.log(`[Bedrock] Generating content for topic: "${prompt.topic}" using model: ${modelId}`);
  
  try {
    const client = createBedrockClient();
    
    // Create a descriptive prompt based on the input parameters
    let promptText = `
You are a professional content writer. Please generate high-quality content on the following topic:

TOPIC: ${prompt.topic}

`;

    if (prompt.keywords && prompt.keywords.length > 0) {
      promptText += `KEYWORDS: ${Array.isArray(prompt.keywords) ? prompt.keywords.join(", ") : prompt.keywords}\n\n`;
    }
    
    if (prompt.tone) {
      promptText += `TONE: ${prompt.tone}\n\n`;
    }
    
    if (prompt.length) {
      const wordCount = prompt.length === "short" ? 500 : prompt.length === "medium" ? 1000 : 2000;
      promptText += `LENGTH: Approximately ${wordCount} words\n\n`;
    }
    
    if (prompt.targetAudience) {
      promptText += `TARGET AUDIENCE: ${prompt.targetAudience}\n\n`;
    }
    
    if (prompt.callToAction) {
      promptText += `CALL TO ACTION: Include this call to action: ${prompt.callToAction}\n\n`;
    }
    
    promptText += `
Please format the content using Markdown:
- Use # for the main title
- Use ## for section headings
- Use bullet points or numbered lists where appropriate
- Include bold or italic text for emphasis
    
Return only the content, without any additional explanation or commentary.`;

    console.log(`[Bedrock] Sending prompt to Bedrock (${promptText.length} chars)`);
    
    // Request structure depends on the model being used
    let requestBody;
    
    // For Amazon Nova models
    if (modelId.startsWith("amazon.nova")) {
      requestBody = {
        inferenceConfig: { 
          max_new_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9
        },
        messages: [
          { role: "user", content: [{ text: promptText }] }
        ]
      };
    }
    // For Claude 3.5 and 3.7 models (updated format)
    else if (modelId.includes("claude-3-5") || modelId.includes("claude-3-7")) {
      requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        top_k: 250,
        temperature: 0.7,
        top_p: 0.9,
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: promptText }
            ] 
          }
        ]
      };
    }
    // For older Claude models
    else if (modelId.startsWith("anthropic.claude")) {
      requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        messages: [
          { role: "user", content: promptText }
        ]
      };
    } 
    // For Amazon Titan models
    else if (modelId.startsWith("amazon.titan")) {
      requestBody = {
        inputText: promptText,
        textGenerationConfig: {
          maxTokenCount: 4000,
          temperature: 0.7,
          topP: 0.9
        }
      };
    }
    // For Cohere models
    else if (modelId.startsWith("cohere.command")) {
      requestBody = {
        prompt: promptText,
        max_tokens: 4000,
        temperature: 0.75
      };
    }
    // Default to Nova format as fallback
    else {
      requestBody = {
        inferenceConfig: { 
          max_new_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9
        },
        messages: [
          { role: "user", content: [{ text: promptText }] }
        ]
      };
    }
    
    // Send the request to Bedrock
    const response = await client.send(
      new InvokeModelCommand({
        modelId: modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody)
      })
    );
    
    // Parse the response based on the model
    const responseJson = JSON.parse(new TextDecoder().decode(response.body));
    
    let content = "";
    
    // Extract content based on model type
    if (modelId.includes("claude-3-5") || modelId.includes("claude-3-7")) {
      content = responseJson.content[0].text;
    } else if (modelId.startsWith("anthropic.claude")) {
      content = responseJson.content[0].text;
    } else if (modelId.startsWith("amazon.titan")) {
      content = responseJson.results[0].outputText;
    } else if (modelId.startsWith("amazon.nova")) {
      content = responseJson.output.message.content[0].text;
    } else if (modelId.startsWith("cohere.command")) {
      content = responseJson.generations[0].text;
    } else {
      // Default fallback
      content = JSON.stringify(responseJson);
    }
    
    console.log(`[Bedrock] Content generated successfully (${content.length} chars)`);
    
    // Return the content and optionally the prompt used
    if (showPrompt) {
      return { content, promptUsed: promptText };
    }
    return { content };
    
  } catch (error) {
    console.error("[Bedrock] Error generating content:", error);
    throw error;
  }
} 