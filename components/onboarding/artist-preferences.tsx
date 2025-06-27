"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Music, 
  Globe, 
  TrendingUp, 
  Users, 
  Sparkles,
  ChevronRight,
  Check,
  Zap,
  Radio,
  Headphones,
  Mic2,
  Music2,
  Music3,
  Music4
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ArtistPreferencesProps {
  onComplete: (preferences: UserPreferences) => void
  onSkip?: () => void
}

export interface UserPreferences {
  genres: string[]
  markets: string[]
  careerStage: string[]
  monthlyListeners: string
}

const GENRES = [
  { id: "hip-hop", label: "Hip Hop", icon: Mic2 },
  { id: "pop", label: "Pop", icon: Radio },
  { id: "rock", label: "Rock", icon: Music4 },
  { id: "electronic", label: "Electronic", icon: Headphones },
  { id: "r&b", label: "R&B", icon: Music },
  { id: "indie", label: "Indie", icon: Music2 },
  { id: "latin", label: "Latin", icon: Music3 },
  { id: "jazz", label: "Jazz", icon: Music2 },
  { id: "country", label: "Country", icon: Music4 },
  { id: "classical", label: "Classical", icon: Music3 },
  { id: "metal", label: "Metal", icon: Zap },
  { id: "reggae", label: "Reggae", icon: Music }
]

const MARKETS = [
  { id: "us", label: "United States", flag: "🇺🇸" },
  { id: "uk", label: "United Kingdom", flag: "🇬🇧" },
  { id: "ca", label: "Canada", flag: "🇨🇦" },
  { id: "au", label: "Australia", flag: "🇦🇺" },
  { id: "de", label: "Germany", flag: "🇩🇪" },
  { id: "fr", label: "France", flag: "🇫🇷" },
  { id: "es", label: "Spain", flag: "🇪🇸" },
  { id: "br", label: "Brazil", flag: "🇧🇷" },
  { id: "mx", label: "Mexico", flag: "🇲🇽" },
  { id: "jp", label: "Japan", flag: "🇯🇵" },
  { id: "kr", label: "South Korea", flag: "🇰🇷" },
  { id: "global", label: "Global", flag: "🌍" }
]

const CAREER_STAGES = [
  { id: "emerging", label: "Emerging", description: "0-10K monthly listeners", icon: Sparkles },
  { id: "developing", label: "Developing", description: "10K-100K monthly listeners", icon: TrendingUp },
  { id: "established", label: "Established", description: "100K-1M monthly listeners", icon: Users },
  { id: "superstar", label: "Superstar", description: "1M+ monthly listeners", icon: Zap }
]

