"use client"

import { motion } from "framer-motion"
import { Search, FileText, Music, LinkIcon, BarChart, Heart } from "lucide-react"

const services = [
  {
    icon: <Search className="h-10 w-10 text-neon-cyan" />,
    title: "A&R Discovery",
    description:
      "Our AI-powered A&R agent analyzes 100,000+ tracks daily to identify promising artists and tracks that match your label's sound.",
  },
  {
    icon: <FileText className="h-10 w-10 text-neon-magenta" />,
    title: "Legal Automation",
    description:
      "Automated contract review, rights management, and licensing with our specialized legal agent that ensures compliance and efficiency.",
  },
  {
    icon: <Music className="h-10 w-10 text-neon-green" />,
    title: "Catalog Management",
    description:
      "Intelligent catalog organization with automated metadata management, rights tracking, and opportunity matching across platforms.",
  },
  {
    icon: <LinkIcon className="h-10 w-10 text-neon-cyan" />,
    title: "Sync Licensing",
    description:
      "Automated matching of your catalog to sync licensing opportunities across film, TV, advertising, and gaming.",
  },
  {
    icon: <BarChart className="h-10 w-10 text-neon-magenta" />,
    title: "Analytics & Insights",
    description:
      "Real-time data visualization and predictive analytics to track emerging genres, production techniques, and audience preferences.",
  },
  {
    icon: <Heart className="h-10 w-10 text-neon-green" />,
    title: "Fan Engagement",
    description:
      "AI-powered fan communication, social media strategy, and marketing campaign optimization based on audience data.",
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
