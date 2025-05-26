import { create } from "zustand"
import { type Release, mockReleases } from "@/lib/mock/release"

interface ReleaseStore {
  releases: Release[]
  selectedRelease: Release | null
  searchTerm: string
  activeTab: string
  dismissedHints: string[]

  // Actions
  setSelectedRelease: (release: Release | null) => void
  setSearchTerm: (term: string) => void
  setActiveTab: (tab: string) => void
  dismissHint: (hintId: string) => void
  updateReleaseProgress: (releaseId: string, stepId: string, completed: boolean) => void
  markTaskComplete: (releaseId: string, taskId: string) => void
}

export const useReleaseStore = create<ReleaseStore>((set, get) => ({
  releases: mockReleases,
  selectedRelease: mockReleases[0],
  searchTerm: "",
  activeTab: "overview",
  dismissedHints: [],

  setSelectedRelease: (release) => set({ selectedRelease: release }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  dismissHint: (hintId) =>
    set((state) => ({
      dismissedHints: [...state.dismissedHints, hintId],
    })),

  updateReleaseProgress: (releaseId, stepId, completed) =>
    set((state) => {
      const releases = state.releases.map((release) => {
        if (release.id === releaseId) {
          const timeline = release.timeline.map((step) => {
            if (step.id === stepId) {
              return { ...step, completed }
            }
            return step
          })

          // Recalculate progress
          const totalTasks = timeline.reduce((acc, step) => acc + step.tasks.length, 0)
          const completedTasks = timeline.reduce(
            (acc, step) => acc + step.tasks.filter((task) => task.completed).length,
            0,
          )
          const progress = Math.round((completedTasks / totalTasks) * 100)

          return { ...release, timeline, progress }
        }
        return release
      })

      return {
        releases,
        selectedRelease:
          state.selectedRelease?.id === releaseId
            ? releases.find((r) => r.id === releaseId) || null
            : state.selectedRelease,
      }
    }),

  markTaskComplete: (releaseId, taskId) =>
    set((state) => {
      const releases = state.releases.map((release) => {
        if (release.id === releaseId) {
          const timeline = release.timeline.map((step) => ({
            ...step,
            tasks: step.tasks.map((task) => (task.id === taskId ? { ...task, completed: true } : task)),
          }))

          // Recalculate progress
          const totalTasks = timeline.reduce((acc, step) => acc + step.tasks.length, 0)
          const completedTasks = timeline.reduce(
            (acc, step) => acc + step.tasks.filter((task) => task.completed).length,
            0,
          )
          const progress = Math.round((completedTasks / totalTasks) * 100)

          return { ...release, timeline, progress }
        }
        return release
      })

      return {
        releases,
        selectedRelease:
          state.selectedRelease?.id === releaseId
            ? releases.find((r) => r.id === releaseId) || null
            : state.selectedRelease,
      }
    }),
}))
