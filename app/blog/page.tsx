import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 font-heading">Blog</h1>
              <p className="text-xl text-muted-foreground">
                Insights, updates, and perspectives on AI in the music industry
              </p>
            </div>

            {/* Featured Post */}
            <div className="mb-16">
              <div className="glass-effect rounded-xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative h-64 md:h-full">
                    <Image
                      src={getImage(featuredPost) || "/placeholder.svg"}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-cosmic-teal/20 text-cosmic-teal">
                        {featuredPost.category}
                      </span>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {getDate(featuredPost)}
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">{featuredPost.title}</h2>
                    <p className="text-muted-foreground mb-6 flex-grow">{getExcerpt(featuredPost)}</p>
                    <Button asChild className="w-fit bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                      <Link href={`/blog/${getSlug(featuredPost)}`}>
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingPosts.map((post, index) => (
                <div
                  key={"id" in post ? post.id : `placeholder-${index}`}
                  className="glass-effect rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="relative h-48">
                    <Image src={getImage(post) || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-cosmic-teal/20 text-cosmic-teal">
                        {post.category}
                      </span>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {getDate(post)}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 font-heading">{post.title}</h3>
                    <p className="text-muted-foreground mb-4 flex-grow">{getExcerpt(post)}</p>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-fit text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/10"
                    >
                      <Link href={`/blog/${getSlug(post)}`}>
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <div className="mt-24 max-w-2xl mx-auto text-center glass-effect rounded-xl p-8 md:p-12">
              <h3 className="text-2xl font-bold mb-3 font-heading">Stay Updated</h3>
              <p className="text-muted-foreground mb-6">
                Subscribe to our newsletter for the latest updates on AI in music.
              </p>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 rounded-md bg-card border border-input px-4 py-2"
                />
                <Button type="submit" className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
