"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Slide = {
  id: number
  title?: string
  content: React.ReactNode
}

// Define the pitch deck slides with detailed content
const slides: Slide[] = [
  {
    id: 1,
    content: (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          Patchline
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl text-center">
          The Invisible Agentic AI Layer for the Music Industry
        </p>
        <p className="text-lg text-gray-400">Mehdi Noori, PhD</p>
      </div>
    ),
  },
  {
    id: 2,
    title: "The Problem",
    content: (
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎵</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Fragmented Workflows</h3>
            <p className="text-gray-300">
              Music industry operations are scattered across multiple platforms and tools, leading to inefficiency and
              missed opportunities.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">⏱️</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Time-Consuming Tasks</h3>
            <p className="text-gray-300">
              Manual processes like artist scouting, contract review, and metadata management consume valuable time and
              resources.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Data Silos</h3>
            <p className="text-gray-300">
              Critical information is trapped in different systems, making it difficult to make informed decisions
              quickly.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Our Solution",
    content: (
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Intelligent Agents</h3>
            <p className="text-gray-300">
              AI-powered agents that automate and orchestrate essential music industry workflows.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🔄</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Seamless Integration</h3>
            <p className="text-gray-300">Works with your existing tools and platforms, creating a unified workflow.</p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Data-Driven Insights</h3>
            <p className="text-gray-300">Real-time analytics and actionable insights to drive better decisions.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Key Features",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-cyan-400 mb-3">A&R Scout Agent</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• Scores 99k+ songs daily</li>
            <li>• Real-time trend detection</li>
            <li>• Cross-platform analytics</li>
          </ul>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-purple-400 mb-3">Legal Agent</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• Contract analysis</li>
            <li>• Rights management</li>
            <li>• Compliance checking</li>
          </ul>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-400 mb-3">Metadata Agent</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• Automated tagging</li>
            <li>• Quality control</li>
            <li>• Format standardization</li>
          </ul>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">Fan Engagement Agent</h3>
          <ul className="text-gray-300 space-y-2">
            <li>• Social media monitoring</li>
            <li>• Sentiment analysis</li>
            <li>• Engagement optimization</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Market Opportunity",
    content: (
      <div className="space-y-6">
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Music Industry Market Size</h3>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-cyan-400">$26B</div>
            <div className="text-gray-300">Global Music Industry</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Target Segments</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Record Labels</li>
              <li>• Music Publishers</li>
              <li>• Music Schools</li>
              <li>• Independent Artists</li>
            </ul>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Growth Drivers</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Digital transformation</li>
              <li>• AI adoption</li>
              <li>• Market consolidation</li>
              <li>• Data-driven decisions</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "Team",
    content: (
      <div className="space-y-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-2xl">
            MN
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white">Mehdi Noori, PhD</h3>
            <p className="text-cyan-400">Founder & CEO</p>
            <p className="text-gray-300 mt-2">Former AI Research Lead at Spotify, PhD in Machine Learning</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Advisors</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Music Industry Veterans</li>
              <li>• AI/ML Experts</li>
              <li>• Business Leaders</li>
            </ul>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Partners</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Major Labels</li>
              <li>• Music Schools</li>
              <li>• Tech Providers</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "Contact",
    content: (
      <div className="flex flex-col items-center justify-center h-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get in Touch</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join our pilot program and be among the first to experience the future of music industry operations.
          </p>
          <a
            href="mailto:mehdi.noori7@gmail.com"
            className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Contact Us
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Email</h3>
            <p className="text-gray-300">mehdi.noori7@gmail.com</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Location</h3>
            <p className="text-gray-300">San Francisco, CA</p>
          </div>
        </div>
      </div>
    ),
  },
]

export default function PitchDeckViewer() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const totalSlides = slides.length

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSlide()
      } else if (e.key === "ArrowLeft") {
        prevSlide()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentSlide])

  const slide = slides[currentSlide]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 p-4 md:p-8">
        {/* Slide content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 p-4 md:p-6"
              style={{ height: "500px" }}
            >
              <div className="h-full">
                {currentSlide > 0 && <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">{slide.title}</h2>}
                <div className="h-full flex flex-col">{slide.content}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation controls */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-gray-400 hover:text-cyan-400 disabled:opacity-30 p-2"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto py-2 px-2 md:px-4 max-w-[80%] justify-center">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full transition-all flex-shrink-0 ${
                  currentSlide === index ? "bg-cyan-400 w-3 md:w-4" : "bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="text-gray-400 hover:text-cyan-400 disabled:opacity-30 p-2"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Slide counter */}
        <div className="mt-2 text-center text-gray-400 text-xs md:text-sm">
          Slide {currentSlide + 1} of {totalSlides}
        </div>
      </div>
    </div>
  )
}
