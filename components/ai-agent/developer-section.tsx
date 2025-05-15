"use client"

import { motion } from "framer-motion"
import { Code, Copy, Check } from "lucide-react"
import { useState } from "react"

export default function DeveloperSection() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`const response = await fetch('https://api.musicai.io/v1/discover', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    genre: 'electronic',
    similar_to: ['artist_id_1', 'artist_id_2'],
    min_growth_rate: 0.5,
    limit: 10
  })
});

const data = await response.json();
console.log(data.discoveries);`)

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Code className="h-5 w-5 mr-2 text-neon-cyan" /> API Integration
          </h3>
          <p className="text-light/80 mb-4">
            Our RESTful API allows you to integrate our AI agents directly into your applications. Get started with just
            a few lines of code.
          </p>
          <div className="space-y-4">
            <div className="bg-eclipse/50 border border-light/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-light/60">Discovery Endpoint</h4>
                <button onClick={handleCopy} className="text-light/40 hover:text-neon-cyan transition-colors">
                  {copied ? <Check className="h-4 w-4 text-neon-green" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <pre className="text-xs text-light/80 overflow-x-auto p-2">
                <code>{`const response = await fetch('https://api.musicai.io/v1/discover', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    genre: 'electronic',
    similar_to: ['artist_id_1', 'artist_id_2'],
    min_growth_rate: 0.5,
    limit: 10
  })
});

const data = await response.json();
console.log(data.discoveries);`}</code>
              </pre>
            </div>
          </div>
          <p className="text-sm text-light/60 mt-4">
            Check our{" "}
            <a href="#" className="text-neon-cyan hover:underline">
              documentation
            </a>{" "}
            for more endpoints and examples.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Integration Options</h3>
          <div className="space-y-4">
            <div className="bg-eclipse/50 border border-light/10 rounded-lg p-4 hover:border-neon-cyan/50 transition-all">
              <h4 className="font-medium mb-2">Webhooks</h4>
              <p className="text-sm text-light/80">
                Receive real-time notifications when our AI agents discover new artists or tracks that match your
                criteria.
              </p>
            </div>
            <div className="bg-eclipse/50 border border-light/10 rounded-lg p-4 hover:border-neon-cyan/50 transition-all">
              <h4 className="font-medium mb-2">SDK Libraries</h4>
              <p className="text-sm text-light/80">
                Use our official client libraries for JavaScript, Python, and Ruby to integrate with our platform.
              </p>
            </div>
            <div className="bg-eclipse/50 border border-light/10 rounded-lg p-4 hover:border-neon-cyan/50 transition-all">
              <h4 className="font-medium mb-2">Custom Workflows</h4>
              <p className="text-sm text-light/80">
                Build custom workflows with our agents using our workflow builder or directly via the API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
