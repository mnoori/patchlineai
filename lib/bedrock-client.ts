import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import { AWS_REGION } from "./aws-config"
import { CONFIG, shouldUseMockData, getAWSCredentials } from "./config"

/**
 * Class to handle interactions with AWS Bedrock models.
 * Uses the AWS SDK v3 with proper credential handling.
 */
export class BedrockClient {
  private client: BedrockRuntimeClient
  private modelId: string
  private systemPrompt: string
  private useMockData: boolean

  /**
   * Create a new Bedrock client
   * @param modelId AWS Bedrock model ID to use
   * @param systemPrompt System prompt for the AI
   */
  constructor(modelId: string = CONFIG.BEDROCK_MODEL_ID, systemPrompt: string = CONFIG.SYSTEM_PROMPT) {
    console.log(`[Bedrock] Initializing client with model: ${modelId}`)

    this.useMockData = shouldUseMockData()
    this.modelId = modelId
    this.systemPrompt = systemPrompt

    // Prevent any client-side AWS SDK initialization
    if (typeof window !== "undefined") {
      console.log("[Bedrock] Client-side initialization - using mock mode")
      this.useMockData = true
      this.client = null as any
      return
    }

    if (this.useMockData) {
      console.log("[Bedrock] DEVELOPMENT MODE: Using mock responses")
      // Don't initialize the actual client in development mode
      this.client = null as any
      return
    }

    const credentials = getAWSCredentials()
    if (!credentials) {
      throw new Error("No AWS credentials available")
    }

    this.client = new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials,
    })
  }

  /**
   * Generate a response from the Bedrock model
   * @param message User message to process
   * @returns AI response text
   */
  async generateResponse(message: string): Promise<string> {
    console.log(`[Bedrock] Generating response for message: ${message.substring(0, 50)}...`)

    // If in development mode, return a mock response
    if (this.useMockData) {
      console.log("[Bedrock] Using mock response in development mode")
      return this.getMockResponse(message)
    }

    const isNova = this.modelId.startsWith("amazon.nova")

    // Format the request body based on model type
    const requestBody = isNova
      ? {
          inferenceConfig: { max_new_tokens: 1000 },
          messages: [
            {
              role: "user",
              content: [{ text: message }],
            },
          ],
        }
      : {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: message },
          ],
        }

    try {
      // Send request to Bedrock
      const response = await this.client.send(
        new InvokeModelCommand({
          modelId: this.modelId,
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

      console.log(`[Bedrock] Response generated: ${aiResponse.substring(0, 50)}...`)
      return aiResponse
    } catch (error) {
      console.error("[Bedrock] Error generating response:", error)

      // In case of error in development mode, still return a mock response
      if (this.useMockData) {
        return this.getMockResponse(message)
      }

      throw error
    }
  }

  /**
   * Generate a mock response for development mode
   */
  private getMockResponse(message: string): string {
    // Simple mock responses based on keywords in the message
    if (message.toLowerCase().includes("revenue")) {
      return "Based on your catalog performance, I've analyzed your revenue trends. Your top-performing track 'Summer Vibes' has generated 45% of your total revenue this quarter. I recommend focusing promotion efforts on similar tracks in your catalog."
    } else if (message.toLowerCase().includes("contract") || message.toLowerCase().includes("legal")) {
      return "I've reviewed the distribution agreement for your upcoming EP. There are a few clauses you should be aware of: 1) The exclusivity period is 2 years, which is standard but negotiable. 2) The royalty split gives you 65%, which is below industry average for independent artists. I recommend negotiating for at least 70%."
    } else if (message.toLowerCase().includes("marketing") || message.toLowerCase().includes("promotion")) {
      return "For your upcoming release, I recommend a three-phase marketing strategy: 1) Pre-release: Create 2 weeks of teaser content for Instagram and TikTok. 2) Release day: Schedule playlist pitching and an email blast to your subscriber list. 3) Post-release: Run targeted ads to similar artists' audiences on Spotify."
    } else {
      return "I'm your Patchline AI assistant. I can help you with music catalog management, contract analysis, marketing strategies, and more. What would you like to know about your music business today?"
    }
  }
}

/**
 * Singleton instance of BedrockClient to be used across the application
 */
export const bedrockClient = new BedrockClient()

/**
 * Create a properly configured Bedrock client using explicit credentials
 * to avoid CredentialsProviderError in Amplify SSR environments.
 */
export function createBedrockClient() {
  // Prevent AWS SDK initialization in development mode
  if (shouldUseMockData()) {
    throw new Error("Bedrock client disabled in development mode - use mock responses instead")
  }

  // Prevent any client-side AWS SDK initialization
  if (typeof window !== "undefined") {
    throw new Error("Bedrock client cannot be used in browser environment")
  }

  const REGION = CONFIG.AWS_REGION
  const credentials = getAWSCredentials()

  if (!credentials) {
    throw new Error("No AWS credentials available")
  }

  console.log(`[Bedrock] Client initialized with region: ${REGION}`)

  return new BedrockRuntimeClient({
    region: REGION,
    credentials,
  })
}

/**
 * Available Bedrock AI models
 */
export const BEDROCK_MODELS = [
  {
    id: "amazon.nova-micro-v1:0",
    name: "Amazon Nova Micro",
    description: "Fast, lightweight model (free tier eligible)",
  },
  {
    id: "amazon.nova-premier-v1:0",
    name: "Amazon Nova Premier",
    description: "Improved quality Nova model",
  },
  {
    id: "anthropic.claude-3-5-haiku-20241022-v1:0",
    name: "Claude 3.5 Haiku",
    description: "Fast Claude model with good quality",
  },
  {
    id: "anthropic.claude-3-7-sonnet-20250219-v1:0",
    name: "Claude 3.7 Sonnet",
    description: "Premium quality model, highest cost",
  },
]

/**
 * Generate content using Amazon Bedrock
 *
 * @param prompt Content generation prompt details
 * @param modelId Bedrock model ID to use
 * @param showPrompt Whether to include the prompt in the response
 * @param customPrompt Optional custom prompt text to use instead of generating one
 * @returns Generated content as a string
 */
export async function generateContentWithBedrock(
  prompt: any,
  modelId: string = CONFIG.BEDROCK_MODEL_ID,
  showPrompt = false,
  customPrompt?: string,
): Promise<{ content: string; promptUsed?: string }> {
  console.log(`[Bedrock] Generating content for topic: "${prompt.topic}" using model: ${modelId}`)

  // If in development mode, return mock content
  if (shouldUseMockData()) {
    console.log("[Bedrock] Using mock content in development mode")
    const mockContent = getMockContent(prompt.topic)
    return showPrompt
      ? { content: mockContent, promptUsed: customPrompt || `Generate content about ${prompt.topic}` }
      : { content: mockContent }
  }

  try {
    const client = createBedrockClient()

    // Create a descriptive prompt based on the input parameters or use the custom prompt
    let promptText =
      customPrompt ||
      `
You are a professional content writer. Please generate high-quality content on the following topic:

TOPIC: ${prompt.topic}

`

    // Only add these if we're not using a custom prompt
    if (!customPrompt) {
      if (prompt.keywords && prompt.keywords.length > 0) {
        promptText += `KEYWORDS: ${Array.isArray(prompt.keywords) ? prompt.keywords.join(", ") : prompt.keywords}\n\n`
      }

      if (prompt.tone) {
        promptText += `TONE: ${prompt.tone}\n\n`
      }

      if (prompt.length) {
        const wordCount = prompt.length === "short" ? 500 : prompt.length === "medium" ? 1000 : 2000
        promptText += `LENGTH: Approximately ${wordCount} words\n\n`
      }

      if (prompt.targetAudience) {
        promptText += `TARGET AUDIENCE: ${prompt.targetAudience}\n\n`
      }

      if (prompt.callToAction) {
        promptText += `CALL TO ACTION: Include this call to action: ${prompt.callToAction}\n\n`
      }

      promptText += `
Please format the content using Markdown:
- Use # for the main title
- Use ## for section headings
- Use bullet points or numbered lists where appropriate
- Include bold or italic text for emphasis
    
Return only the content, without any additional explanation or commentary.`
    }

    console.log(`[Bedrock] Sending prompt to Bedrock (${promptText.length} chars)`)

    // Request structure depends on the model being used
    let requestBody

    // For Amazon Nova models
    if (modelId.startsWith("amazon.nova")) {
      requestBody = {
        inferenceConfig: {
          max_new_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9,
        },
        messages: [{ role: "user", content: [{ text: promptText }] }],
      }
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
            content: [{ type: "text", text: promptText }],
          },
        ],
      }
    }
    // For older Claude models
    else if (modelId.startsWith("anthropic.claude")) {
      requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        messages: [{ role: "user", content: promptText }],
      }
    }
    // For Amazon Titan models
    else if (modelId.startsWith("amazon.titan")) {
      requestBody = {
        inputText: promptText,
        textGenerationConfig: {
          maxTokenCount: 4000,
          temperature: 0.7,
          topP: 0.9,
        },
      }
    }
    // For Cohere models
    else if (modelId.startsWith("cohere.command")) {
      requestBody = {
        prompt: promptText,
        max_tokens: 4000,
        temperature: 0.75,
      }
    }
    // Default to Nova format as fallback
    else {
      requestBody = {
        inferenceConfig: {
          max_new_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9,
        },
        messages: [{ role: "user", content: [{ text: promptText }] }],
      }
    }

    // Send the request to Bedrock
    const response = await client.send(
      new InvokeModelCommand({
        modelId: modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody),
      }),
    )

    // Parse the response based on the model
    const responseJson = JSON.parse(new TextDecoder().decode(response.body))

    let content = ""

    // Extract content based on model type
    if (modelId.includes("claude-3-5") || modelId.includes("claude-3-7")) {
      content = responseJson.content[0].text
    } else if (modelId.startsWith("anthropic.claude")) {
      content = responseJson.content[0].text
    } else if (modelId.startsWith("amazon.titan")) {
      content = responseJson.results[0].outputText
    } else if (modelId.startsWith("amazon.nova")) {
      content = responseJson.output.message.content[0].text
    } else if (modelId.startsWith("cohere.command")) {
      content = responseJson.generations[0].text
    } else {
      // Default fallback
      content = JSON.stringify(responseJson)
    }

    console.log(`[Bedrock] Content generated successfully (${content.length} chars)`)

    // Return the content and optionally the prompt used
    if (showPrompt) {
      return { content, promptUsed: promptText }
    }
    return { content }
  } catch (error) {
    console.error("[Bedrock] Error generating content:", error)

    // In development mode, return mock content even if there's an error
    if (shouldUseMockData()) {
      const mockContent = getMockContent(prompt.topic)
      return showPrompt
        ? { content: mockContent, promptUsed: customPrompt || `Generate content about ${prompt.topic}` }
        : { content: mockContent }
    }

    throw error
  }
}

