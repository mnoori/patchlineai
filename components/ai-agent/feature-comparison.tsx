"use client"

import { motion } from "framer-motion"
import { CheckCircle, XCircle } from "lucide-react"

export default function FeatureComparison() {
  const features = [
    {
      name: "End-to-end workflow automation",
      description: "Seamless coordination across all business functions",
      platform: true,
      traditional: false,
    },
    {
      name: "AI-powered contract review",
      description: "Automated legal analysis with human oversight",
      platform: true,
      traditional: false,
    },
    {
      name: "Intelligent catalog management",
      description: "Automated tagging, organization, and opportunity matching",
      platform: true,
      traditional: false,
    },
    {
      name: "Cross-platform A&R scouting",
      description: "Continuous discovery across streaming, social, and live platforms",
      platform: true,
      traditional: false,
    },
    {
      name: "Sync licensing automation",
      description: "Proactive matching of catalog to licensing opportunities",
      platform: true,
      traditional: false,
    },
    {
      name: "Human-in-the-loop oversight",
      description: "AI handles research, humans make final decisions",
      platform: true,
      traditional: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto"
    >
      <div className="glassmorphic rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 border-b border-light/10">
          <div className="p-4 col-span-1 border-r border-light/10">
            <h3 className="font-semibold">Feature</h3>
          </div>
          <div className="p-4 text-center border-r border-light/10">
            <h3 className="font-semibold text-neon-cyan">AgentOS Platform</h3>
          </div>
          <div className="p-4 text-center">
            <h3 className="font-semibold text-light/60">Traditional Operations</h3>
          </div>
        </div>

        {features.map((feature, index) => (
          <div key={index} className="grid grid-cols-3 border-b border-light/10 last:border-b-0">
            <div className="p-4 col-span-1 border-r border-light/10">
              <h4 className="font-medium">{feature.name}</h4>
              <p className="text-sm text-light/60 mt-1">{feature.description}</p>
            </div>
            <div className="p-4 flex justify-center items-center border-r border-light/10">
              {feature.platform ? (
                <CheckCircle className="h-6 w-6 text-neon-cyan" />
              ) : (
                <XCircle className="h-6 w-6 text-light/30" />
              )}
            </div>
            <div className="p-4 flex justify-center items-center">
              {feature.traditional ? (
                <CheckCircle className="h-6 w-6 text-light/60" />
              ) : (
                <XCircle className="h-6 w-6 text-light/30" />
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
