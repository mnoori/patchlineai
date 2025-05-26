import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getBlogPostBySlug } from "@/lib/blog-db"
import { unstable_noStore } from "next/cache"
import { notFound } from "next/navigation"

// Define the metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Fetch the blog post
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Blog Post Not Found | Patchline Music",
    }
  }

  return {
    title: `${post.title} | Patchline Music Blog`,
    description: post.subtitle || post.content.substring(0, 160),
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // Disable cache to always get fresh data
  unstable_noStore()

  // Fetch the blog post
  const post = await getBlogPostBySlug(params.slug)

  // If post not found, show 404
  if (!post) {
    notFound()
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Convert markdown content to HTML
  const renderMarkdown = (content: string) => {
    // This is a very simple markdown renderer
    // In a real app, you would use a proper markdown library

    // Replace headers
    let html = content
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>')

    // Replace bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Replace unordered lists
    html = html.replace(/^\* (.*$)/gm, '<li class="ml-6 list-disc mb-1">$1</li>')
    html = html.replace(/(<li.*<\/li>\n)+/g, '<ul class="my-4">$&</ul>')

    // Replace ordered lists
    html = html.replace(/^\d+\. (.*$)/gm, '<li class="ml-6 list-decimal mb-1">$1</li>')
    html = html.replace(/(<li.*<\/li>\n)+/g, '<ol class="my-4">$&</ol>')

    // Replace paragraphs
    html = html.replace(/^(?!<[hou]|$)(.*$)/gm, '<p class="mb-4 leading-relaxed">$1</p>')

    return html
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <article className="py-16">
          <div className="container max-w-4xl">
            {/* Back button */}
            <div className="mb-8">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
                </Link>
              </Button>
            </div>

            {/* Hero image */}
            {post.heroImage && (
              <div className="relative h-[400px] w-full mb-8 rounded-xl overflow-hidden">
                <Image
                  src={post.heroImage || "/placeholder.svg"}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Post header */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-cosmic-teal/20 text-cosmic-teal">
                  {post.category}
                </span>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatDate(post.publishedDate)}
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">{post.title}</h1>

              {post.subtitle && <p className="text-xl text-muted-foreground mb-6">{post.subtitle}</p>}

              {post.author && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-1" />
                  By {post.author}
                </div>
              )}
            </div>

            {/* Post content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related posts would go here */}

            {/* Call to action */}
            <div className="mt-16 glass-effect rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-3 font-heading">Ready to transform your music business?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Discover how Patchline's AI agents can help you streamline workflows, gain valuable insights, and focus
                on what matters most: your music.
              </p>
              <Button asChild className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-black">
                <Link href="/dashboard">Try Patchline Today</Link>
              </Button>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
