import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import { getBlogPostBySlug } from "@/lib/blog-db";
import ReactMarkdown from "react-markdown";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Blog Post Not Found",
    };
  }

  return {
    title: `${post.title} | Your Music Label`,
    description: post.seoDescription || post.subtitle || "",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // Format date for display
  const publishDate = post.publishedDate
    ? new Date(post.publishedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <article className="container max-w-4xl py-16">
          {/* Back button */}
          <div className="mb-8">
            <Button asChild variant="ghost" className="pl-0">
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>

          {/* Hero section */}
          <div className="mb-10">
            {post.category && (
              <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-cosmic-teal/20 text-cosmic-teal mb-4">
                {post.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-heading">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="text-xl text-muted-foreground mb-6">{post.subtitle}</p>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted mr-3">
                  {post.author.avatar ? (
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {post.author.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="font-medium">{post.author.name}</span>
              </div>
              {publishDate && (
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {publishDate}
                </div>
              )}
              {post.readingTime && (
                <span className="text-muted-foreground">
                  {post.readingTime} min read
                </span>
              )}
            </div>
          </div>

          {/* Featured image */}
          {post.heroImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-10">
              <Image
                src={post.heroImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/blog?tag=${tag}`}
                    className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
} 