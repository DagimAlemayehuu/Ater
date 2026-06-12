import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Code2, Eye, Loader2, PanelRightClose, RotateCcw } from 'lucide-react'
import { AterMarkdown } from './MarkdownViewer'
import { SandboxIFrame } from './SandboxIFrame'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import { useArtifactStore } from '@/lib/artifacts/store'
import type { ArtifactChapter, SandboxRuntimeError } from '@/lib/artifacts/types'

const last = <T,>(items: T[]): T | undefined => items[items.length - 1]

const parseRepairChapters = (code: string, fallback: ArtifactChapter[]): ArtifactChapter[] => {
  return fallback.map((chapter, index) => ({
    ...chapter,
    id: `${chapter.id}-repair-${Date.now()}-${index}`,
    sandbox: code,
  }))
}

interface ArtifactViewerProps {
  shielded?: boolean
}

export function ArtifactViewer({ shielded = false }: ArtifactViewerProps) {
  const {
    artifacts,
    activeArtifactId,
    activeVersionByArtifact,
    activeChapterByArtifact,
    iframeErrorsByArtifact,
    isRepairingByArtifact,
    setActiveArtifact,
    setActiveVersion,
    setActiveChapter,
    setPanelOpen,
    recordIframeError,
    incrementRepairAttempts,
    setRepairing,
    addVersion,
  } = useArtifactStore()
  const [mode, setMode] = useState<'preview' | 'code'>('preview')

  const activeArtifact = artifacts.find((artifact) => artifact.id === activeArtifactId) || artifacts[0]
  const activeVersionNumber = activeArtifact ? activeVersionByArtifact[activeArtifact.id] || last(activeArtifact.versions)?.version || 1 : 1
  const activeVersion = activeArtifact?.versions.find((version) => version.version === activeVersionNumber) || (activeArtifact ? last(activeArtifact.versions) : undefined)
  const activeChapterIndex = activeArtifact ? activeChapterByArtifact[activeArtifact.id] || 0 : 0
  const chapters = activeVersion?.chapters || []
  const activeChapter = chapters[Math.min(activeChapterIndex, Math.max(chapters.length - 1, 0))]
  const error = activeArtifact ? iframeErrorsByArtifact[activeArtifact.id] : undefined
  const isRepairing = activeArtifact ? isRepairingByArtifact[activeArtifact.id] : false

  const sandboxCode = activeChapter?.sandbox || ''
  const isSandboxChapter = Boolean(sandboxCode || activeChapter?.sandboxSpec)
  const rawCode = useMemo(() => activeVersion?.raw || sandboxCode || '', [activeVersion?.raw, sandboxCode])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'ater:sandbox-error') return
      const runtimeError = event.data as SandboxRuntimeError & { type: string }
      if (!runtimeError.artifactId) return
      recordIframeError(runtimeError)
      const attempts = incrementRepairAttempts(runtimeError.artifactId)
      const artifact = artifacts.find((item) => item.id === runtimeError.artifactId)
      const version = artifact?.versions.find((item) => item.version === runtimeError.version) || (artifact ? last(artifact.versions) : undefined)
      const chapter = version?.chapters.find((item) => item.sandbox) || version?.chapters[0]

      if (!artifact || !chapter || !chapter.sandbox || attempts >= 3) {
        setMode('code')
        return
      }

      setRepairing(runtimeError.artifactId, true)
      sidecarApi.repairArtifactCode({
        code: chapter.sandbox,
        error: runtimeError.message,
        stack: runtimeError.stack || '',
      }).then((result) => {
        const repaired = result.code || result.answer || ''
        if (repaired) {
          addVersion(runtimeError.artifactId, parseRepairChapters(repaired, version?.chapters || [chapter]), repaired)
          setMode('preview')
        }
      }).catch(() => {
        setMode('code')
      }).finally(() => {
        setRepairing(runtimeError.artifactId, false)
      })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [addVersion, artifacts, incrementRepairAttempts, recordIframeError, setRepairing])

  if (!activeArtifact || !activeVersion || !activeChapter) {
    return (
      <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
        No artifact active
      </div>
    )
  }

  const goToChapter = (direction: -1 | 1) => {
    setActiveChapter(activeArtifact.id, Math.max(0, Math.min(chapters.length - 1, activeChapterIndex + direction)))
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border bg-[#111113]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#242426] px-4 py-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/50">Artifact</div>
          <h3 className="truncate text-[13px] font-black uppercase tracking-wide text-foreground">{activeArtifact.title}</h3>
        </div>
        <button
          onClick={() => setPanelOpen(false)}
          className="grid size-8 place-items-center rounded-[6px] text-muted-foreground/60 hover:bg-white/5 hover:text-foreground"
          title="Collapse artifact panel"
        >
          <PanelRightClose size={15} />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#242426] px-4 py-2">
        <select
          value={activeArtifact.id}
          onChange={(event) => setActiveArtifact(event.target.value)}
          className="h-8 min-w-0 flex-1 rounded-[6px] border border-[#242426] bg-[#18181b] px-2 text-[10px] font-bold uppercase tracking-wider text-foreground"
        >
          {artifacts.map((artifact) => (
            <option key={artifact.id} value={artifact.id}>{artifact.title}</option>
          ))}
        </select>
        <select
          value={activeVersion.version}
          onChange={(event) => setActiveVersion(activeArtifact.id, Number(event.target.value))}
          className="h-8 rounded-[6px] border border-[#242426] bg-[#18181b] px-2 text-[10px] font-bold uppercase tracking-wider text-foreground"
        >
          {activeArtifact.versions.map((version) => (
            <option key={version.version} value={version.version}>v{version.version}</option>
          ))}
        </select>
        <div className="flex rounded-[6px] border border-[#242426] bg-[#18181b] p-0.5">
          <button
            onClick={() => setMode('preview')}
            className={cn('grid size-7 place-items-center rounded-[4px]', mode === 'preview' ? 'bg-foreground text-background' : 'text-muted-foreground')}
            title="Preview"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={() => setMode('code')}
            className={cn('grid size-7 place-items-center rounded-[4px]', mode === 'code' ? 'bg-foreground text-background' : 'text-muted-foreground')}
            title="Code"
          >
            <Code2 size={13} />
          </button>
        </div>
      </div>

      {(isRepairing || error) && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[#242426] bg-amber-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
          {isRepairing ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
          {isRepairing ? 'Self-healing in progress...' : `Runtime error: ${error?.message || 'Sandbox failed'}`}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === 'preview' ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-[#242426] px-5 py-4">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Chapter {activeChapterIndex + 1} / {chapters.length}
              </div>
              <h4 className="mt-1 text-[15px] font-black uppercase tracking-wide text-foreground">{activeChapter.title}</h4>
              {isSandboxChapter && activeChapter.content && (
                <div className="mt-2 max-h-32 overflow-y-auto text-[12px] text-foreground/75">
                  <AterMarkdown content={activeChapter.content} />
                </div>
              )}
            </div>
            <div className="min-h-0 flex-1">
              {sandboxCode ? (
                <SandboxIFrame code={sandboxCode} artifactId={activeArtifact.id} version={activeVersion.version} shielded={shielded} />
              ) : activeChapter.sandboxSpec ? (
                <div className="m-4 border border-dashed border-[#3f3f46] p-6 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Generating sandbox for {activeChapter.sandboxSpec}
                </div>
              ) : (
                <article className="h-full overflow-y-auto px-8 py-7 text-[17px] leading-8 text-foreground/85">
                  <div className="mx-auto max-w-4xl">
                    {activeChapter.content ? (
                      <AterMarkdown content={activeChapter.content} />
                    ) : (
                      <p className="text-muted-foreground/70">No lesson text available for this chapter.</p>
                    )}
                  </div>
                </article>
              )}
            </div>
          </div>
        ) : (
          <pre className="h-full overflow-auto bg-[#0d0d0f] p-4 text-[11px] leading-relaxed text-zinc-200">{rawCode}</pre>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#242426] px-4 py-3">
        <button
          onClick={() => goToChapter(-1)}
          disabled={activeChapterIndex === 0}
          className="flex h-8 items-center gap-1 rounded-[6px] border border-[#242426] px-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground disabled:opacity-30"
        >
          <ChevronLeft size={13} /> Back
        </button>
        <button
          onClick={() => setMode('preview')}
          className="grid size-8 place-items-center rounded-[6px] border border-[#242426] text-muted-foreground hover:text-foreground"
          title="Retry preview"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => goToChapter(1)}
          disabled={activeChapterIndex >= chapters.length - 1}
          className="flex h-8 items-center gap-1 rounded-[6px] border border-[#242426] px-3 text-[9px] font-black uppercase tracking-widest text-foreground disabled:opacity-30"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </aside>
  )
}
