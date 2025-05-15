export default function PatchlinePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            Patchline AI Platform
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Intelligent agents that automate and orchestrate essential music industry workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* A&R Scout Agent */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">A&R Scout Agent</h3>
            <p className="text-gray-300 mb-4">
              Scores 99k+ songs daily using stream velocity, buzz, and metadata analysis.
            </p>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Real-time trend detection</li>
              <li>• Cross-platform analytics</li>
              <li>• Automated reporting</li>
            </ul>
          </div>

          {/* Legal Agent */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-purple-400 mb-4">Legal Agent</h3>
            <p className="text-gray-300 mb-4">Drafts contracts, flags rights issues, and suggests licensing terms.</p>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Contract analysis</li>
              <li>• Rights management</li>
              <li>• Compliance checking</li>
            </ul>
          </div>

          {/* Metadata Agent */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-green-400 mb-4">Metadata Agent</h3>
            <p className="text-gray-300 mb-4">
              Auto-tags catalogs, cleans up metadata, and ensures sync-ready formatting.
            </p>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Automated tagging</li>
              <li>• Quality control</li>
              <li>• Format standardization</li>
            </ul>
          </div>

          {/* Fan Engagement Agent */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Fan Engagement Agent</h3>
            <p className="text-gray-300 mb-4">Monitors social media, analyzes sentiment, and optimizes engagement.</p>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Social media monitoring</li>
              <li>• Sentiment analysis</li>
              <li>• Engagement optimization</li>
            </ul>
          </div>

          {/* School Operations Agent */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-pink-400 mb-4">School Operations Agent</h3>
            <p className="text-gray-300 mb-4">Manages student records, schedules, and curriculum planning.</p>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Student management</li>
              <li>• Schedule optimization</li>
              <li>• Resource allocation</li>
            </ul>
          </div>

          {/* Analytics Agent */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Analytics Agent</h3>
            <p className="text-gray-300 mb-4">
              Provides real-time insights and predictive analytics for business decisions.
            </p>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Performance tracking</li>
              <li>• Trend analysis</li>
              <li>• Revenue forecasting</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Transform Your Music Business?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our pilot program and be among the first to experience the future of music industry operations.
          </p>
          <a
            href="mailto:mehdi.noori7@gmail.com"
            className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Contact Us
          </a>
        </div>
      </div>
    </main>
  )
}
