"use client"

import { motion } from "framer-motion"
import { Lightbulb, Code, Presentation } from "lucide-react"

const services = [
  {
    icon: <Lightbulb className="h-10 w-10 text-neon-cyan" />,
    title: "Immersive Performance",
    description:
      "Custom audiovisual experiences for events, exhibitions, and installations. We blend generative art with spatial audio to create unforgettable sensory journeys.",
  },
  {
    icon: <Code className="h-10 w-10 text-neon-magenta" />,
    title: "Creative AI R&D",
    description:
      "Bespoke AI systems for creative applications. From generative music to interactive visuals, we develop custom solutions that push the boundaries of machine creativity.",
  },
  {
    icon: <Presentation className="h-10 w-10 text-neon-green" />,
    title: "Advisory Workshops",
    description:
      "Expert guidance on implementing AI in creative workflows. Our workshops help teams understand and leverage the potential of machine learning for innovation.",
  },
]

const Services = () => {
  return (
    <section id="services" className="py-24 relative">
      <div className="absolute inset-0 noise-bg opacity-30"></div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 glitch-text" data-text="Services">
            Services
          </h2>
          <p className="text-light/80 max-w-2xl mx-auto">
            We offer specialized services at the intersection of technology and creativity, helping organizations and
            artists explore new forms of expression and engagement.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
              whileHover={{
                translateY: -8,
                rotateZ: index % 2 === 0 ? 1 : -1,
                transition: { duration: 0.3 },
              }}
              className="bg-eclipse/50 border border-light/10 rounded-lg p-8 hover:border-neon-cyan/50 transition-all duration-300"
            >
              <div className="mb-6">{service.icon}</div>
              <h3 className="text-xl font-bold mb-4">{service.title}</h3>
              <p className="text-light/70">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
