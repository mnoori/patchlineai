export function TeamSectionStatic() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 gap-12 items-start">
        {/* Founder Card */}
        <div className="glassmorphic rounded-xl overflow-hidden border border-light/10 p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="md:w-1/3 flex flex-col items-center">
              {/* Profile Image */}
              <div className="w-64 h-64 rounded-full bg-eclipse border-2 border-neon-cyan/30 overflow-hidden relative">
                {/* Static img tag with fixed dimensions */}
                <img src="/team/headshot.jpeg" alt="Dr. Mehdi Noori" className="w-full h-full object-cover" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-magenta/5 pointer-events-none"></div>
              </div>

              {/* Social Links */}
              <div className="mt-4 flex justify-center space-x-4">
                <a
                  href="https://www.linkedin.com/in/mehdi-noori/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-eclipse/50 hover:bg-neon-cyan/20 border border-light/10 hover:border-neon-cyan transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-light/70"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/patchlineai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-eclipse/50 hover:bg-neon-cyan/20 border border-light/10 hover:border-neon-cyan transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-light/70"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a
                  href="https://soundcloud.com/patchlineai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-eclipse/50 hover:bg-neon-cyan/20 border border-light/10 hover:border-neon-cyan transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-light/70"
                  >
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                </a>
              </div>
            </div>

            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold text-gradient mb-1">Dr. Mehdi Noori</h2>
              <p className="text-neon-cyan mb-4">Founder & CEO</p>

              <div className="prose prose-invert prose-sm max-w-none">
                <p>
                  Dr. Mehdi Noori is a rare hybrid of AI scientist and music industry insider. With a Ph.D. in
                  engineering, a postdoc at MIT, and 15+ years leading AI innovation at firms like AWS and Nielsen, he's
                  built scalable GenAI systems used by Fortune 500s across healthcare, finance, and media.
                </p>

                <p>
                  But he's also a trained music producer and DJ. Formally educated at Point Blank, Sound
                  Collective, and Cosmic Academy, and deeply embedded in the creative scene. That dual fluency gives him
                  a unique edge: he's lived the pain points Patchline solves.
                </p>

                <p>
                  Before founding Patchline, Mehdi led an AI-focused creative tech lab, where he prototyped AI-native tools
                  for creative workflows. Now, he's applying that experience to reimagine how music teams work: with
                  agentic infrastructure that blends deep technical rigor with human-centered design.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Join Our Team Section */}
        <div className="glassmorphic rounded-xl overflow-hidden border border-light/10 p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Join Our Team</h3>
          <p className="text-light/70 max-w-2xl mx-auto mb-6">
            Patchline is growing! We're looking for passionate individuals who share our vision of transforming the
            music industry with AI. If you're excited about building the future of music technology, we want to hear
            from you.
          </p>
          <a
            href="mailto:hello@patchline.ai?subject=Job Inquiry"
            className="inline-block px-6 py-3 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50 rounded-md transition-all"
          >
            Contact Us About Opportunities
          </a>
        </div>
      </div>
    </div>
  )
}
