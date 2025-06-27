import { type NextRequest, NextResponse } from "next/server"
import { getBlogPostById, getBlogPostBySlug, listBlogPosts } from "@/lib/blog-db"

/**
 * API route for blog posts
 * GET /api/blog - List all blog posts
 * GET /api/blog?slug=post-slug - Get a blog post by slug
 * GET /api/blog?id=post-id - Get a blog post by ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get("slug")
    const id = searchParams.get("id")

    // If slug is provided, get blog post by slug
    if (slug) {
      const post = await getBlogPostBySlug(slug)

      if (!post) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
      }

      return NextResponse.json(post)
    }

    // If id is provided, get blog post by ID
    if (id) {
      const post = await getBlogPostById(id)

      if (!post) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
      }

      return NextResponse.json(post)
    }

    // Otherwise, list all blog posts
    const posts = await listBlogPosts(20)
    return NextResponse.json(posts)
  } catch (error) {
    console.error("[API] Error in blog route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
