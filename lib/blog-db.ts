import { ScanCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { BLOG_POSTS_TABLE } from "./aws-config"
import type { BlogPost } from "./blog-types"
import { shouldUseMockData } from "./config"

// Mock blog posts for development mode
const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "state-of-ai-in-music",
    title: "The State of AI in Music: Beyond the Hype",
    subtitle: "How artificial intelligence is transforming the music industry landscape",
    content: `# The State of AI in Music: Beyond the Hype

Artificial intelligence is no longer just a buzzword in the music industry—it's a transformative force reshaping how music is created, produced, distributed, and consumed. From AI-powered mastering tools to recommendation algorithms, the technology is touching every aspect of the music ecosystem.

## Creation and Production

AI tools are now capable of generating original compositions, creating backing tracks, and even mimicking the styles of specific artists. While these tools won't replace human creativity, they're becoming valuable collaborators in the creative process.

* **Composition assistance**: AI can suggest chord progressions, melodies, and arrangements
* **Sound design**: Generate unique sounds and textures that would be difficult to create manually
* **Mixing and mastering**: Automated systems can analyze and enhance recordings with professional-quality results

## Distribution and Discovery

Perhaps the most visible impact of AI in music is in how listeners discover new artists and songs.

1. Recommendation algorithms analyze listening patterns to suggest new music
2. Playlist curation is increasingly automated, with AI determining which tracks complement each other
3. Marketing tools can predict which audiences will respond to particular artists or songs

## The Human Element

Despite these technological advances, music remains a fundamentally human art form. The most successful applications of AI in music enhance rather than replace human creativity and connection.

Artists who embrace these tools while maintaining their unique voice and vision will be best positioned to thrive in this new landscape.`,
    heroImage: "/music-industry-ai-blog.png",
    publishedDate: "2025-05-10T12:00:00Z",
    author: "Alex Rivera",
    category: "AI Technology",
    tags: ["AI", "Music Industry", "Technology Trends"],
    isPublished: true,
  },
  {
    id: "2",
    slug: "independent-labels-ai",
    title: "How Independent Labels Can Compete Using AI",
    subtitle: "Leveling the playing field with major labels through strategic AI implementation",
    content: `# How Independent Labels Can Compete Using AI

Independent labels have traditionally faced significant challenges competing with major labels that have vastly greater resources. Artificial intelligence is changing this dynamic, providing powerful tools that can help level the playing field.

## Data-Driven A&R

One of the most expensive and time-consuming aspects of running a label is finding and developing talent. AI can dramatically improve this process.

* **Trend prediction**: Identify emerging genres and sounds before they hit the mainstream
* **Audience analysis**: Understand which artists are gaining traction with specific demographics
* **Performance forecasting**: Estimate an artist's potential commercial success based on early signals

## Marketing Optimization

Independent labels often struggle with limited marketing budgets. AI tools can help maximize the impact of every dollar spent.

1. **Targeted advertising**: Reach the most receptive audiences with precision
2. **Content optimization**: Determine which visual and textual elements resonate most strongly
3. **Release timing**: Identify the optimal moment to release new music for maximum impact

## Catalog Management

For established independent labels, their catalog is their most valuable asset. AI can help extract maximum value from existing recordings.

* **Metadata enhancement**: Improve discoverability through better tagging and categorization
* **Remix and reissue opportunities**: Identify catalog tracks with renewed potential
* **Licensing suggestions**: Match catalog tracks with potential sync opportunities

## Getting Started

Independent labels don't need massive budgets to begin implementing AI. Start with one area where you face the greatest challenges, whether that's discovering talent, marketing effectively, or managing your catalog. Even small implementations can yield significant competitive advantages.`,
    heroImage: "/independent-labels-ai.png",
    publishedDate: "2025-05-05T12:00:00Z",
    author: "Maya Johnson",
    category: "Music Industry",
    tags: ["Independent Labels", "AI Strategy", "Music Business"],
    isPublished: true,
  },
  {
    id: "3",
    slug: "metadata-hidden-value",
    title: "Metadata: The Hidden Value in Your Music Catalog",
    subtitle: "Why proper metadata management is crucial for maximizing your music's potential",
    content: `# Metadata: The Hidden Value in Your Music Catalog

In the digital music ecosystem, your songs are only as discoverable as their metadata allows them to be. Proper metadata management isn't just a technical requirement—it's a critical business strategy that can significantly impact your revenue and reach.

## What Is Music Metadata?

At its core, music metadata is all the information that describes your recordings and compositions:

* **Basic identifiers**: Titles, artist names, release dates, ISRCs, ISWCs
* **Creative information**: Genres, moods, tempos, instruments, lyrics
* **Business data**: Ownership splits, publishing information, territorial rights
* **Technical details**: Audio quality, duration, production credits

## The Business Impact of Good Metadata

Well-maintained metadata directly affects your bottom line in several ways:

1. **Improved discoverability**: Helps listeners find your music through search and recommendations
2. **Accurate royalty collection**: Ensures you receive all payments you're entitled to
3. **Licensing opportunities**: Makes your catalog more accessible for sync placements
4. **Analytics insights**: Provides the foundation for meaningful performance analysis

## Common Metadata Problems

Many artists and labels struggle with these common metadata issues:

* **Inconsistent artist names**: Variations in spelling or formatting across platforms
* **Missing songwriter information**: Leading to unclaimed publishing royalties
* **Incomplete ownership data**: Causing payment delays or disputes
* **Poor genre classification**: Limiting placement in relevant playlists and recommendations

## Building a Metadata Strategy

Developing a systematic approach to metadata management is essential:

* Audit your existing catalog for metadata gaps and inconsistencies
* Establish standards for all new releases
* Consider investing in specialized metadata management tools
* Regularly update your metadata as industry standards evolve

Remember: in today's data-driven music industry, high-quality metadata isn't optional—it's essential for maximizing your music's value and reach.`,
    heroImage: "/music-metadata-management.png",
    publishedDate: "2025-04-28T12:00:00Z",
    author: "David Chen",
    category: "Metadata Agent",
    tags: ["Metadata", "Catalog Management", "Royalties"],
    isPublished: true,
  },
  {
    id: "4",
    slug: "agent-based-workflows",
    title: "Agent-Based Workflows: The Future of Creative Production",
    subtitle: "How AI agents are transforming creative workflows in the music industry",
    content: `# Agent-Based Workflows: The Future of Creative Production

The music industry is witnessing a paradigm shift in how creative work gets done. Agent-based workflows—systems where AI agents handle specific tasks within a larger process—are streamlining production and enabling new creative possibilities.

## What Are Agent-Based Workflows?

Agent-based workflows divide complex processes into discrete tasks, each handled by a specialized AI agent:

* **Specialized expertise**: Each agent focuses on a specific domain (mixing, mastering, metadata)
* **Interconnected system**: Agents communicate and hand off work to each other
* **Human oversight**: Creative professionals direct and refine the agents' output
* **Continuous improvement**: Agents learn from feedback and past projects

## Transforming Music Production

These workflows are already changing how music is produced:

1. **Faster iteration**: Rapidly test different creative directions
2. **Reduced busywork**: Automate technical tasks to focus on creative decisions
3. **Consistent quality**: Maintain standards across large projects
4. **Knowledge capture**: Preserve techniques and approaches for future use

## Real-World Applications

Agent-based workflows are being applied across the music production chain:

* **Composition**: Agents that generate chord progressions, melodies, and arrangements
* **Sound design**: Specialized agents for creating and processing sounds
* **Mixing**: Agents that handle technical aspects of balancing and processing tracks
* **Mastering**: Automated systems that prepare final mixes for distribution
* **Metadata**: Agents that generate and manage comprehensive track information

## Getting Started With Agent Workflows

You don't need to implement a complete agent ecosystem all at once:

* Start with a single agent for a repetitive task in your workflow
* Gradually add agents as you identify additional opportunities for automation
* Focus on the human-agent collaboration interface
* Continuously refine your workflow based on results

The future of music production isn't about replacing human creativity—it's about amplifying it through intelligent collaboration with AI agents.`,
    heroImage: "/ai-agent-workflows.png",
    publishedDate: "2025-04-20T12:00:00Z",
    author: "Sophia Williams",
    category: "Agent Updates",
    tags: ["AI Agents", "Workflow Automation", "Music Production"],
    isPublished: true,
  },
]

