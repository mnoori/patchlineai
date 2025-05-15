import PitchDeckViewer from "@/components/pitch-deck/pitch-deck-viewer"

export default function PitchDeckPage() {
  return (
    <main className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PitchDeckViewer />
      </div>
    </main>
  )
}
