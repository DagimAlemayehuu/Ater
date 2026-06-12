import { create } from 'zustand'
import type { ArtifactChapter, InteractiveArtifact, SandboxRuntimeError } from './types'

interface ArtifactStore {
  artifacts: InteractiveArtifact[]
  activeArtifactId: string | null
  activeVersionByArtifact: Record<string, number>
  activeChapterByArtifact: Record<string, number>
  isPanelOpen: boolean
  panelWidth: number
  repairAttemptsByArtifact: Record<string, number>
  iframeErrorsByArtifact: Record<string, SandboxRuntimeError>
  isRepairingByArtifact: Record<string, boolean>
  registerArtifacts: (artifacts: InteractiveArtifact[]) => void
  addVersion: (artifactId: string, chapters: ArtifactChapter[], raw: string) => void
  setActiveArtifact: (artifactId: string) => void
  setActiveVersion: (artifactId: string, version: number) => void
  setActiveChapter: (artifactId: string, chapterIndex: number) => void
  setPanelOpen: (open: boolean) => void
  setPanelWidth: (width: number) => void
  recordIframeError: (error: SandboxRuntimeError) => void
  incrementRepairAttempts: (artifactId: string) => number
  setRepairing: (artifactId: string, repairing: boolean) => void
  clearRepairState: (artifactId: string) => void
  resetArtifacts: () => void
}

const initialState = {
  artifacts: [] as InteractiveArtifact[],
  activeArtifactId: null as string | null,
  activeVersionByArtifact: {} as Record<string, number>,
  activeChapterByArtifact: {} as Record<string, number>,
  isPanelOpen: false,
  panelWidth: 64,
  repairAttemptsByArtifact: {} as Record<string, number>,
  iframeErrorsByArtifact: {} as Record<string, SandboxRuntimeError>,
  isRepairingByArtifact: {} as Record<string, boolean>,
}

const clampPanelWidth = (width: number) => Math.max(0, Math.min(70, width))
const last = <T,>(items: T[]): T | undefined => items[items.length - 1]

export const useArtifactStore = create<ArtifactStore>((set, get) => ({
  ...initialState,

  registerArtifacts: (incoming) => {
    if (incoming.length === 0) return
    set((state) => {
      const nextArtifacts = [...state.artifacts]
      const activeVersionByArtifact = { ...state.activeVersionByArtifact }
      const activeChapterByArtifact = { ...state.activeChapterByArtifact }

      for (const artifact of incoming) {
        const existingIndex = nextArtifacts.findIndex((item) => item.id === artifact.id)
        if (existingIndex >= 0) {
          nextArtifacts[existingIndex] = artifact
        } else {
          nextArtifacts.push(artifact)
        }
        activeVersionByArtifact[artifact.id] = last(artifact.versions)?.version || 1
        activeChapterByArtifact[artifact.id] = activeChapterByArtifact[artifact.id] || 0
      }

      const activeArtifactId = last(incoming)?.id || state.activeArtifactId

      return {
        artifacts: nextArtifacts,
        activeArtifactId,
        activeVersionByArtifact,
        activeChapterByArtifact,
        isPanelOpen: true,
        panelWidth: state.panelWidth <= 0 ? 64 : Math.max(state.panelWidth, 48),
      }
    })
  },

  addVersion: (artifactId, chapters, raw) => {
    set((state) => {
      const artifacts = state.artifacts.map((artifact) => {
        if (artifact.id !== artifactId) return artifact
        const nextVersion = (last(artifact.versions)?.version || 0) + 1
        return {
          ...artifact,
          versions: [...artifact.versions, { version: nextVersion, chapters, raw }],
        }
      })
      const artifact = artifacts.find((item) => item.id === artifactId)
      const version = artifact ? last(artifact.versions)?.version || 1 : 1
      return {
        artifacts,
        activeArtifactId: artifactId,
        activeVersionByArtifact: { ...state.activeVersionByArtifact, [artifactId]: version },
        activeChapterByArtifact: { ...state.activeChapterByArtifact, [artifactId]: 0 },
        isPanelOpen: true,
      }
    })
  },

  setActiveArtifact: (artifactId) => set({ activeArtifactId: artifactId, isPanelOpen: true }),
  setActiveVersion: (artifactId, version) =>
    set((state) => ({
      activeVersionByArtifact: { ...state.activeVersionByArtifact, [artifactId]: version },
      activeChapterByArtifact: { ...state.activeChapterByArtifact, [artifactId]: 0 },
    })),
  setActiveChapter: (artifactId, chapterIndex) =>
    set((state) => ({
      activeChapterByArtifact: { ...state.activeChapterByArtifact, [artifactId]: Math.max(0, chapterIndex) },
    })),
  setPanelOpen: (open) => set({ isPanelOpen: open, panelWidth: open ? Math.max(get().panelWidth, 48) : 0 }),
  setPanelWidth: (width) => set({ panelWidth: clampPanelWidth(width), isPanelOpen: width > 0 }),
  recordIframeError: (error) =>
    set((state) => ({
      iframeErrorsByArtifact: { ...state.iframeErrorsByArtifact, [error.artifactId]: error },
    })),
  incrementRepairAttempts: (artifactId) => {
    const current = get().repairAttemptsByArtifact[artifactId] || 0
    const next = Math.min(3, current + 1)
    set((state) => ({
      repairAttemptsByArtifact: { ...state.repairAttemptsByArtifact, [artifactId]: next },
    }))
    return next
  },
  setRepairing: (artifactId, repairing) =>
    set((state) => ({
      isRepairingByArtifact: { ...state.isRepairingByArtifact, [artifactId]: repairing },
    })),
  clearRepairState: (artifactId) =>
    set((state) => {
      const repairAttemptsByArtifact = { ...state.repairAttemptsByArtifact }
      const iframeErrorsByArtifact = { ...state.iframeErrorsByArtifact }
      const isRepairingByArtifact = { ...state.isRepairingByArtifact }
      delete repairAttemptsByArtifact[artifactId]
      delete iframeErrorsByArtifact[artifactId]
      delete isRepairingByArtifact[artifactId]
      return { repairAttemptsByArtifact, iframeErrorsByArtifact, isRepairingByArtifact }
    }),
  resetArtifacts: () => set({ ...initialState }),
}))