/**
 * List blog posts with optional limit
 * @param limit Maximum number of posts to return
 * @returns Array of blog posts
 */
export async function listBlogPosts(limit = 10): Promise<BlogPost[]> {
  // In development mode, return mock blog posts
  if (shouldUseMockData()) {
    console.log("[Blog DB] Using mock blog posts in development mode")
    return MOCK_BLOG_POSTS.slice(0, limit)
  }

  try {
    // This code will only run on the server side
    if (typeof window === "undefined") {
      // Import dynamically to avoid loading in the browser
      const { documentClient } = await import("./dynamodb-client")

      const command = new ScanCommand({
        TableName: BLOG_POSTS_TABLE,
        Limit: limit,
        FilterExpression: "isPublished = :published",
        ExpressionAttributeValues: {
          ":published": true,
        },
      })

      const response = await documentClient.send(command)
      return (response.Items || []) as BlogPost[]
    } else {
      // If running in browser, fetch from API instead of using AWS SDK directly
      const response = await fetch("/api/blog")
      if (!response.ok) {
        throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
      }
      return await response.json()
    }
  } catch (error) {
    console.error("[Blog DB] Error listing blog posts:", error)

    // In case of error, return mock data in development mode
    if (shouldUseMockData()) {
      return MOCK_BLOG_POSTS.slice(0, limit)
    }

    return []
  }
}

