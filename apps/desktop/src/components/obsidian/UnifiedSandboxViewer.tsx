import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Code2, Eye, Loader2, PanelRightClose, RotateCcw, WifiOff } from 'lucide-react'
import { AterMarkdown } from './MarkdownViewer'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import { useArtifactStore } from '@/lib/artifacts/store'
import type { ArtifactChapter, SandboxRuntimeError, InteractiveArtifact, ArtifactVersion } from '@/lib/artifacts/types'
import { buildSandboxSrcDoc } from '@/lib/artifacts/sandbox'
import { useTheme } from '@/context/theme-provider'
import { useLocation, useSearchParams } from 'react-router-dom'
import { updateProperty } from '@/lib/markdownHelper'

const last = <T,>(items: T[]): T | undefined => items[items.length - 1]

const parseRepairChapters = (code: string, fallback: ArtifactChapter[]): ArtifactChapter[] => {
  return fallback.map((chapter, index) => ({
    ...chapter,
    id: `${chapter.id}-repair-${Date.now()}-${index}`,
    sandbox: code,
  }))
}

interface UnifiedSandboxViewerProps {
  shielded?: boolean
  onClose?: () => void
  customArtifacts?: InteractiveArtifact[]
}

export function UnifiedSandboxViewer({ shielded = false, onClose, customArtifacts }: UnifiedSandboxViewerProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { resolvedTheme } = useTheme()
  
  const isNoteRoute = location.pathname.includes('/obsidian')
  const notePath = searchParams.get('path')

  const {
    artifacts: storeArtifacts,
    activeArtifactId: storeActiveArtifactId,
    activeVersionByArtifact: storeActiveVersionByArtifact,
    activeChapterByArtifact: storeActiveChapterByArtifact,
    iframeErrorsByArtifact: storeIframeErrorsByArtifact,
    isRepairingByArtifact: storeIsRepairingByArtifact,
    compileErrorsByArtifact: storeCompileErrorsByArtifact,
    setActiveArtifact: storeSetActiveArtifact,
    setActiveVersion: storeSetActiveVersion,
    setActiveChapter: storeSetActiveChapter,
    setPanelOpen: storeSetPanelOpen,
    recordIframeError: storeRecordIframeError,
    incrementRepairAttempts: storeIncrementRepairAttempts,
    setRepairing: storeSetRepairing,
    addVersion: storeAddVersion,
    recordCompileError: storeRecordCompileError,
  } = useArtifactStore()

  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSidecarHealthy, setIsSidecarHealthy] = useState(true)
  const [savedState, setSavedState] = useState<any>(null)
  const [noteContentText, setNoteContentText] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const compilingSpecsRef = useRef<Set<string>>(new Set())


  const artifacts = customArtifacts || storeArtifacts
  
  // Set up local states for custom/isolated mode
  const [localActiveArtifactId, setLocalActiveArtifactId] = useState<string | null>(null)
  const [localActiveVersionByArtifact, setLocalActiveVersionByArtifact] = useState<Record<string, number>>({})
  const [localActiveChapterByArtifact, setLocalActiveChapterByArtifact] = useState<Record<string, number>>({})
  const [localIframeErrors, setLocalIframeErrors] = useState<Record<string, SandboxRuntimeError>>({})
  const [localIsRepairing, setLocalIsRepairing] = useState<Record<string, boolean>>({})
  const [localRepairAttempts, setLocalRepairAttempts] = useState<Record<string, number>>({})
  const [localVersions, setLocalVersions] = useState<Record<string, ArtifactVersion[]>>({})
  const [localCompileErrors, setLocalCompileErrors] = useState<Record<string, string>>({})

  // Compute active states
  const activeArtifactId = customArtifacts 
    ? (localActiveArtifactId || customArtifacts[0]?.id || null) 
    : storeActiveArtifactId

  const activeVersionByArtifact = customArtifacts 
    ? localActiveVersionByArtifact 
    : storeActiveVersionByArtifact

  const activeChapterByArtifact = customArtifacts 
    ? localActiveChapterByArtifact 
    : storeActiveChapterByArtifact

  const iframeErrorsByArtifact = customArtifacts
    ? localIframeErrors
    : storeIframeErrorsByArtifact

  const isRepairingByArtifact = customArtifacts
    ? localIsRepairing
    : storeIsRepairingByArtifact

  const compileErrorsByArtifact = customArtifacts
    ? localCompileErrors
    : storeCompileErrorsByArtifact

  // Setters
  const setActiveArtifact = (id: string) => {
    if (customArtifacts) setLocalActiveArtifactId(id)
    else storeSetActiveArtifact(id)
  }
  const setActiveVersion = (artifactId: string, version: number) => {
    if (customArtifacts) {
      setLocalActiveVersionByArtifact(prev => ({ ...prev, [artifactId]: version }))
    } else {
      storeSetActiveVersion(artifactId, version)
    }
  }
  const setActiveChapter = (artifactId: string, chapterIndex: number) => {
    if (customArtifacts) {
      setLocalActiveChapterByArtifact(prev => ({ ...prev, [artifactId]: chapterIndex }))
    } else {
      storeSetActiveChapter(artifactId, chapterIndex)
    }
  }
  const setPanelOpen = (open: boolean) => {
    if (!customArtifacts) storeSetPanelOpen(open)
  }
  const recordIframeError = (err: SandboxRuntimeError) => {
    if (customArtifacts) {
      setLocalIframeErrors(prev => ({ ...prev, [err.artifactId]: err }))
    } else {
      storeRecordIframeError(err)
    }
  }
  const incrementRepairAttempts = (artifactId: string) => {
    if (customArtifacts) {
      const next = (localRepairAttempts[artifactId] || 0) + 1
      setLocalRepairAttempts(prev => ({ ...prev, [artifactId]: next }))
      return next
    } else {
      return storeIncrementRepairAttempts(artifactId)
    }
  }
  const setRepairing = (artifactId: string, repairing: boolean) => {
    if (customArtifacts) {
      setLocalIsRepairing(prev => ({ ...prev, [artifactId]: repairing }))
    } else {
      storeSetRepairing(artifactId, repairing)
    }
  }
  const addVersion = (artifactId: string, chapters: ArtifactChapter[], raw: string, messageIndex?: number) => {
    if (customArtifacts) {
      const currentArt = artifacts.find(a => a.id === artifactId)
      if (currentArt) {
        const nextVersionNum = (last(currentArt.versions)?.version || 0) + 1
        const newVersion: ArtifactVersion = {
          version: nextVersionNum,
          chapters,
          raw,
          messageIndex
        }
        setLocalVersions(prev => ({
          ...prev,
          [artifactId]: [...(prev[artifactId] || currentArt.versions), newVersion]
        }))
        setLocalActiveVersionByArtifact(prev => ({ ...prev, [artifactId]: nextVersionNum }))
        setLocalActiveChapterByArtifact(prev => ({ ...prev, [artifactId]: 0 }))
      }
    } else {
      storeAddVersion(artifactId, chapters, raw, messageIndex)
    }
  }

  const activeArtifact = useMemo(() => {
    const art = artifacts.find((artifact) => artifact.id === activeArtifactId) || artifacts[0]
    if (art && customArtifacts && localVersions[art.id]) {
      return {
        ...art,
        versions: localVersions[art.id]
      }
    }
    return art
  }, [artifacts, activeArtifactId, customArtifacts, localVersions])

  const activeVersionNumber = activeArtifact ? activeVersionByArtifact[activeArtifact.id] || last(activeArtifact.versions)?.version || 1 : 1
  const activeVersion = activeArtifact?.versions.find((version) => version.version === activeVersionNumber) || (activeArtifact ? last(activeArtifact.versions) : undefined)
  const activeChapterIndex = activeArtifact ? activeChapterByArtifact[activeArtifact.id] || 0 : 0
  const chapters = activeVersion?.chapters || []
  const activeChapter = chapters[Math.min(activeChapterIndex, Math.max(chapters.length - 1, 0))]
  const error = activeArtifact ? iframeErrorsByArtifact[activeArtifact.id] : undefined
  const isRepairing = activeArtifact ? isRepairingByArtifact[activeArtifact.id] : false
  const compileError = activeArtifact ? compileErrorsByArtifact[activeArtifact.id] : undefined

  const sandboxCode = activeChapter?.sandbox || ''
  const isSandboxChapter = Boolean(sandboxCode || activeChapter?.sandboxSpec)
  const rawCode = useMemo(() => activeVersion?.raw || sandboxCode || '', [activeVersion?.raw, sandboxCode])

  // Check network and sidecar health on mount and periodic interval
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const checkHealth = async () => {
      try {
        const res = await sidecarApi.health()
        setIsSidecarHealthy(res.status === 'ok')
      } catch {
        setIsSidecarHealthy(false)
      }
    }
    
    checkHealth()
    const timer = setInterval(checkHealth, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(timer)
    }
  }, [])

  // Load saved state from frontmatter if on note-viewing route
  useEffect(() => {
    if (isNoteRoute && notePath) {
      sidecarApi.readObsidianNote(notePath).then((res) => {
        setNoteContentText(res.content || '')
        const stateStr = res.metadata?.state || res.metadata?.State
        if (stateStr) {
          try {
            setSavedState(JSON.parse(stateStr))
          } catch (e) {
            console.error('Failed to parse saved state from note frontmatter:', e)
          }
        } else {
          setSavedState(null)
        }
      }).catch(() => {
        setSavedState(null)
        setNoteContentText('')
      })
    } else {
      setSavedState(null)
      setNoteContentText('')
    }
  }, [notePath, isNoteRoute])

  const updateFrontmatterProperty = async (path: string, key: string, value: any) => {
    try {
      const noteData = await sidecarApi.readObsidianNote(path)
      const content = noteData.content ?? ''
      const newFileContent = updateProperty(content, key, value)
      await sidecarApi.updateObsidianNote(path, newFileContent)
    } catch (err) {
      console.error('Failed to update sandbox parameter in note frontmatter:', err)
    }
  }

  // Handle postMessage events for runtime errors & state changes
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      if (!event.data) return

      if (event.data.type === 'ater:sandbox-state-change') {
        const { state } = event.data
        if (isNoteRoute && notePath) {
          const stateStr = JSON.stringify(state)
          if (stateStr.length <= 500) {
            updateFrontmatterProperty(notePath, 'state', stateStr)
          }
        }
        return
      }

      if (event.data.type !== 'ater:sandbox-error') return
      const runtimeError = event.data as SandboxRuntimeError & { type: string }
      if (!runtimeError.artifactId) return
      if (runtimeError.message === 'Script error.' || runtimeError.message?.includes('Script error')) return
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
  }, [addVersion, artifacts, incrementRepairAttempts, recordIframeError, setRepairing, isNoteRoute, notePath])

  const srcDoc = useMemo(() => {
    if (!activeArtifact || !activeVersion || !activeChapter) return ''
    return buildSandboxSrcDoc(sandboxCode, {
      artifactId: activeArtifact.id,
      version: activeVersion.version,
      theme: resolvedTheme,
      state: savedState
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandboxCode, activeArtifact?.id, activeVersion?.version, savedState, resolvedTheme, activeArtifact, activeVersion, activeChapter])

  // Synchronize theme state instantly with the iframe
  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'ater:set-theme',
        theme: resolvedTheme
      }, '*')
    }
  }, [resolvedTheme])

  // Auto-compile sandbox specs when they lack sandbox HTML code
  useEffect(() => {
    if (!activeArtifact || !activeChapter || !activeChapter.sandboxSpec || sandboxCode) {
      return
    }

    const artifactId = activeArtifact.id
    const spec = activeChapter.sandboxSpec
    const chapterId = activeChapter.id
    const key = `${artifactId}:${chapterId}:${spec}`

    if (compilingSpecsRef.current.has(key)) return
    compilingSpecsRef.current.add(key)

    // Clear compile error when starting
    if (customArtifacts) {
      setLocalCompileErrors(prev => {
        const next = { ...prev }
        delete next[artifactId]
        return next
      })
    } else {
      storeRecordCompileError(artifactId, null)
    }

    const checkAndGenerate = async () => {
      const isOnline = navigator.onLine
      if (!isOnline) {
        const errMsg = "Browser is offline. Connect to the internet to compile."
        if (customArtifacts) setLocalCompileErrors(prev => ({ ...prev, [artifactId]: errMsg }))
        else storeRecordCompileError(artifactId, errMsg)
        compilingSpecsRef.current.delete(key)
        return
      }
      try {
        const health = await sidecarApi.health()
        if (health.status !== 'ok') {
          const errMsg = "FastAPI sidecar service is unhealthy."
          if (customArtifacts) setLocalCompileErrors(prev => ({ ...prev, [artifactId]: errMsg }))
          else storeRecordCompileError(artifactId, errMsg)
          compilingSpecsRef.current.delete(key)
          return
        }
      } catch {
        const errMsg = "FastAPI sidecar service is unreachable."
        if (customArtifacts) setLocalCompileErrors(prev => ({ ...prev, [artifactId]: errMsg }))
        else storeRecordCompileError(artifactId, errMsg)
        compilingSpecsRef.current.delete(key)
        return
      }

      sidecarApi.generateArtifactCode({
        prompt: spec,
        context: noteContentText || activeChapter.content || '',
        previous_code: ''
      }).then((result) => {
        const code = result.code || result.answer || ''
        if (!code) {
          const errMsg = "FastAPI sidecar generated empty code."
          if (customArtifacts) setLocalCompileErrors(prev => ({ ...prev, [artifactId]: errMsg }))
          else storeRecordCompileError(artifactId, errMsg)
          return
        }
        
        // Save the generated code
        const nextChapters = chapters.map(c => c.id === chapterId ? { ...c, sandbox: code } : c)
        addVersion(artifactId, nextChapters, code)
      }).catch((err) => {
        const errMsg = err?.message || "Failed to generate sandbox code."
        if (customArtifacts) setLocalCompileErrors(prev => ({ ...prev, [artifactId]: errMsg }))
        else storeRecordCompileError(artifactId, errMsg)
      }).finally(() => {
        compilingSpecsRef.current.delete(key)
      })
    }

    checkAndGenerate()
  }, [activeArtifact?.id, activeChapter?.id, activeChapter?.sandboxSpec, sandboxCode, noteContentText, chapters, addVersion, customArtifacts, storeRecordCompileError])

  if (!activeArtifact || !activeVersion || !activeChapter) {
    return (
      <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 bg-bento-bg border-l border-border">
        No simulator active
      </div>
    )
  }

  const goToChapter = (direction: -1 | 1) => {
    setActiveChapter(activeArtifact.id, Math.max(0, Math.min(chapters.length - 1, activeChapterIndex + direction)))
  }

  const handleOfflineRetry = async () => {
    setIsOnline(navigator.onLine)
    try {
      const res = await sidecarApi.health()
      setIsSidecarHealthy(res.status === 'ok')
    } catch {
      setIsSidecarHealthy(false)
    }

    if (activeArtifact) {
      if (customArtifacts) {
        setLocalCompileErrors(prev => {
          const next = { ...prev }
          delete next[activeArtifact.id]
          return next
        })
      } else {
        storeRecordCompileError(activeArtifact.id, null)
      }
    }
  }

  const showOfflineWarning = !sandboxCode && activeChapter.sandboxSpec && (!isOnline || !isSidecarHealthy)

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-border bg-bento-bg">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/50">Simulator Sandbox</div>
          <h3 className="truncate text-[13px] font-black uppercase tracking-wide text-foreground">{activeArtifact.title}</h3>
        </div>
        <button
          onClick={() => {
            if (onClose) onClose()
            else setPanelOpen(false)
          }}
          className="grid size-8 place-items-center rounded-[6px] text-muted-foreground/60 hover:bg-accent hover:text-foreground"
          title="Collapse sandbox panel"
        >
          <PanelRightClose size={15} />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <select
          value={activeArtifact.id}
          onChange={(event) => setActiveArtifact(event.target.value)}
          className="h-8 min-w-0 flex-1 rounded-[6px] border border-border bg-bento-card px-2 text-[10px] font-bold uppercase tracking-wider text-foreground"
        >
          {artifacts.map((artifact) => (
            <option key={artifact.id} value={artifact.id}>{artifact.title}</option>
          ))}
        </select>
        <select
          value={activeVersion.version}
          onChange={(event) => setActiveVersion(activeArtifact.id, Number(event.target.value))}
          className="h-8 rounded-[6px] border border-border bg-bento-card px-2 text-[10px] font-bold uppercase tracking-wider text-foreground"
        >
          {activeArtifact.versions.map((version) => (
            <option key={version.version} value={version.version}>v{version.version}</option>
          ))}
        </select>
        <div className="flex rounded-[6px] border border-border bg-bento-card p-0.5">
          <button
            onClick={() => setMode('preview')}
            className={cn('grid size-7 place-items-center rounded-[4px]', mode === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            title="Preview"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={() => setMode('code')}
            className={cn('grid size-7 place-items-center rounded-[4px]', mode === 'code' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            title="Code"
          >
            <Code2 size={13} />
          </button>
        </div>
      </div>

      {(isRepairing || error) && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-amber-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
          {isRepairing ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
          {isRepairing ? 'Self-healing in progress...' : `Runtime error: ${error?.message || 'Sandbox failed'}`}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === 'preview' ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-border px-5 py-4 bg-muted/5">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Chapter {activeChapterIndex + 1} / {chapters.length}
              </div>
              <h4 className="mt-1 text-[15px] font-black uppercase tracking-wide text-foreground">{activeChapter.title}</h4>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7 custom-scrollbar bg-background">
              <div className="mx-auto max-w-3xl space-y-6">
                {/* 1. Explanation Text */}
                {activeChapter.content ? (
                  <div className="text-[15px] leading-relaxed text-foreground/90 font-outfit">
                    <AterMarkdown content={activeChapter.content} />
                  </div>
                ) : (
                  <p className="text-muted-foreground/70 text-[10px] font-black uppercase tracking-widest">No lesson text available for this chapter.</p>
                )}

                {/* 2. Inline Visual Simulator */}
                {isSandboxChapter && (
                  <div className="mt-8 space-y-4">
                    <div className="border-t border-border/40 pt-6">
                      <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">
                        Interactive Visual Simulator
                      </div>

                      {compileError ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center border border-border bg-bento-card rounded-[8px] space-y-3">
                          <AlertTriangle className="text-destructive" size={24} />
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Compilation Failed</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase max-w-md leading-relaxed">
                              {compileError}
                            </p>
                          </div>
                          <button
                            onClick={handleOfflineRetry}
                            className="h-8 px-4 rounded-[6px] border border-border bg-bento-card hover:bg-accent text-[9px] font-black uppercase tracking-widest text-foreground transition-none shadow-sm"
                          >
                            Retry Connection
                          </button>
                        </div>
                      ) : showOfflineWarning ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center border border-border bg-bento-card rounded-[8px] space-y-3">
                          <WifiOff className="text-destructive" size={24} />
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Offline Connection Required</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase max-w-md leading-relaxed">
                              Internet connectivity and a running sidecar service are required to compile and generate new interactive simulators.
                            </p>
                          </div>
                          <button
                            onClick={handleOfflineRetry}
                            className="h-8 px-4 rounded-[6px] border border-border bg-bento-card hover:bg-accent text-[9px] font-black uppercase tracking-widest text-foreground transition-none shadow-sm"
                          >
                            Retry Connection
                          </button>
                        </div>
                      ) : sandboxCode ? (
                        <div className="relative border border-border rounded-[8px] overflow-hidden bg-bento-bg h-[520px] w-full shadow-sm">
                          {shielded && <div className="absolute inset-0 z-10 cursor-col-resize bg-transparent" />}
                          <iframe
                            ref={iframeRef}
                            title="Interactive sandbox"
                            srcDoc={srcDoc}
                            sandbox="allow-scripts"
                            className="h-full w-full border-0 bg-bento-bg"
                          />
                        </div>
                      ) : activeChapter.sandboxSpec ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-border bg-bento-card rounded-[8px] min-h-[200px]">
                          <Loader2 className="w-6 h-6 animate-spin text-primary/40 mb-3" />
                          <div className="text-center max-w-sm space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Compiling simulator...</div>
                            <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/60 truncate italic">
                              "{activeChapter.sandboxSpec}"
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <pre className="h-full overflow-auto bg-bento-bg p-4 text-[11px] leading-relaxed text-foreground border-b border-border">{rawCode}</pre>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-3">
        <button
          onClick={() => goToChapter(-1)}
          disabled={activeChapterIndex === 0}
          className="flex h-8 items-center gap-1 rounded-[6px] border border-border px-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground disabled:opacity-30 hover:bg-accent/40"
        >
          <ChevronLeft size={13} /> Back
        </button>
        <button
          onClick={() => setMode('preview')}
          className="grid size-8 place-items-center rounded-[6px] border border-border text-muted-foreground hover:text-foreground hover:bg-accent/40"
          title="Retry preview"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => goToChapter(1)}
          disabled={activeChapterIndex >= chapters.length - 1}
          className="flex h-8 items-center gap-1 rounded-[6px] border border-border px-3 text-[9px] font-black uppercase tracking-widest text-foreground disabled:opacity-30 hover:bg-accent/40"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </aside>
  )
}
