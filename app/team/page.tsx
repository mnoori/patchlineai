import type { Metadata } from "next"
import { TeamSectionStatic } from "@/components/team-section-static"

export const metadata: Metadata = {
  title: "Our Team | Patchline AI",
  description: "Meet the team behind Patchline AI, led by founder and CEO Dr. Mehdi Noori.",
}

export default function TeamPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="py-20 px-4 md:px-6 container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gradient">Our Team</h1>
        <TeamSectionStatic />
      </div>
    </div>
  )
}
