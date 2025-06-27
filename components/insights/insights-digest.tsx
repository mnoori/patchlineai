"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Lightbulb, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

interface Highlight {
  title: string
  description: string
}

interface Recommendation {
  title: string
  description: string
}

interface InsightsDigestProps {
  digest: {
    summary: string
    date: string
    highlights: Highlight[]
    recommendations: Recommendation[]
  }
}

export function InsightsDigest({ digest }: InsightsDigestProps) {
  return (
    <Card className="glass-effect hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-cyan" />
          <CardTitle className="text-lg font-medium">Insights Digest</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-background/20 text-muted-foreground border-border/50">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {digest.date}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-sm text-muted-foreground">{digest.summary}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="border-t border-border/50 pt-3 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-brand-cyan" />
                <h3 className="font-medium">Key Highlights</h3>
              </div>
              <div className="space-y-3">
                {digest.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="border border-border/50 rounded-lg p-3 hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-200"
                  >
                    <h4 className="font-medium text-sm mb-1">{highlight.title}</h4>
                    <p className="text-xs text-muted-foreground">{highlight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="border-t border-border/50 pt-3 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-brand-cyan" />
                <h3 className="font-medium">Recommendations</h3>
              </div>
              <div className="space-y-3">
                {digest.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="border border-border/50 rounded-lg p-3 hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-200"
                  >
                    <h4 className="font-medium text-sm mb-1">{recommendation.title}</h4>
                    <p className="text-xs text-muted-foreground">{recommendation.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
