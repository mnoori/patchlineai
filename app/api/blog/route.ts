import { NextResponse } from "next/server";
import { BlogPost } from "@/lib/blog-types";
import { 
  createBlogPost, 
  getBlogPost, 
  getBlogPostBySlug, 
  listBlogPosts 
} from "@/lib/blog-db";

// GET /api/blog - List blog posts
// GET /api/blog?id=123 - Get blog post by ID
// GET /api/blog?slug=my-post - Get blog post by slug
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");

  try {
    if (id) {
      const post = await getBlogPost(id);
      if (!post) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
      return NextResponse.json(post);
    } else if (slug) {
      const post = await getBlogPostBySlug(slug);
      if (!post) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }
      return NextResponse.json(post);
    } else {
      const posts = await listBlogPosts();
      return NextResponse.json({ posts });
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST /api/blog - Create a new blog post
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.title || !data.content || !data.author) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, author" },
        { status: 400 }
      );
    }

    // Create slug from title if not provided
    if (!data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    const post = await createBlogPost(data);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
} 