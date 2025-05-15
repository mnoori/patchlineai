"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const About = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 noise-bg opacity-30"></div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div className="flex justify-center md:justify-end">
            <div className="relative">
              {/* Image container with more breathing room */}
              <div className="relative">
                {/* Solid border to make the image pop */}
                <div className="absolute -inset-3 rounded-full bg-eclipse border-2 border-neon-cyan/70"></div>

                {/* Subtle glow effect */}
                <div className="absolute -inset-1 rounded-full bg-neon-cyan/20 blur-md"></div>

                {/* Image with padding to avoid cropping */}
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden relative bg-eclipse p-1">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <Image
                      src="/mehdi-dj-cropped.png"
                      alt="Dr. Mehdi Noori"
                      width={320}
                      height={320}
                      className="object-cover w-full h-full"
                      style={{ objectPosition: "center 30%" }} // Adjust to keep face centered
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 glitch-text" data-text="The Architect">
              The Architect
            </h2>
            <div className="space-y-4 text-light/90">
              <p>
                Dr Mehdi Noori blends deep AI research with forward‑thinking music and visual design. Holding a{" "}
                <strong>Ph.D. in Engineering</strong> from <strong>UCF</strong> and post‑doctoral credentials from{" "}
                <strong>MIT</strong>, he has spent the last decade translating advanced machine‑learning concepts into
                real‑time, audience‑ready experiences.
              </p>
              <p>
                To sharpen his creative craft, Mehdi trained at <strong>Cosmic Academy</strong>,{" "}
                <strong>Point Blank Music School</strong>, and <strong>Sound Collective</strong>, adding professional
                sound‑design and performance technique to his technical arsenal. He also earned a certificate in TV /
                Film Industry Essentials from <strong>NYU Tisch</strong>, rounding out a multidisciplinary toolkit that
                spans code, composition, and cinematic storytelling.
              </p>
              <p>
                As founder of <strong>Algoryx Art & Technology Lab</strong>, Mehdi architects end‑to‑end pipelines where
                generative models, projection mapping, and immersive audio converge. Whether prototyping new multimodal
                AI systems or staging large‑format AV shows, he pushes boundaries with an engineer's rigor and an
                artist's curiosity—always aiming to make technology feel human, immediate, and electrifying.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
