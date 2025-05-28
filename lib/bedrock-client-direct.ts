import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import { CONFIG } from "./config"
import { BEDROCK_MODELS } from "./models-config"

/**
 * Direct Bedrock client that bypasses development mode checks
 * Use this when you want real AI responses even in development
 */
export class BedrockClientDirect {
  private client: BedrockRuntimeClient
  private modelId: string
  private systemPrompt: string

  constructor(modelId: string = CONFIG.BEDROCK_MODEL_ID, systemPrompt: string = CONFIG.SYSTEM_PROMPT) {
    console.log(`[BedrockDirect] Initializing DIRECT client with model: ${modelId}`)
    
    this.modelId = modelId
    this.systemPrompt = systemPrompt

    // Always initialize the real client
    this.client = new BedrockRuntimeClient({
      region: CONFIG.AWS_REGION,
      credentials: {
        accessKeyId: CONFIG.AWS_ACCESS_KEY_ID,
        secretAccessKey: CONFIG.AWS_SECRET_ACCESS_KEY,
        ...(CONFIG.AWS_SESSION_TOKEN && { sessionToken: CONFIG.AWS_SESSION_TOKEN }),
      },
    })
  }

  /**
   * Get the appropriate model identifier (either direct ID or inference profile)
   */
  private getModelIdentifier(modelId: string): string {
    // Check if this is one of our known model keys
    const modelKeys = Object.keys(BEDROCK_MODELS)
    const matchingKey = modelKeys.find(key => BEDROCK_MODELS[key].id === modelId)
    
    if (matchingKey && BEDROCK_MODELS[matchingKey].inferenceProfile) {
      console.log(`[BedrockDirect] Using inference profile for ${matchingKey}`)
      return BEDROCK_MODELS[matchingKey].inferenceProfile
    }
    
    // Otherwise use the model ID directly
    return modelId
  }

  async generateResponse(message: string): Promise<string> {
    console.log(`[BedrockDirect] Generating REAL response for message: ${message.substring(0, 50)}...`)

    // Get the appropriate model identifier (might be an inference profile)
    const modelIdentifier = this.getModelIdentifier(this.modelId)
    console.log(`[BedrockDirect] Using model identifier: ${modelIdentifier}`)

    const isNova = this.modelId.startsWith("amazon.nova")
    const isClaude = this.modelId.includes("claude")

    // Format the request body based on model type
    let requestBody: any

    if (isNova) {
      requestBody = {
        inferenceConfig: { max_new_tokens: 1000 },
        messages: [
          {
            role: "user",
            content: [{ text: message }],
          },
        ],
        system: [{ text: this.systemPrompt }],
      }
    } else if (isClaude) {
      // Claude models (including 3.7 and 4.x) use this format
      requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          { role: "user", content: message }
        ],
        system: this.systemPrompt
      }
    } else {
      // Default format
      requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: message },
        ],
      }
    }

    try {
      // Send request to Bedrock
      const response = await this.client.send(
        new InvokeModelCommand({
          modelId: modelIdentifier,  // Use the identifier which might be an inference profile
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify(requestBody),
        }),
      )

      // Parse the response
      const responseBody = new TextDecoder().decode(response.body)
      const payload = JSON.parse(responseBody)

      // Extract the text based on model type
      const aiResponse = isNova
        ? payload?.output?.message?.content?.[0]?.text || "No response generated."
        : payload?.content?.[0]?.text || "No response generated."

      console.log(`[BedrockDirect] Response generated: ${aiResponse.substring(0, 50)}...`)
      return aiResponse
    } catch (error) {
      console.error("[BedrockDirect] Error generating response:", error)
      throw error
    }
  }
} 