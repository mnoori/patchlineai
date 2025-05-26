import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function BlogPostLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <article className="container max-w-4xl py-16">
          {/* Back button skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Category skeleton */}
          <div className="mb-4">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Title skeleton */}
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />

          {/* Subtitle skeleton */}
          <Skeleton className="h-6 w-full mb-6" />

          {/* Author info skeleton */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Featured image skeleton */}
          <Skeleton className="aspect-video w-full rounded-xl mb-10" />

          {/* Content skeleton */}
          <div className="space-y-4 mb-10">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/6" />
          </div>

          {/* Tags skeleton */}
          <div className="mt-10 pt-6 border-t">
            <Skeleton className="h-6 w-20 mb-3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-14 rounded-full" />
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