/**
 * Get a single blog post by slug
 * @param slug The blog post slug
 * @returns The blog post or null if not found
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  // In development mode, return mock blog post
  if (shouldUseMockData()) {
    console.log(`[Blog DB] Using mock blog post for slug: ${slug}`)
    const post = MOCK_BLOG_POSTS.find((post) => post.slug === slug)
    return post || null
  }

  try {
    // This code will only run on the server side
    if (typeof window === "undefined") {
      // Import dynamically to avoid loading in the browser
      const { documentClient } = await import("./dynamodb-client")

      const command = new QueryCommand({
        TableName: BLOG_POSTS_TABLE,
        IndexName: "slug-index", // Assuming you have a GSI on the slug field
        KeyConditionExpression: "slug = :slug",
        ExpressionAttributeValues: {
          ":slug": slug,
        },
        Limit: 1,
      })

      const response = await documentClient.send(command)

      if (response.Items && response.Items.length > 0) {
        return response.Items[0] as BlogPost
      }

      return null
    } else {
      // If running in browser, fetch from API instead of using AWS SDK directly
      const response = await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch blog post: ${response.statusText}`)
      }
      const posts = await response.json()
      return posts.length > 0 ? posts[0] : null
    }
  } catch (error) {
    console.error(`[Blog DB] Error getting blog post by slug ${slug}:`, error)

    // In case of error, return mock data in development mode
    if (shouldUseMockData()) {
      const post = MOCK_BLOG_POSTS.find((post) => post.slug === slug)
      return post || null
    }

    return null
  }
}

/**
 * Get a single blog post by ID
 * @param id The blog post ID
 * @returns The blog post or null if not found
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  // In development mode, return mock blog post
  if (shouldUseMockData()) {
    console.log(`[Blog DB] Using mock blog post for id: ${id}`)
    const post = MOCK_BLOG_POSTS.find((post) => post.id === id)
    return post || null
  }

  try {
    // This code will only run on the server side
    if (typeof window === "undefined") {
      // Import dynamically to avoid loading in the browser
      const { documentClient } = await import("./dynamodb-client")

      const command = new GetCommand({
        TableName: BLOG_POSTS_TABLE,
        Key: {
          id: id,
        },
      })

      const response = await documentClient.send(command)

      if (response.Item) {
        return response.Item as BlogPost
      }

      return null
    } else {
      // If running in browser, fetch from API instead of using AWS SDK directly
      const response = await fetch(`/api/blog?id=${encodeURIComponent(id)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch blog post: ${response.statusText}`)
      }
      return await response.json()
    }
  } catch (error) {
    console.error(`[Blog DB] Error getting blog post by id ${id}:`, error)

    // In case of error, return mock data in development mode
    if (shouldUseMockData()) {
      const post = MOCK_BLOG_POSTS.find((post) => post.id === id)
      return post || null
    }

    return null
  }
}