export function ArtistPreferences({ onComplete, onSkip }: ArtistPreferencesProps) {
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState<UserPreferences>({
    genres: [],
    markets: [],
    careerStage: [],
    monthlyListeners: "0-1M"
  })

  const handleGenreToggle = (genreId: string) => {
    setPreferences(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(g => g !== genreId)
        : [...prev.genres, genreId]
    }))
  }

  const handleMarketToggle = (marketId: string) => {
    setPreferences(prev => ({
      ...prev,
      markets: prev.markets.includes(marketId)
        ? prev.markets.filter(m => m !== marketId)
        : [...prev.markets, marketId]
    }))
  }

  const handleCareerStageToggle = (stageId: string) => {
    setPreferences(prev => ({
      ...prev,
      careerStage: prev.careerStage.includes(stageId)
        ? prev.careerStage.filter(s => s !== stageId)
        : [...prev.careerStage, stageId]
    }))
  }

  const handleComplete = () => {
    if (preferences.genres.length === 0) {
      toast.error("Please select at least one genre")
      return
    }
    if (preferences.markets.length === 0) {
      toast.error("Please select at least one market")
      return
    }
    if (preferences.careerStage.length === 0) {
      toast.error("Please select at least one career stage")
      return
    }
    onComplete(preferences)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-cyan via-purple-400 to-pink-400 bg-clip-text text-transparent">
                What genres are you interested in?
              </h2>
              <p className="text-muted-foreground">Select all that apply to discover the best emerging talent</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {GENRES.map((genre) => {
                const Icon = genre.icon
                const isSelected = preferences.genres.includes(genre.id)
                
                return (
                  <motion.button
                    key={genre.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenreToggle(genre.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-200",
                      "backdrop-blur-xl bg-black/20",
                      isSelected 
                        ? "border-brand-cyan bg-brand-cyan/10 shadow-[0_0_20px_rgba(34,211,238,0.3)]" 
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon className={cn(
                        "h-6 w-6 transition-colors",
                        isSelected ? "text-brand-cyan" : "text-white/60"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-brand-cyan" : "text-white/80"
                      )}>
                        {genre.label}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-brand-cyan rounded-full p-1"
                      >
                        <Check className="h-3 w-3 text-black" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={onSkip}
                className="text-white/60 hover:text-white"
              >
                Skip Setup
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={preferences.genres.length === 0}
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-black font-medium"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-brand-cyan bg-clip-text text-transparent">
                Which markets are you targeting?
              </h2>
              <p className="text-muted-foreground">We'll find artists with traction in these regions</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MARKETS.map((market) => {
                const isSelected = preferences.markets.includes(market.id)
                
                return (
                  <motion.button
                    key={market.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMarketToggle(market.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-200",
                      "backdrop-blur-xl bg-black/20",
                      isSelected 
                        ? "border-purple-400 bg-purple-400/10 shadow-[0_0_20px_rgba(192,132,252,0.3)]" 
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{market.flag}</span>
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-purple-400" : "text-white/80"
                      )}>
                        {market.label}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-purple-400 rounded-full p-1"
                      >
                        <Check className="h-3 w-3 text-black" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-white/60 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={preferences.markets.length === 0}
                className="bg-purple-400 hover:bg-purple-400/90 text-black font-medium"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-brand-cyan to-purple-400 bg-clip-text text-transparent">
                What career stage are you looking for?
              </h2>
              <p className="text-muted-foreground">Focus on artists at the right growth stage for your label</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAREER_STAGES.map((stage) => {
                const Icon = stage.icon
                const isSelected = preferences.careerStage.includes(stage.id)
                
                return (
                  <motion.button
                    key={stage.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCareerStageToggle(stage.id)}
                    className={cn(
                      "relative p-6 rounded-xl border-2 transition-all duration-200",
                      "backdrop-blur-xl bg-black/20",
                      isSelected 
                        ? "border-pink-400 bg-pink-400/10 shadow-[0_0_20px_rgba(244,114,182,0.3)]" 
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <Icon className={cn(
                        "h-8 w-8 transition-colors",
                        isSelected ? "text-pink-400" : "text-white/60"
                      )} />
                      <div className="text-left">
                        <h3 className={cn(
                          "font-semibold mb-1",
                          isSelected ? "text-pink-400" : "text-white"
                        )}>
                          {stage.label}
                        </h3>
                        <p className="text-sm text-white/60">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-pink-400 rounded-full p-1"
                      >
                        <Check className="h-3 w-3 text-black" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="text-white/60 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={preferences.careerStage.length === 0}
                className="bg-gradient-to-r from-pink-400 via-brand-cyan to-purple-400 hover:opacity-90 text-black font-medium"
              >
                Start Discovering Artists
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        <Card className="glass-effect border-white/10 bg-black/40 backdrop-blur-2xl p-8 md:p-12">
          {/* Progress indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    i <= step 
                      ? "bg-gradient-to-r from-brand-cyan to-purple-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                      : "bg-white/20"
                  )} />
                  {i < 3 && (
                    <div className={cn(
                      "h-0.5 w-8 md:w-16 transition-all duration-300",
                      i < step ? "bg-gradient-to-r from-brand-cyan to-purple-400" : "bg-white/20"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  )
} 