"use client"
import { motion } from "framer-motion"
import { Instagram } from "lucide-react"
import Image from "next/image"

// Instagram post data
const INSTAGRAM_POSTS = [
  {
    id: 1,
    imageUrl: "/instagram-post-1.png",
    postUrl: "https://www.instagram.com/p/DDPm0S5pfT3/",
    likes: 342,
    comments: 18,
  },
  {
    id: 2,
    imageUrl: "/instagram-post-2.png",
    postUrl: "https://www.instagram.com/p/DDXgVM5Ja7p/",
    likes: 287,
    comments: 24,
  },
  {
    id: 3,
    imageUrl: "/instagram-post-3.png",
    postUrl: "https://www.instagram.com/p/DD8JmxrgLTp/",
    likes: 412,
    comments: 31,
  },
]

const InstagramFeed = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 noise-bg opacity-30"></div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Instagram className="h-6 w-6 text-neon-magenta" />
            <h2 className="text-3xl font-bold glitch-text" data-text="@algoryxmusic">
              @algoryxmusic
            </h2>
          </div>
          <p className="text-light/80 max-w-2xl mx-auto">
            Follow our journey through the digital wilderness. Behind-the-scenes glimpses of our creative process,
            experiments, and performances.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {INSTAGRAM_POSTS.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="aspect-square relative group"
            >
              <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <div className="absolute inset-0 rounded-lg overflow-hidden border border-light/10 group-hover:border-neon-magenta/50 transition-all duration-300">
                  <Image
                    src={post.imageUrl || "/placeholder.svg"}
                    alt={`Instagram post ${post.id}`}
                    fill
                    className="object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-eclipse/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-neon-magenta mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-neon-cyan mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://instagram.com/algoryxmusic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-neon-magenta hover:text-neon-magenta/80 transition-colors"
          >
            View Full Feed
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

export default InstagramFeed
