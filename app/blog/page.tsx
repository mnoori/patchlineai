import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"
import { Button, GradientOrbs, PageGradient, Card } from "@/components/brand"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { listBlogPosts } from "@/lib/blog-db"
import type { BlogPost } from "@/lib/blog-types"
import { unstable_noStore } from "next/cache"

// Types for placeholder content
interface PlaceholderPost {
  title: string
  excerpt: string
  image: string
  date: string
  category: string
  slug: string
}

// Type for either real post or placeholder
type AnyPost = BlogPost | PlaceholderPost

export const metadata: Metadata = {
  title: "Blog | Patchline Music",
}

export default async function BlogPage() {
  // Disable cache to always get fresh data
  unstable_noStore()

  // Fetch blog posts from the API
  const blogPosts = await listBlogPosts(20) // Fetch up to 20 posts

  // If no posts, use a placeholder for featured post
  const featuredPostPlaceholder: PlaceholderPost = {
    title: "The State of AI in Music: Beyond the Hype",
    excerpt:
      "How artificial intelligence is transforming the music industry landscape and what it means for artists, labels, and fans.",
    image: "/music-industry-ai-blog.png",
    date: "May 10, 2025",
    category: "AI Technology",
    slug: "state-of-ai-in-music",
  }

  // Placeholder posts for when we don't have enough real posts
  const placeholderPosts: PlaceholderPost[] = [
    {
      title: "How Independent Labels Can Compete Using AI",
      excerpt: "Leveling the playing field with major labels through strategic AI implementation.",
      image: "/independent-labels-ai.png",
      date: "May 5, 2025",
      category: "Music Industry",
      slug: "independent-labels-ai",
    },
    {
      title: "Metadata: The Hidden Value in Your Music Catalog",
      excerpt: "Why proper metadata management is crucial for maximizing your music's potential.",
      image: "/music-metadata-management.png",
      date: "April 28, 2025",
      category: "Metadata Agent",
      slug: "metadata-hidden-value",
    },
    {
      title: "Agent-Based Workflows: The Future of Creative Production",
      excerpt: "How AI agents are transforming creative workflows in the music industry.",
      image: "/ai-agent-workflows.png",
      date: "April 20, 2025",
      category: "Agent Updates",
      slug: "agent-based-workflows",
    },
  ]

  console.log(
    "Blog posts from DB:",
    blogPosts.map((p) => p.slug),
  )

  // Ensure we always have the newest post as the featured post
  const sortedPosts = [...blogPosts].sort((a, b) => {
    const dateA = new Date(a.publishedDate || 0)
    const dateB = new Date(b.publishedDate || 0)
    return dateB.getTime() - dateA.getTime()
  })

  // Handle posts with or without timestamp suffixes in slugs
  const processedPosts: BlogPost[] = []
  const seenSlugs = new Set<string>()

  for (const post of sortedPosts) {
    // Extract the base slug without timestamp
    const baseSlug = post.slug.replace(/-\d{6}$/, "")

    // Only add if we haven't seen this base slug before and post has an image
    if (!seenSlugs.has(baseSlug) && post.heroImage) {
      seenSlugs.add(baseSlug)
      processedPosts.push(post)
    }
  }

  // Use real posts or placeholders
  const featuredPost: AnyPost = processedPosts.length > 0 ? processedPosts[0] : featuredPostPlaceholder

  // Remaining posts after the featured one
  const remainingPosts: AnyPost[] = processedPosts.length > 1 ? processedPosts.slice(1) : placeholderPosts

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Helper to get post excerpt
  const getExcerpt = (post: AnyPost) => {
    if ("excerpt" in post) {
      return post.excerpt
    }
    return post.subtitle || post.content.substring(0, 150) + "..."
  }

  // Helper to get post image
  const getImage = (post: AnyPost) => {
    if ("image" in post) {
      return post.image
    }
    return post.heroImage || "/placeholder.svg"
  }

  // Helper to get post date
  const getDate = (post: AnyPost) => {
    if ("date" in post) {
      return post.date
    }
    return formatDate(post.publishedDate)
  }

  // Helper to get post slug (all posts have a slug property)
  const getSlug = (post: AnyPost) => post.slug

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section with DISPERSED orbs */}
        <section className="relative py-16 pb-8 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="dispersed" />
          <div className="container relative z-10">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white mb-2">
                Blog
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Insights, updates, and perspectives on AI in the music industry
              </p>
            </div>
          </div>
        </section>

        {/* Featured Post - LEFT EDGE */}
        <section className="relative pt-4 pb-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-left" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-7xl mx-auto">
              <Card variant="gradient" className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-full min-h-[400px]">
                    <Image
                      src={getImage(featuredPost) || "/placeholder.svg"}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                        {featuredPost.category}
                      </span>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {getDate(featuredPost)}
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-brand-cyan">{featuredPost.title}</h2>
                    <p className="text-muted-foreground mb-8 flex-grow leading-relaxed">{getExcerpt(featuredPost)}</p>
                    <Button asChild variant="gradient" className="w-fit">
                      <Link href={`/blog/${getSlug(featuredPost)}`} className="inline-flex items-center whitespace-nowrap">
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Recent Posts - RIGHT EDGE */}
        <section className="relative py-16 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <GradientOrbs variant="edge-right" className="opacity-25" />
          <div className="container relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {remainingPosts.map((post, index) => (
                  <Card
                    key={"id" in post ? post.id : `placeholder-${index}`}
                    variant="outlined"
                    hover="glow"
                    className="overflow-hidden flex flex-col backdrop-blur-sm bg-black/20"
                  >
                    <div className="relative h-48">
                      <Image src={getImage(post) || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                          {post.category}
                        </span>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {getDate(post)}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-brand-cyan">{post.title}</h3>
                      <p className="text-muted-foreground mb-4 flex-grow">{getExcerpt(post)}</p>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-fit text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10 p-0"
                      >
                        <Link href={`/blog/${getSlug(post)}`} className="inline-flex items-center whitespace-nowrap">
                          Read More <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter - SUBTLE BOTTOM */}
        <section className="relative py-20 bg-gradient-to-b from-background via-background to-background overflow-hidden">
          <PageGradient variant="vibrant" className="opacity-30" />
          <GradientOrbs variant="subtle-bottom" />
          <div className="container relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <Card variant="glass" className="p-8 md:p-12 backdrop-blur-xl">
                <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
                <p className="text-muted-foreground mb-6">
                  Subscribe to our newsletter for the latest updates on AI in music.
                </p>
                <form className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="flex-1 rounded-md bg-background/50 border border-white/10 px-4 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50"
                  />
                  <Button type="submit" variant="gradient">
                    Subscribe
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
