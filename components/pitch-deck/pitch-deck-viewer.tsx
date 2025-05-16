"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useMediaQuery } from "@/hooks/use-media-query"

// Define the pitch deck slides with detailed content
const slides = [
  {
    id: 1,
    content: (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-neon-cyan">Patchline</h1>
        <p className="text-xl md:text-2xl text-light/90 mb-8 max-w-3xl text-center">
          The Invisible Agentic AI Layer for the Music Industry
        </p>
        <p className="text-lg text-light/70">Mehdi Noori, PhD</p>
      </div>
    ),
  },
  {
    id: 2,
    title: "Background & Problem",
    content: (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30 text-center">
            <p className="text-2xl md:text-3xl font-bold text-neon-cyan mb-1">170M</p>
            <p className="text-xs md:text-sm">Songs Released Globally in 2024</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30 text-center">
            <p className="text-2xl md:text-3xl font-bold text-neon-magenta mb-1">87%</p>
            <p className="text-xs md:text-sm">Low Streams Received fewer than 1,000 streams</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30 text-center">
            <p className="text-2xl md:text-3xl font-bold text-neon-green mb-1">99K+</p>
            <p className="text-xs md:text-sm">Daily Uploads Tracks uploaded daily to DSPs</p>
          </div>
        </div>
        <div className="space-y-2 text-light/90 text-sm md:text-base">
          <p>The music industry is oversaturated at the bottom, concentrated at the top.</p>
          <p>
            Independent creators lack access to professional tools that major labels own such as metadata systems, legal
            infrastructure, discovery engines.
          </p>
          <p>Human-led A&R can't keep up with the volume of new music.</p>
          <p>Metadata chaos, rights complexity, and fragmented operations slow down everyone.</p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Vision",
    content: (
      <div className="space-y-4 md:space-y-6">
        <div className="text-center mb-3 md:mb-4">
          <p className="text-xl md:text-2xl font-bold text-neon-cyan">
            Democratize success in the music industry through AI
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30 text-center">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">
              Enterprise-grade infrastructure for all
            </p>
            <p className="text-xs md:text-sm text-light/80">Labels, artists, schools, studios</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30 text-center">
            <p className="font-bold text-neon-magenta mb-1 text-sm md:text-base">
              Human-centered, agent-augmented orchestration
            </p>
            <p className="text-xs md:text-sm text-light/80">AI handles the grind; humans make creative decisions</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30 text-center">
            <p className="font-bold text-neon-green mb-1 text-sm md:text-base">For every music workflow</p>
            <p className="text-xs md:text-sm text-light/80">A&R, legal, metadata, fan engagement, education</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "The Solution: A Full-Stack AI Agent Platform",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">A&R Scout Agent</p>
            <p className="text-xs md:text-sm text-light/90">
              Scores 99k+ songs daily using stream velocity, buzz, and metadata.
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
            <p className="font-bold text-neon-magenta mb-1 text-sm md:text-base">Legal Agent</p>
            <p className="text-xs md:text-sm text-light/90">
              Drafts contracts, flags rights issues, suggests licensing terms.
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30">
            <p className="font-bold text-neon-green mb-1 text-sm md:text-base">Metadata Agent</p>
            <p className="text-xs md:text-sm text-light/90">
              Auto-tags catalogs, cleans up metadata, sync-ready formatting.
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Fan Engagement Agent</p>
            <p className="text-xs md:text-sm text-light/90">Generates GPT-based outreach tailored to fan segments.</p>
          </div>
        </div>
        <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-light/20">
          <p className="text-xs md:text-sm text-light/90">
            Built using CrewAI (Bedrock LLM orchestration), but deployable in any cloud, any data source.
          </p>
          <p className="text-xs md:text-sm text-light/90 mt-1">
            Supports Bring Your Own Cloud (BYOC) for security-conscious users.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Market Opportunity",
    content: (
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-center items-center gap-6 md:gap-12 mb-4 md:mb-6">
          <div className="text-center">
            <p className="text-2xl md:text-4xl font-bold text-neon-cyan">2024</p>
            <p className="text-3xl md:text-5xl font-bold mt-1">$28B</p>
          </div>
          <div className="h-16 md:h-20 border-r border-light/30"></div>
          <div className="text-center">
            <p className="text-2xl md:text-4xl font-bold text-neon-green">2030</p>
            <p className="text-3xl md:text-5xl font-bold mt-1">$49B</p>
          </div>
        </div>
        <div className="space-y-2 md:space-y-3 text-light/90 text-sm md:text-base">
          <p>Growth runway: Goldman Sachs projects recorded-music to hit $49B by 2030 (≈ 9% CAGR)</p>
          <p>Music-education & creator-tool market: $6B, 7% CAGR</p>
          <p>Serviceable Available Market (SAM) for Patchline (labels + education): ≈ $15B today → $25B by 2030</p>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "Business Model",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Subscription</p>
            <p className="text-xs md:text-sm text-light/90">Tiered by number of agents & usage</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Starter</span>
                <span className="font-medium">$249/mo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Professional</span>
                <span className="font-medium">$749/mo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Enterprise</span>
                <span className="font-medium">Custom</span>
              </div>
            </div>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
            <p className="font-bold text-neon-magenta mb-1 text-sm md:text-base">Enterprise</p>
            <p className="text-xs md:text-sm text-light/90">Custom enterprise integrations</p>
            <ul className="mt-2 text-xs space-y-1 list-disc pl-4">
              <li>White-labeled deployment</li>
              <li>Custom agent development</li>
              <li>Dedicated support team</li>
              <li>SLA guarantees</li>
            </ul>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30">
            <p className="font-bold text-neon-green mb-1 text-sm md:text-base">Marketplace</p>
            <p className="text-xs md:text-sm text-light/90">Pre-trained vertical agents</p>
            <ul className="mt-2 text-xs space-y-1 list-disc pl-4">
              <li>Revenue share with developers</li>
              <li>Pay-per-use pricing</li>
              <li>Custom agent training</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-light/20">
            <p className="font-bold mb-1 text-xs md:text-sm">Revenue Projections</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs">Year 1</span>
                <div className="w-2/3 bg-eclipse rounded-full h-2">
                  <div className="bg-neon-cyan h-2 rounded-full" style={{ width: "15%" }}></div>
                </div>
                <span className="text-xs font-medium">$600K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Year 2</span>
                <div className="w-2/3 bg-eclipse rounded-full h-2">
                  <div className="bg-neon-magenta h-2 rounded-full" style={{ width: "35%" }}></div>
                </div>
                <span className="text-xs font-medium">$2.2M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs">Year 3</span>
                <div className="w-2/3 bg-eclipse rounded-full h-2">
                  <div className="bg-neon-green h-2 rounded-full" style={{ width: "60%" }}></div>
                </div>
                <span className="text-xs font-medium">$5.5M</span>
              </div>
            </div>
          </div>

          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-light/20">
            <p className="font-bold mb-1 text-xs md:text-sm">Unit Economics</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-light/60">CAC</p>
                <p className="font-medium">$3,500</p>
              </div>
              <div>
                <p className="text-light/60">LTV</p>
                <p className="font-medium">$18,000+</p>
              </div>
              <div>
                <p className="text-light/60">Gross Margin</p>
                <p className="font-medium">70-80%</p>
              </div>
              <div>
                <p className="text-light/60">Payback Period</p>
                <p className="font-medium">12-18 months</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/20 mt-3">
          <p className="font-bold text-neon-cyan mb-1 text-xs md:text-sm">Go-To-Market Strategy</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="font-medium">Phase 1</p>
              <p>Indie Labels + Schools</p>
            </div>
            <div className="text-center">
              <p className="font-medium">Phase 2</p>
              <p>Mid-size Labels + Distributors</p>
            </div>
            <div className="text-center">
              <p className="font-medium">Phase 3</p>
              <p>Enterprise + International</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "Product Architecture",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Agent Framework</p>
            <p className="text-xs md:text-sm text-light/90">
              Built on CrewAI / AutoGen v2 (or any new agentic development platform of the future)
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
            <p className="font-bold text-neon-magenta mb-1 text-sm md:text-base">LLMs</p>
            <p className="text-xs md:text-sm text-light/90">
              Auto-switching between leading models and custom LoRA fine-tuned models
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30">
            <p className="font-bold text-neon-green mb-1 text-sm md:text-base">AgentOps Lifecycle</p>
            <p className="text-xs md:text-sm text-light/90">
              Logging, observability, with option for human-in-the-loop oversight
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Data Ingestion and Analytics</p>
            <p className="text-xs md:text-sm text-light/90">Spotify, TikTok, Musixmatch, rights DBs, CSV uploads</p>
          </div>
        </div>
        <div className="space-y-2 md:space-y-3 mt-2 md:mt-3">
          <p className="text-xs md:text-sm text-light/90">
            <span className="font-bold">Hosting:</span> Cloud-agnostic; BYOC enabled
          </p>
          <p className="text-xs md:text-sm text-light/90">
            <span className="font-bold">Security & Governance:</span> Auditing, sandboxing, versioning, evaluation
            layers
          </p>
          <div className="bg-eclipse/40 p-2 md:p-3 rounded-lg border border-light/20 mt-1 md:mt-2">
            <p className="font-bold mb-1 text-xs md:text-sm">AI Strategy Alignment:</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              <div className="text-xs text-light/90 flex items-start">
                <span className="mr-1">•</span>
                <span>Scout 50x more tracks daily</span>
              </div>
              <div className="text-xs text-light/90 flex items-start">
                <span className="mr-1">•</span>
                <span>50-70% faster deal cycle</span>
              </div>
              <div className="text-xs text-light/90 flex items-start">
                <span className="mr-1">•</span>
                <span>Better metadata = more sync</span>
              </div>
              <div className="text-xs text-light/90 flex items-start">
                <span className="mr-1">•</span>
                <span>Higher fan LTV via GPT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    title: "Competitive Advantage",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Vertical focus</p>
            <p className="text-xs md:text-sm text-light/90">Tailored for music's messy data and nuanced workflows</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
            <p className="font-bold text-neon-magenta mb-1 text-sm md:text-base">End-to-end orchestration</p>
            <p className="text-xs md:text-sm text-light/90">Not a point tool, but a full AI ops layer</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30">
            <p className="font-bold text-neon-green mb-1 text-sm md:text-base">Fast setup</p>
            <p className="text-xs md:text-sm text-light/90">Out-of-the-box copilots + custom hooks</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Cross-entity usability</p>
            <p className="text-xs md:text-sm text-light/90">
              Equally effective for labels, creators, educators, and ops teams
            </p>
          </div>
        </div>
        <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-light/20">
          <p className="font-bold mb-1 text-xs md:text-sm">Agentic reasoning unlocks:</p>
          <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm text-light/90 space-y-0.5 md:space-y-1">
            <li>Rights clause prediction</li>
            <li>Risk analysis across contract history</li>
            <li>Forecasting track ROI for sync/licensing</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    title: "Go-To-Market Strategy",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Pilot Programs</p>
            <p className="text-xs md:text-sm text-light/90">Targeting indie labels and schools</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
            <p className="font-bold text-neon-magenta mb-1 text-sm md:text-base">Freemium Artist Tools</p>
            <p className="text-xs md:text-sm text-light/90">For submission automation & feedback</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30">
            <p className="font-bold text-neon-green mb-1 text-sm md:text-base">Word-of-Mouth</p>
            <p className="text-xs md:text-sm text-light/90">
              Via agents built for creative teams (e.g., Tour Planner Agent)
            </p>
          </div>
        </div>
        <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-light/20">
          <p className="font-bold mb-1 text-xs md:text-sm">Strategic Partnerships</p>
          <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm text-light/90 space-y-0.5 md:space-y-1">
            <li>Distributors (e.g., DistroKid, TuneCore)</li>
            <li>Educators (e.g., Berklee, online music academies)</li>
            <li>Management platforms (e.g., AWAL, Songtrust)</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    title: "Team & Readiness",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-neon-cyan/50 shadow-lg shadow-neon-cyan/20">
              <Image src="/mehdi-headshot.jpg" alt="Mehdi Noori" fill className="object-cover" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-neon-cyan/10 to-transparent"></div>
            </div>
          </div>
          <div className="flex-grow">
            <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
              <p className="font-bold text-neon-cyan mb-1 text-sm md:text-base">Founder: Mehdi Noori, PhD</p>
              <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm text-light/90 space-y-0.5 md:space-y-1">
                <li>AWS GenAI Sr Tech Lead, Nielsen Data Scientist, Postdoc @MIT, Former Instructor @UCF</li>
                <li>
                  For over a decade, built ML/AI/GenAI/Agentic applications and solutions for Fortune 500 companies
                  across all industries
                </li>
                <li>DJ & VJ: first-hand creator & performer, DJ and VJ simultaneously with AI generated visuals</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
            <p className="font-bold text-neon-magenta mb-1 text-sm md:text-base">Hiring Plan</p>
            <p className="text-xs md:text-sm text-light/90">A&R/Rights/legal co-founder + GTM lead (music-tech BD)</p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30">
            <p className="font-bold text-neon-green mb-1 text-sm md:text-base">Organizational Readiness</p>
            <ul className="list-disc pl-4 md:pl-5 text-xs md:text-sm text-light/90 space-y-0.5 md:space-y-1">
              <li>Booth CAIO program participant</li>
              <li>MVP in prototype phase</li>
              <li>Pilot discussions underway</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 11,
    title: "Roadmap Highlights",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="relative">
          <div className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-neon-cyan/30"></div>
          <div className="space-y-4 md:space-y-6 relative">
            <div className="ml-8 md:ml-10 relative">
              <div className="absolute -left-8 md:-left-10 top-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-neon-cyan"></div>
              <p className="font-bold text-neon-cyan text-sm md:text-base">Q2 2025</p>
              <p className="text-light/90 text-xs md:text-sm">Production-ready MVP, 3 LOIs with indie labels</p>
            </div>
            <div className="ml-8 md:ml-10 relative">
              <div className="absolute -left-8 md:-left-10 top-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-neon-magenta"></div>
              <p className="font-bold text-neon-magenta text-sm md:text-base">Q3 2025</p>
              <p className="text-light/90 text-xs md:text-sm">Closed alpha, first paid label pilots</p>
            </div>
            <div className="ml-8 md:ml-10 relative">
              <div className="absolute -left-8 md:-left-10 top-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-neon-green"></div>
              <p className="font-bold text-neon-green text-sm md:text-base">Q4 2025</p>
              <p className="text-light/90 text-xs md:text-sm">
                Public beta, 10 labels & 3 music schools, Target ARR $500k
              </p>
            </div>
            <div className="ml-8 md:ml-10 relative">
              <div className="absolute -left-8 md:-left-10 top-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-neon-cyan"></div>
              <p className="font-bold text-neon-cyan text-sm md:text-base">Q1 2026</p>
              <p className="text-light/90 text-xs md:text-sm">
                Agent Marketplace launch, Series A funding, 30 paying entities
              </p>
            </div>
            <div className="ml-8 md:ml-10 relative">
              <div className="absolute -left-8 md:-left-10 top-1 w-3 h-3 md:w-4 md:h-4 rounded-full bg-neon-magenta"></div>
              <p className="font-bold text-neon-magenta text-sm md:text-base">Q2 2026</p>
              <p className="text-light/90 text-xs md:text-sm">
                Geographic expansion, enterprise partnerships, 50+ clients
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 12,
    title: "Core Values & Call to Action",
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-xs md:text-sm">Artist-First Empowerment</p>
            <p className="text-xs text-light/90">
              Every feature is designed to protect creators' rights and amplify their opportunities.
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
            <p className="font-bold text-neon-magenta mb-1 text-xs md:text-sm">Human-AI Synergy</p>
            <p className="text-xs text-light/90">
              AI handles the grind; people make the creative calls. Technology augments, never replaces.
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-green/30">
            <p className="font-bold text-neon-green mb-1 text-xs md:text-sm">Radical Transparency & Trust</p>
            <p className="text-xs text-light/90">
              Clear audit trails, bias testing, and explainable outputs at every step.
            </p>
          </div>
          <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-cyan/30">
            <p className="font-bold text-neon-cyan mb-1 text-xs md:text-sm">Reliability at Scale</p>
            <p className="text-xs text-light/90">
              Cloud-agnostic, BYOC architecture built for 24/7 uptime as catalogs and classes grow.
            </p>
          </div>
        </div>
        <div className="bg-eclipse/40 p-3 md:p-4 rounded-lg border border-neon-magenta/30">
          <p className="font-bold text-neon-magenta mb-1 text-xs md:text-sm">Inclusive Community</p>
          <p className="text-xs text-light/90">
            Tools priced and designed so labels, educators, and individual artists all thrive together.
          </p>
        </div>
        <div className="text-center mt-3 md:mt-4 space-y-1 md:space-y-2">
          <p className="text-base md:text-lg font-bold">Join the pilot: patchline.ai/pilot</p>
          <p className="text-xs md:text-sm text-light/90">Looking for: Labels, schools, artists, early partners</p>
          <p className="text-xs md:text-sm text-light/90">Contact: Mehdi Noori — mehdi.noori7@gmail.com</p>
          <p className="text-base md:text-lg font-bold text-neon-cyan mt-2 md:mt-3">
            Let's bring AI superpowers to the business of music.
          </p>
          <p className="text-base md:text-lg font-bold text-neon-cyan">Patchline is how the music industry scales.</p>
        </div>
      </div>
    ),
  },
]

export default function PitchDeckViewer() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const totalSlides = slides.length
  const isMobile = useMediaQuery("(max-width: 768px)")

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
      <div className="glassmorphic rounded-xl overflow-hidden border border-light/10 p-4 md:p-8">
        {/* Slide content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative w-full overflow-hidden rounded-lg border border-light/10 bg-eclipse/50 p-4 md:p-6"
              style={{ height: isMobile ? "auto" : "500px" }} // Fixed height on desktop, auto on mobile
            >
              <div className="h-full">
                {currentSlide > 0 && <h2 className="text-xl md:text-2xl font-bold mb-4">{slide.title}</h2>}
                <div className="h-full flex flex-col">{slide.content}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation controls */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-light/60 hover:text-neon-cyan disabled:opacity-30"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto py-2 px-2 md:px-4 max-w-[80%] justify-center">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full transition-all flex-shrink-0 ${
                  currentSlide === index ? "bg-neon-cyan w-3 md:w-4" : "bg-light/30 hover:bg-light/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="text-light/60 hover:text-neon-cyan disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Slide counter */}
        <div className="mt-2 text-center text-light/60 text-xs md:text-sm">
          Slide {currentSlide + 1} of {totalSlides}
        </div>
      </div>
    </div>
  )
}