/**
 * Generate mock content for development mode
 */
function getMockContent(topic: string): string {
  // Simple mock content based on the topic
  const topicLower = topic.toLowerCase()

  if (topicLower.includes("marketing") || topicLower.includes("promotion")) {
    return `# Effective Music Marketing Strategies for Independent Artists

## Building Your Brand Identity

Every successful artist has a clear brand identity. This isn't just about a logo or color scheme—it's about the story you tell and the emotions you evoke. Your brand should be authentic to who you are as an artist while resonating with your target audience.

* **Define your unique value proposition**: What makes your music different?
* **Create consistent visual elements**: Album art, social media, and merchandise should feel cohesive
* **Develop your artist narrative**: The story behind your music connects fans to your journey

## Leveraging Social Media Effectively

Social media remains the most powerful tool for independent artists to build a following without major label support.

1. **Choose platforms strategically**: Focus on 2-3 platforms where your audience is most active
2. **Content calendar**: Plan your posts to maintain consistent engagement
3. **Video content priority**: Platforms like TikTok and Instagram Reels offer the highest organic reach potential
4. **Engage authentically**: Respond to comments and create two-way conversations with fans

## Email Marketing: Your Most Valuable Asset

While social media algorithms change constantly, your email list is an asset you own and control.

* Build your list at every opportunity (live shows, website, social media)
* Segment your audience based on engagement and location
* Provide exclusive content to subscribers
* Use email for direct sales of merchandise and tickets

## Call to Action

Ready to take your music marketing to the next level? Start by auditing your current brand presence and identifying gaps in your strategy. Then create a 30-day content calendar focusing on your strongest platform to build momentum.`
  } else if (topicLower.includes("royalties") || topicLower.includes("revenue")) {
    return `# Maximizing Music Royalties in the Streaming Era

## Understanding the Royalty Landscape

In today's music industry, artists earn revenue from multiple royalty streams that are often complex and fragmented. Understanding these streams is the first step to maximizing your income.

* **Performance royalties**: Earned when your music is played publicly
* **Mechanical royalties**: Generated from physical sales and digital downloads/streams
* **Sync licensing**: Paid when your music is used in film, TV, commercials, or games
* **Neighboring rights**: Royalties for the recording itself (separate from composition)

## Digital Streaming Optimization

Streaming platforms have become the primary source of music consumption, making optimization crucial.

1. **Playlist strategy**: Both editorial and algorithmic playlists drive significant streams
2. **Release cadence**: Regular releases keep you in recommendation algorithms
3. **Metadata accuracy**: Ensure all credits and ownership information is correct
4. **Cross-platform presence**: Be available on all major platforms to maximize reach

## Royalty Collection: Don't Leave Money on the Table

Many artists fail to collect all the royalties they're owed simply due to registration issues.

* **Register with PROs**: Join ASCAP, BMI, or SESAC to collect performance royalties
* **Mechanical rights**: Ensure you're registered with the MLC in the US
* **International collection**: Work with societies worldwide or use a publisher
* **Audit regularly**: Review statements to catch potential missed payments

## Call to Action

Take control of your music royalties today by conducting a complete audit of your catalog. Make sure you're registered with all relevant collection societies and that your metadata is accurate across all platforms.`
  } else {
    return `# The Future of AI in the Music Industry

## Transforming Creation and Production

Artificial intelligence is revolutionizing how music is created, produced, and distributed. From composition assistance to mastering, AI tools are becoming essential parts of the modern musician's toolkit.

* **AI composition tools**: Generate melodies, chord progressions, and even full tracks
* **Intelligent mixing and mastering**: Automated systems that learn from thousands of professional recordings
* **Voice synthesis and manipulation**: Create vocal harmonies or entirely new vocal performances
* **Sample generation**: Create unique sounds without copyright concerns

## Personalized Listening Experiences

The way fans discover and consume music is being transformed by AI algorithms.

1. **Recommendation engines**: Increasingly sophisticated systems that understand musical elements
2. **Dynamic playlists**: Adapt to listener moods, activities, and preferences in real-time
3. **Spatial audio optimization**: AI-enhanced immersive listening experiences
4. **Voice-controlled discovery**: Conversational interfaces for finding new music

## Business Intelligence for Artists

Data analysis powered by AI is giving artists unprecedented insights into their audience and performance.

* **Predictive analytics**: Forecast streaming performance and revenue
* **Tour planning optimization**: Identify promising markets based on listener data
* **Marketing automation**: Target the right fans with the right message at the right time
* **Royalty tracking**: Ensure all revenue streams are properly accounted for

## Ethical Considerations

As AI becomes more prevalent, important questions arise about creativity, ownership, and fair compensation.

* Who owns AI-generated music?
* How should human collaborators be credited and compensated?
* What happens to session musicians and producers?
* How can we ensure diversity in algorithmic recommendations?

## Call to Action

The AI revolution in music is already here. Start exploring how these tools can enhance your creative process and business operations today. Begin with one area—whether that's production, marketing, or analytics—and experiment with how AI can complement your human expertise.`
  }
}
