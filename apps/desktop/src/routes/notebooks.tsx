import React, { useState, useEffect, useRef } from 'react'
import { Loader2, ArrowRight, Download, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { fetchSidecarJson } from '@/lib/sidecarHttp'
import { invoke } from '@tauri-apps/api/core'
import { sidecarApi } from '@/lib/sidecarApi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getNotebookLMArtifactId,
  getNotebookLMArtifactLabel,
  getNotebookLMArtifactType,
  getNotebookLMDownloadFormat,
} from '@/lib/notebooklmArtifacts'

interface Notebook {
  id: string
  title: string
  created_at?: string
}

interface Source {
  id: string
  title: string
  source_type: string
  word_count?: number
}

interface StudioArtifact {
  artifact_id?: string
  artifactId?: string
  id?: string
  artifact_type?: string
  artifactType?: string
  type?: string
  kind?: string
  status: string
  title?: string
  name?: string
  created_at?: string
}

interface ArtifactPreview {
  url: string
  filename: string
  mediaType: string
  artifactType: string
}

export default function Notebooks() {
  const [sidecarPort, setSidecarPort] = useState<number>(8765)
  const [sidecarToken, setSidecarToken] = useState<string>('')
  
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null)
  
  const [sources, setSources] = useState<Source[]>([])
  const [studioArtifacts, setStudioArtifacts] = useState<StudioArtifact[]>([])
  const [savedQuizzes, setSavedQuizzes] = useState<any[]>([])
  const [savedFlashcards, setSavedFlashcards] = useState<any[]>([])
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'sources' | 'chat' | 'practice' | 'studio'>('sources')
  
  // Notebook CRUD states
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [isCreatingInCard, setIsCreatingInCard] = useState(false)
  const [newNotebookTitle, setNewNotebookTitle] = useState('')
  const [creating, setCreating] = useState(false)

  // Ingest / Upload state
  const [uploadType, setUploadType] = useState<'url' | 'text' | 'file' | 'drive' | null>(null)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploadText, setUploadText] = useState('')
  const [uploadTextTitle, setUploadTextTitle] = useState('')
  const [uploadDriveId, setUploadDriveId] = useState('')
  const [uploadDriveType, setUploadDriveType] = useState<'doc' | 'slides' | 'sheets' | 'pdf'>('doc')
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat state
  const [chatQuery, setChatQuery] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Studio form states (aligned with Google NotebookLM CLI actual options)
  const [artifactType, setArtifactType] = useState<string>('audio')
  const [studioLanguage, setStudioLanguage] = useState('')
  const [studioFocus, setStudioFocus] = useState('')
  const [studioSourceIds, setStudioSourceIds] = useState('')
  const [audioFormat, setAudioFormat] = useState('deep_dive')
  const [audioLength, setAudioLength] = useState('default')
  const [reportFormat, setReportFormat] = useState('Briefing Doc')
  const [customPrompt, setCustomPrompt] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [quizDifficulty, setQuizDifficulty] = useState(2)
  const [flashcardsDifficulty, setFlashcardsDifficulty] = useState('medium')
  const [slidesFormat, setSlidesFormat] = useState('detailed_deck')
  const [slidesLength, setSlidesLength] = useState('default')
  const [mindmapTitle, setMindmapTitle] = useState('Mind Map')
  const [infographicOrientation, setInfographicOrientation] = useState('landscape')
  const [infographicDetail, setInfographicDetail] = useState('standard')
  const [infographicStyle, setInfographicStyle] = useState('auto_select')
  const [videoFormat, setVideoFormat] = useState('explainer')
  const [videoStyle, setVideoStyle] = useState('auto_select')
  const [videoStylePrompt, setVideoStylePrompt] = useState('')
  const [dataTableDescription, setDataTableDescription] = useState('')
  const [artifactDownloadFormat, setArtifactDownloadFormat] = useState<Record<string, string>>({})
  const [generatingStudio, setGeneratingStudio] = useState(false)
  const [artifactPreview, setArtifactPreview] = useState<ArtifactPreview | null>(null)
  const [artifactActionLoading, setArtifactActionLoading] = useState<string | null>(null)

  // Active quiz/flashcard states
  const [activeQuiz, setActiveQuiz] = useState<any>(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizFinished, setQuizFinished] = useState(false)
  
  const [activeFlashcards, setActiveFlashcards] = useState<any>(null)
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [showCardBack, setShowCardBack] = useState(false)

  // Fetch Tauri Sidecar Config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const port = await invoke<number>('get_sidecar_port').catch(() => 8765)
        const token = await invoke<string>('get_sidecar_token').catch(() => '')
        setSidecarPort(port)
        setSidecarToken(token)
      } catch (err) {
        console.error('Error fetching Tauri sidecar config:', err)
      }
    }
    fetchConfig()
  }, [])

  // Once sidecarPort is resolved, fetch notebooks
  useEffect(() => {
    if (sidecarPort) {
      loadNotebooks()
    }
  }, [sidecarPort, sidecarToken])

  // Fetch notebook detail resources when selection changes
  useEffect(() => {
    if (selectedNotebook) {
      loadNotebookDetails(selectedNotebook.id)
      setChatMessages([])
      setConversationId(null)
      // Reset active practice sessions
      setActiveQuiz(null)
      setActiveFlashcards(null)
    } else {
      setSources([])
      setStudioArtifacts([])
      setSavedQuizzes([])
      setSavedFlashcards([])
    }
  }, [selectedNotebook])

  const request = async (path: string, options: RequestInit = {}) => {
    const url = `http://127.0.0.1:${sidecarPort}/api/notebooklm${path}`
    const headers = {
      ...(options.headers || {}),
      'X-Ater-Token': sidecarToken,
      'Content-Type': 'application/json'
    }
    // Set explicit timeoutMs to 30000ms to resolve sidecar slow CLI timeout errors
    return fetchSidecarJson(url, { ...options, headers }, fetch, 30000)
  }

  const getArtifactId = getNotebookLMArtifactId
  const getArtifactType = getNotebookLMArtifactType
  const getArtifactLabel = getNotebookLMArtifactLabel
  const getDownloadFormat = (artifact: StudioArtifact) => getNotebookLMDownloadFormat(artifact, artifactDownloadFormat)

  const fetchArtifactBlob = async (artifact: StudioArtifact) => {
    const artifactId = getArtifactId(artifact)
    if (!selectedNotebook) throw new Error('No notebook selected')
    const artifactType = getArtifactType(artifact)
    if (artifactType === 'unknown') {
      throw new Error('NotebookLM did not return a downloadable artifact type for this item.')
    }
    const params = new URLSearchParams({ artifact_type: artifactType })
    if (artifactId) params.set('artifact_id', artifactId)
    const outputFormat = getDownloadFormat(artifact)
    if (outputFormat) params.set('output_format', outputFormat)

    const response = await fetch(`http://127.0.0.1:${sidecarPort}/api/notebooklm/notebooks/${selectedNotebook.id}/studio/download?${params.toString()}`, {
      headers: { 'X-Ater-Token': sidecarToken },
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || response.statusText)
    }
    const blob = await response.blob()
    const disposition = response.headers.get('content-disposition') || ''
    const match = disposition.match(/filename="?([^"]+)"?/i)
    const filename = match?.[1] || `${artifactType}-${artifactId || 'latest'}`
    return {
      blob,
      filename,
      mediaType: response.headers.get('content-type') || blob.type || 'application/octet-stream',
    }
  }

  const handleOpenArtifact = async (artifact: StudioArtifact) => {
    const artifactType = getArtifactType(artifact)
    const artifactId = getArtifactId(artifact) || artifactType
    setArtifactActionLoading(`open:${artifactId}`)
    try {
      const result = await fetchArtifactBlob(artifact)
      const url = URL.createObjectURL(result.blob)
      setArtifactPreview(prev => {
        if (prev?.url) URL.revokeObjectURL(prev.url)
        return {
          url,
          filename: result.filename,
          mediaType: result.mediaType,
          artifactType,
        }
      })
    } catch (err: any) {
      toast.error('Failed to open artifact: ' + err.message)
    } finally {
      setArtifactActionLoading(null)
    }
  }

  const handleDownloadArtifact = async (artifact: StudioArtifact) => {
    const artifactId = getArtifactId(artifact) || getArtifactType(artifact)
    setArtifactActionLoading(`download:${artifactId}`)
    try {
      const result = await fetchArtifactBlob(artifact)
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Artifact downloaded')
    } catch (err: any) {
      toast.error('Download failed: ' + err.message)
    } finally {
      setArtifactActionLoading(null)
    }
  }

  const closeArtifactPreview = () => {
    if (artifactPreview?.url) {
      URL.revokeObjectURL(artifactPreview.url)
    }
    setArtifactPreview(null)
  }

  const loadNotebooks = async () => {
    setLoading(true)
    try {
      const data = await request('/notebooks')
      setNotebooks(data || [])
    } catch (err: any) {
      toast.error('Failed to load notebooks: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadNotebookDetails = async (id: string) => {
    try {
      const srcRes = await request(`/notebooks/${id}/sources`)
      setSources(srcRes || [])

      const studioRes = await request(`/notebooks/${id}/studio/status`)
      setStudioArtifacts(studioRes || [])

      const qRes = await request(`/notebooks/${id}/quizzes`)
      setSavedQuizzes(qRes || [])

      const fcRes = await request(`/notebooks/${id}/flashcards`)
      setSavedFlashcards(fcRes || [])
    } catch (err: any) {
      console.error('Failed to load notebook details:', err)
    }
  }

  const handleCreateNotebookInCard = async () => {
    if (!newNotebookTitle.trim()) return
    setCreating(true)
    try {
      const res = await request('/notebooks', {
        method: 'POST',
        body: JSON.stringify({ title: newNotebookTitle })
      })
      toast.success('Notebook created')
      setIsCreatingInCard(false)
      setNewNotebookTitle('')
      loadNotebooks()
      if (res && res.id) {
        setSelectedNotebook({ id: res.id, title: res.title || newNotebookTitle })
        setActiveTab('sources')
      }
    } catch (err: any) {
      toast.error('Failed to create notebook: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRenameNotebook = async (notebookId: string, title: string) => {
    if (!title.trim()) return
    try {
      await request(`/notebooks/${notebookId}`, {
        method: 'PUT',
        body: JSON.stringify({ title })
      })
      toast.success('Notebook renamed')
      setEditingNotebookId(null)
      loadNotebooks()
      if (selectedNotebook?.id === notebookId) {
        setSelectedNotebook(prev => prev ? { ...prev, title } : null)
      }
    } catch (err: any) {
      toast.error('Failed to rename: ' + err.message)
    }
  }

  const handleDeleteNotebook = async (notebookId: string) => {
    if (!window.confirm('Delete this notebook?')) return
    try {
      await request(`/notebooks/${notebookId}`, {
        method: 'DELETE'
      })
      toast.success('Notebook deleted')
      if (selectedNotebook?.id === notebookId) {
        setSelectedNotebook(null)
      }
      loadNotebooks()
    } catch (err: any) {
      toast.error('Failed to delete notebook: ' + err.message)
    }
  }

  const handleIngest = async () => {
    if (!selectedNotebook) return
    setUploadLoading(true)
    try {
      if (uploadType === 'url') {
        await request(`/notebooks/${selectedNotebook.id}/sources`, {
          method: 'POST',
          body: JSON.stringify({ source_type: 'url', url: uploadUrl })
        })
        setUploadUrl('')
      } else if (uploadType === 'text') {
        await request(`/notebooks/${selectedNotebook.id}/sources`, {
          method: 'POST',
          body: JSON.stringify({ source_type: 'text', text: uploadText, title: uploadTextTitle || 'Pasted Text' })
        })
        setUploadText('')
        setUploadTextTitle('')
      } else if (uploadType === 'drive') {
        await request(`/notebooks/${selectedNotebook.id}/sources`, {
          method: 'POST',
          body: JSON.stringify({ source_type: 'drive', document_id: uploadDriveId, doc_type: uploadDriveType })
        })
        setUploadDriveId('')
      }
      setUploadType(null)
      loadNotebookDetails(selectedNotebook.id)
      toast.success('Source uploaded')
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNotebook || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploadLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    const url = `http://127.0.0.1:${sidecarPort}/api/notebooklm/notebooks/${selectedNotebook.id}/sources/file`
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Ater-Token': sidecarToken
        },
        body: formData
      })
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      toast.success('File source uploaded')
      loadNotebookDetails(selectedNotebook.id)
    } catch (err: any) {
      toast.error('File upload failed: ' + err.message)
    } finally {
      setUploadLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteSource = async (sourceId: string) => {
    if (!selectedNotebook) return
    if (!window.confirm('Delete this source?')) return
    try {
      await request(`/notebooks/${selectedNotebook.id}/sources/${sourceId}`, {
        method: 'DELETE'
      })
      toast.success('Source deleted')
      loadNotebookDetails(selectedNotebook.id)
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Delete this quiz?')) return
    try {
      await request(`/quizzes/${quizId}`, {
        method: 'DELETE'
      })
      toast.success('Quiz deleted')
      if (selectedNotebook) {
        loadNotebookDetails(selectedNotebook.id)
      }
    } catch (err: any) {
      toast.error('Failed to delete quiz: ' + err.message)
    }
  }

  const handleDeleteFlashcards = async (cardId: string) => {
    if (!window.confirm('Delete these flashcards?')) return
    try {
      await request(`/flashcards/${cardId}`, {
        method: 'DELETE'
      })
      toast.success('Flashcards deleted')
      if (selectedNotebook) {
        loadNotebookDetails(selectedNotebook.id)
      }
    } catch (err: any) {
      toast.error('Failed to delete flashcards: ' + err.message)
    }
  }

  const handleSendQuery = async () => {
    if (!selectedNotebook || !chatQuery.trim()) return
    const userText = chatQuery
    setChatQuery('')
    setChatMessages(prev => [...prev, { role: 'user', text: userText }])
    setChatLoading(true)

    try {
      const res = await request(`/notebooks/${selectedNotebook.id}/query`, {
        method: 'POST',
        body: JSON.stringify({
          query: userText,
          conversation_id: conversationId
        })
      })
      if (res) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.answer || res.output || JSON.stringify(res) }])
        if (res.conversation_id) {
          setConversationId(res.conversation_id)
        }
      }
    } catch (err: any) {
      toast.error('Query failed')
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + err.message }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleGenerateStudio = async () => {
    if (!selectedNotebook) return
    setGeneratingStudio(true)
    
    const payload: any = { artifact_type: artifactType }
    if (studioLanguage.trim()) payload.language = studioLanguage.trim()
    if (studioFocus.trim()) payload.focus_prompt = studioFocus.trim()
    if (studioSourceIds.trim()) {
      payload.source_ids = studioSourceIds.split(',').map(id => id.trim()).filter(Boolean)
    }
    if (artifactType === 'audio') {
      payload.audio_format = audioFormat
      payload.audio_length = audioLength
    } else if (artifactType === 'report') {
      payload.report_format = reportFormat
      payload.custom_prompt = customPrompt
    } else if (artifactType === 'quiz') {
      payload.question_count = questionCount
      payload.difficulty = quizDifficulty
    } else if (artifactType === 'flashcards') {
      payload.difficulty = flashcardsDifficulty
    } else if (artifactType === 'slides') {
      payload.slide_format = slidesFormat
      payload.slide_length = slidesLength
    } else if (artifactType === 'mindmap') {
      payload.title = mindmapTitle
    } else if (artifactType === 'infographic') {
      payload.orientation = infographicOrientation
      payload.detail_level = infographicDetail
      payload.infographic_style = infographicStyle
    } else if (artifactType === 'video') {
      payload.video_format = videoFormat
      payload.video_style = videoStyle
      payload.video_style_prompt = videoStylePrompt
    } else if (artifactType === 'data-table') {
      payload.description = dataTableDescription
    }

    try {
      await request(`/notebooks/${selectedNotebook.id}/studio`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      toast.success('Studio generation triggered')
      loadNotebookDetails(selectedNotebook.id)
      
      let count = 0
      const timer = setInterval(async () => {
        count++
        if (!selectedNotebook) return clearInterval(timer)
        await loadNotebookDetails(selectedNotebook.id)
        if (count > 20) clearInterval(timer)
      }, 5000)
    } catch (err: any) {
      toast.error('Failed: ' + err.message)
    } finally {
      setGeneratingStudio(false)
    }
  }

  const savePracticeResults = async (score: number, total: number) => {
    if (!selectedNotebook) return
    try {
      await sidecarApi.logPracticeResult(selectedNotebook.id, score, total)
      toast.success('Practice score synced locally')
    } catch (e) {
      console.error(e)
    }
  }

  const startQuiz = (quiz: any) => {
    let parsedData = quiz.data
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData) } catch {}
    }
    setActiveQuiz({ ...quiz, parsed: parsedData })
    setCurrentQuestionIdx(0)
    setSelectedAnswerIdx(null)
    setQuizScore(0)
    setQuizFinished(false)
  }

  const submitAnswer = (idx: number, correctIdx: number) => {
    setSelectedAnswerIdx(idx)
    const isCorrect = idx === correctIdx
    if (isCorrect) {
      setQuizScore(prev => prev + 1)
    }
    if (selectedNotebook) {
      sidecarApi.logPracticeAttempt(selectedNotebook.id, 'multiple_choice', isCorrect, 10).catch(console.error)
    }
  }

  const nextQuestion = () => {
    const totalQuestions = activeQuiz?.parsed?.questions?.length || 0
    if (currentQuestionIdx + 1 < totalQuestions) {
      setCurrentQuestionIdx(prev => prev + 1)
      setSelectedAnswerIdx(null)
    } else {
      setQuizFinished(true)
      savePracticeResults(quizScore, totalQuestions)
    }
  }

  const startFlashcards = (cards: any) => {
    let parsedData = cards.data
    if (typeof parsedData === 'string') {
      try { parsedData = JSON.parse(parsedData) } catch {}
    }
    setActiveFlashcards({ ...cards, parsed: parsedData })
    setCurrentCardIdx(0)
    setShowCardBack(false)
  }

  const rateFlashcard = (remembered: boolean) => {
    if (selectedNotebook) {
      sidecarApi.logPracticeAttempt(selectedNotebook.id, 'flashcard', remembered, 5).catch(console.error)
    }

    const totalCards = activeFlashcards?.parsed?.flashcards?.length || 0
    if (currentCardIdx + 1 < totalCards) {
      setCurrentCardIdx(prev => prev + 1)
      setShowCardBack(false)
    } else {
      toast.success('Completed flashcards')
      savePracticeResults(remembered ? 1 : 0, 1)
      setActiveFlashcards(null)
    }
  }

  // ── Tab Rendering Helpers ──────────────────────────────────────────────────
  const TabButton = ({ id, label }: { id: typeof activeTab; label: string }) => {
    const active = activeTab === id
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={cn(
          'relative flex-none h-full flex items-center gap-1.5 px-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap focus-visible:ring-1 focus-visible:ring-primary outline-none transition-all',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
        )}
      >
        <span>{label}</span>
        {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />}
      </button>
    )
  }

  return (
    <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden gap-3">
      {/* Top Bar (Workspace Details Only) */}
      {selectedNotebook && (
        <div className="shrink-0 px-6 bg-bento-panel border border-border/40 rounded-[12px] h-12 flex items-center justify-between shadow-sm z-30 select-none">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide h-full">
            <button
              onClick={() => setSelectedNotebook(null)}
              className="flex-none h-full flex items-center gap-1.5 px-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all outline-none"
            >
              Back
            </button>
            <div className="h-4 w-px bg-border/40 mx-2" />
            <TabButton id="sources" label="Sources" />
            <TabButton id="chat" label="Oracle Chat" />
            <TabButton id="practice" label="Revision Practice" />
            <TabButton id="studio" label="Studio Generations" />
          </div>
          <div className="text-[9px] font-mono font-black uppercase tracking-wider text-muted-foreground/60">
            Active: {selectedNotebook.title.toUpperCase()}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden relative">
        
        {/* NOTEBOOKS GRID VIEW */}
        {!selectedNotebook ? (
          <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar text-left">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <div>
                <h1 className="text-[14px] font-black uppercase tracking-widest text-foreground">Notebook Directory</h1>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Select or create a study notebook</p>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-muted-foreground size-6" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                {/* Create Notebook Card */}
                {isCreatingInCard ? (
                  <div className="border border-dashed border-foreground/45 bg-muted/5 p-5 rounded-[8px] flex flex-col justify-between h-[130px] transition-all">
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-mono font-black uppercase tracking-widest text-muted-foreground">NEW NOTEBOOK</span>
                      <input
                        autoFocus
                        type="text"
                        value={newNotebookTitle}
                        onChange={(e) => setNewNotebookTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateNotebookInCard()
                          } else if (e.key === 'Escape') {
                            setIsCreatingInCard(false)
                            setNewNotebookTitle('')
                          }
                        }}
                        placeholder="Type title..."
                        className="w-full bg-transparent border-b border-border focus:border-foreground py-1 text-[12px] font-bold focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 text-[9px] font-black uppercase tracking-widest">
                      <button
                        onClick={() => {
                          setIsCreatingInCard(false)
                          setNewNotebookTitle('')
                        }}
                        className="hover:text-foreground text-muted-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={creating || !newNotebookTitle.trim()}
                        onClick={handleCreateNotebookInCard}
                        className="text-foreground hover:underline"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsCreatingInCard(true)
                      setNewNotebookTitle('')
                    }}
                    className="border border-dashed border-border/60 hover:border-foreground/30 bg-transparent hover:bg-muted/10 p-5 rounded-[8px] flex flex-col items-center justify-center h-[130px] transition-all text-center gap-2 group"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Create Notebook</span>
                  </button>
                )}

                {/* Notebook Cards */}
                {notebooks.map((nb) => {
                  const isEditing = editingNotebookId === nb.id
                  return (
                    <div
                      key={nb.id}
                      onClick={() => {
                        if (!isEditing) {
                          setSelectedNotebook(nb)
                          setActiveTab('sources')
                        }
                      }}
                      className={cn(
                        "border border-border/40 bg-muted/10 p-5 rounded-[8px] flex flex-col justify-between h-[130px] transition-all relative group",
                        !isEditing && "cursor-pointer hover:bg-muted/20 hover:border-foreground/30"
                      )}
                    >
                      {isEditing ? (
                        <div className="space-y-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-muted-foreground">RENAME</span>
                          <input
                            autoFocus
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameNotebook(nb.id, renameTitle)
                              } else if (e.key === 'Escape') {
                                setEditingNotebookId(null)
                              }
                            }}
                            className="w-full bg-transparent border-b border-border focus:border-foreground py-1 text-[12px] font-bold focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-muted-foreground/40">NOTEBOOK</span>
                          <h3 className="text-[12px] font-black uppercase tracking-wider line-clamp-2">{nb.title}</h3>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <div className="flex justify-end gap-2 text-[9px] font-black uppercase tracking-widest w-full">
                            <button
                              onClick={() => setEditingNotebookId(null)}
                              className="hover:text-foreground text-muted-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRenameNotebook(nb.id, renameTitle)}
                              className="text-foreground hover:underline"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono text-[8px] text-muted-foreground/30 truncate max-w-[50%]">
                              {nb.id.slice(0, 8)}...
                            </span>
                            <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest">
                              <button
                                onClick={() => {
                                  setEditingNotebookId(nb.id)
                                  setRenameTitle(nb.title)
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteNotebook(nb.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* SOURCES TAB */}
            {activeTab === 'sources' && (
              <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
                {/* Ingestion/Upload controls */}
                <div className="border border-border/40 bg-muted/5 rounded-[8px] p-5 text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Upload Source:</span>
                    <div className="flex gap-2">
                      {(['file', 'url', 'text', 'drive'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setUploadType(type)}
                          className={cn(
                            "px-3 py-1 border text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all",
                            uploadType === type ? "border-primary bg-primary text-primary-foreground" : "border-border/60 hover:bg-muted/10 text-muted-foreground"
                          )}
                        >
                          {type === 'file' ? 'File' : type === 'url' ? 'URL' : type === 'drive' ? 'Drive' : 'Text'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {uploadType === 'file' && (
                    <div className="py-6 border border-dashed border-border/60 rounded-[6px] text-center bg-transparent">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.epub,.docx,.json" />
                      <button 
                        disabled={uploadLoading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted/25 rounded-[6px]"
                      >
                        Select File
                      </button>
                      <p className="text-[8px] text-muted-foreground/60 uppercase font-black tracking-widest mt-2">PDF, TXT, EPUB</p>
                    </div>
                  )}

                  {uploadType === 'url' && (
                    <div className="flex gap-2">
                      <input 
                        type="url"
                        value={uploadUrl}
                        onChange={(e) => setUploadUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-transparent border border-border px-3 py-2 text-[12px] focus:outline-none rounded-[6px]"
                      />
                      <button
                        disabled={uploadLoading || !uploadUrl.trim()}
                        onClick={handleIngest}
                        className="px-4 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted/25 rounded-[6px]"
                      >
                        Upload
                      </button>
                    </div>
                  )}

                  {uploadType === 'text' && (
                    <div className="space-y-3">
                      <input 
                        type="text"
                        value={uploadTextTitle}
                        onChange={(e) => setUploadTextTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full bg-transparent border border-border px-3 py-2 text-[12px] focus:outline-none rounded-[6px]"
                      />
                      <textarea
                        rows={4}
                        value={uploadText}
                        onChange={(e) => setUploadText(e.target.value)}
                        placeholder="Paste text contents..."
                        className="w-full bg-transparent border border-border px-3 py-2 text-[12px] focus:outline-none rounded-[6px] custom-scrollbar"
                      />
                      <div className="flex justify-end">
                        <button
                          disabled={uploadLoading || !uploadText.trim()}
                          onClick={handleIngest}
                          className="px-4 py-2 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted/25 rounded-[6px]"
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadType === 'drive' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={uploadDriveId}
                        onChange={(e) => setUploadDriveId(e.target.value)}
                        placeholder="Google Drive document ID"
                        className="flex-1 bg-transparent border border-border px-3 py-2 text-[12px] focus:outline-none rounded-[6px]"
                      />
                      <select
                        value={uploadDriveType}
                        onChange={(e) => setUploadDriveType(e.target.value as typeof uploadDriveType)}
                        className="bg-transparent border border-border px-3 py-2 text-[12px] font-bold focus:outline-none rounded-[6px]"
                      >
                        <option value="doc">Doc</option>
                        <option value="slides">Slides</option>
                        <option value="sheets">Sheets</option>
                        <option value="pdf">PDF</option>
                      </select>
                      <button
                        disabled={uploadLoading || !uploadDriveId.trim()}
                        onClick={handleIngest}
                        className="px-4 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted/25 rounded-[6px]"
                      >
                        Upload
                      </button>
                    </div>
                  )}
                </div>

                {/* Sources listings */}
                <div className="flex-1 flex flex-col text-left">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground mb-4">Uploaded Sources ({sources.length})</h3>
                  {sources.length === 0 ? (
                    <div className="py-16 text-center border border-border w-full bg-muted/5 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      No sources uploaded
                    </div>
                  ) : (
                    <div className="border border-border/40 rounded-[8px] overflow-hidden divide-y divide-border/30">
                      {sources.map(src => (
                        <div key={src.id} className="flex items-center justify-between p-4 bg-muted/5">
                          <div>
                            <h4 className="text-[11px] font-bold text-foreground leading-snug">{src.title}</h4>
                            <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">{src.source_type} • words: {src.word_count || 'n/a'}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteSource(src.id)}
                            className="px-3 py-1.5 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px]"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground select-none">
                      <span className="text-[9px] font-black uppercase tracking-widest">Notebook Chat Interface</span>
                      <span className="text-[9px] font-bold text-muted-foreground/50 mt-1 uppercase text-center max-w-sm leading-normal">
                        Submit questions regarding sources. Citation-backed queries will execute here.
                      </span>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex flex-col max-w-[85%] rounded-[8px] p-4 text-left border leading-normal text-[12px] font-sans",
                          msg.role === 'user'
                            ? "self-end bg-muted/10 border-border text-foreground"
                            : "self-start bg-transparent border-border text-foreground"
                        )}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest mb-1.5 opacity-60">
                          {msg.role === 'user' ? 'Learner' : 'Assistant'}
                        </span>
                        {msg.role === 'assistant' ? (
                          <div className="font-medium space-y-2 [&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_h1]:text-[13px] [&_h1]:font-black [&_h2]:text-[12px] [&_h2]:font-black [&_h3]:text-[11px] [&_h3]:font-black [&_code]:font-mono [&_code]:text-[11px] [&_pre]:overflow-auto [&_pre]:rounded-[6px] [&_pre]:border [&_pre]:border-border [&_pre]:p-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap font-medium">{msg.text}</span>
                        )}
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="self-start border border-border rounded-[8px] p-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      <Loader2 className="animate-spin size-3" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 p-4 border-t border-border/20 bg-muted/5 flex items-center justify-between">
                  <button
                    disabled={chatMessages.length === 0}
                    onClick={() => {
                      setChatMessages([])
                      setConversationId(null)
                    }}
                    className="px-3 py-1.5 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] disabled:opacity-30"
                  >
                    Clear Chat
                  </button>
                  <div className="flex gap-2 max-w-4xl flex-1 ml-4 justify-end">
                    <input 
                      type="text"
                      value={chatQuery}
                      onChange={(e) => setChatQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                      disabled={chatLoading}
                      placeholder="Query sources..."
                      className="flex-1 bg-transparent border border-border px-3 py-2 text-[12px] focus:outline-none rounded-[6px]"
                    />
                    <button
                      disabled={chatLoading || !chatQuery.trim()}
                      onClick={handleSendQuery}
                      className="px-4 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted/25 rounded-[6px] disabled:opacity-30"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PRACTICE TAB */}
            {activeTab === 'practice' && (
              <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
                {!activeQuiz && !activeFlashcards ? (
                  <div className="flex flex-col gap-6">
                    {/* Generate Practice Button */}
                    <button
                      onClick={() => setActiveTab('studio')}
                      className="w-full py-3 border border-dashed border-border/60 hover:border-foreground/30 hover:bg-muted/10 text-[9px] font-black uppercase tracking-widest rounded-[8px] transition-all flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      Generate Quiz or Flashcards
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      {/* Quizzes */}
                      <div className="space-y-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Interactive Quizzes</h3>
                        {savedQuizzes.length === 0 ? (
                          <div className="py-12 text-center border border-border/30 rounded-[8px] text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            No quizzes found
                          </div>
                        ) : (
                          <div className="border border-border/40 rounded-[8px] overflow-hidden divide-y divide-border/30">
                            {savedQuizzes.map(quiz => (
                              <div key={quiz.id} className="flex items-center justify-between p-4 bg-muted/5">
                                <span className="text-[11px] font-bold truncate pr-3">{quiz.title}</span>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => startQuiz(quiz)}
                                    className="px-3 py-1.5 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px]"
                                  >
                                    Start
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    className="px-3 py-1.5 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px]"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Flashcards */}
                      <div className="space-y-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Recall Flashcards</h3>
                        {savedFlashcards.length === 0 ? (
                          <div className="py-12 text-center border border-border/30 rounded-[8px] text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            No flashcards found
                          </div>
                        ) : (
                          <div className="border border-border/40 rounded-[8px] overflow-hidden divide-y divide-border/30">
                            {savedFlashcards.map(fc => (
                              <div key={fc.id} className="flex items-center justify-between p-4 bg-muted/5">
                                <span className="text-[11px] font-bold truncate pr-3">{fc.title}</span>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => startFlashcards(fc)}
                                    className="px-3 py-1.5 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px]"
                                  >
                                    Practice
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteFlashcards(fc.id)}
                                    className="px-3 py-1.5 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px]"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeQuiz ? (
                  /* ACTIVE QUIZ SCREEN */
                  <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full gap-6 text-left">
                    <div className="flex items-center justify-between border-b border-border/20 pb-3">
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest text-muted-foreground">
                        Question {currentQuestionIdx + 1} / {activeQuiz.parsed?.questions?.length || 0}
                      </span>
                      <button onClick={() => setActiveQuiz(null)} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                        Exit
                      </button>
                    </div>

                    {!quizFinished ? (
                      <>
                        <div className="border border-border/40 bg-muted/5 rounded-[8px] p-5">
                          <h2 className="text-[12px] font-black uppercase tracking-wider leading-relaxed">
                            {activeQuiz.parsed?.questions?.[currentQuestionIdx]?.question}
                          </h2>
                        </div>

                        <div className="flex flex-col gap-2">
                          {activeQuiz.parsed?.questions?.[currentQuestionIdx]?.options?.map((opt: string, idx: number) => {
                            const isCorrect = idx === activeQuiz.parsed?.questions?.[currentQuestionIdx]?.correct_option_index
                            const isSelected = selectedAnswerIdx === idx
                            const correctSelected = selectedAnswerIdx !== null && isCorrect
                            const wrongSelected = isSelected && !isCorrect
                            
                            return (
                              <button
                                key={idx}
                                disabled={selectedAnswerIdx !== null}
                                onClick={() => submitAnswer(idx, activeQuiz.parsed?.questions?.[currentQuestionIdx]?.correct_option_index)}
                                className={cn(
                                  "w-full px-4 py-3 border text-left text-[11px] font-bold flex items-center justify-between transition-all rounded-[6px]",
                                  selectedAnswerIdx === null
                                    ? "border-border/60 hover:bg-muted/10 text-muted-foreground"
                                    : correctSelected
                                      ? "border-foreground bg-muted/10 text-foreground"
                                      : wrongSelected
                                        ? "border-dashed border-border opacity-50 text-muted-foreground"
                                        : isCorrect
                                          ? "border-foreground text-foreground"
                                          : "border-border/20 opacity-30 text-muted-foreground"
                                )}
                              >
                                <span>{opt}</span>
                                {selectedAnswerIdx !== null && isCorrect && <span className="text-[9px] font-mono font-black uppercase tracking-widest">CORRECT</span>}
                                {selectedAnswerIdx !== null && isSelected && !isCorrect && <span className="text-[9px] font-mono font-black uppercase tracking-widest">WRONG</span>}
                              </button>
                            )
                          })}
                        </div>

                        {selectedAnswerIdx !== null && (
                          <div className="space-y-4">
                            {activeQuiz.parsed?.questions?.[currentQuestionIdx]?.explanation && (
                              <div className="border border-border/40 bg-muted/5 rounded-[6px] p-4 text-[10px] font-sans font-medium text-muted-foreground leading-relaxed">
                                <span className="font-black text-foreground uppercase tracking-widest text-[8px] block mb-1">Explanation</span>
                                {activeQuiz.parsed?.questions?.[currentQuestionIdx]?.explanation}
                              </div>
                            )}
                            <div className="flex justify-end">
                              <button
                                onClick={nextQuestion}
                                className="px-5 py-2 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted/20 rounded-[6px] flex items-center gap-1.5 text-foreground"
                              >
                                <span>Next</span>
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="border border-border/40 bg-muted/5 rounded-[8px] p-8 text-center flex flex-col items-center gap-4">
                        <h2 className="text-sm font-black uppercase tracking-widest">Quiz Completed</h2>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Score: <span className="font-mono text-foreground font-black">{quizScore} / {activeQuiz.parsed?.questions?.length || 0}</span>
                        </p>
                        <button
                          onClick={() => setActiveQuiz(null)}
                          className="px-5 py-2 border border-border text-[9px] font-black uppercase tracking-widest hover:bg-muted/20 rounded-[6px] mt-4"
                        >
                          Finish
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ACTIVE FLASHCARDS SCREEN */
                  <div className="flex-1 flex flex-col max-w-xl mx-auto w-full gap-6 text-left">
                    <div className="w-full flex items-center justify-between border-b border-border/20 pb-3">
                      <span className="text-[9px] font-mono font-black tracking-widest text-muted-foreground">
                        Card {currentCardIdx + 1} / {activeFlashcards.parsed?.flashcards?.length || 0}
                      </span>
                      <button onClick={() => setActiveFlashcards(null)} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                        Exit
                      </button>
                    </div>

                    <button
                      onClick={() => setShowCardBack(prev => !prev)}
                      className="w-full min-h-[180px] border border-border/40 bg-muted/5 rounded-[8px] p-6 flex flex-col items-center justify-center text-center hover:bg-muted/10 transition-all gap-2"
                    >
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{!showCardBack ? 'Front' : 'Back'}</span>
                      <h2 className="text-[12px] font-black uppercase tracking-wide text-foreground">
                        {!showCardBack 
                          ? activeFlashcards.parsed?.flashcards?.[currentCardIdx]?.front 
                          : activeFlashcards.parsed?.flashcards?.[currentCardIdx]?.back}
                      </h2>
                      <span className="text-[8px] font-sans font-bold text-muted-foreground/30 mt-4 uppercase tracking-widest">Click to flip</span>
                    </button>

                    {showCardBack && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => rateFlashcard(false)}
                            className="py-2.5 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all text-muted-foreground hover:text-foreground"
                          >
                            Forgot
                          </button>
                          <button
                            onClick={() => rateFlashcard(true)}
                            className="py-2.5 border border-foreground bg-muted/10 text-[9px] font-black uppercase tracking-widest rounded-[6px] transition-all text-foreground hover:bg-muted/20"
                          >
                            Recalled
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STUDIO TAB */}
            {activeTab === 'studio' && (
              <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/20 overflow-hidden text-left bg-transparent">
                {/* Generate controls */}
                <div className="w-full md:w-[320px] p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 shrink-0 bg-transparent">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Studio Generator</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Format Type</label>
                      <select 
                        value={artifactType} 
                        onChange={(e) => setArtifactType(e.target.value)}
                        className="w-full bg-transparent border border-border px-2.5 py-2 text-[11px] font-bold focus:outline-none rounded-[6px]"
                      >
                        <option value="audio">Audio Overview (Podcast)</option>
                        <option value="video">Video Overview</option>
                        <option value="quiz">Interactive Quiz</option>
                        <option value="flashcards">Revision Flashcards</option>
                        <option value="report">Study Report / Brief</option>
                        <option value="slides">Presentation Slides</option>
                        <option value="mindmap">Mind Map</option>
                        <option value="infographic">Infographic</option>
                        <option value="data-table">Data Table</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Source IDs</label>
                      <input
                        type="text"
                        value={studioSourceIds}
                        onChange={(e) => setStudioSourceIds(e.target.value)}
                        placeholder="Optional comma-separated source IDs"
                        className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-mono focus:outline-none rounded-[6px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Language</label>
                      <input
                        type="text"
                        value={studioLanguage}
                        onChange={(e) => setStudioLanguage(e.target.value)}
                        placeholder="Default, en, en-US..."
                        className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-mono focus:outline-none rounded-[6px]"
                      />
                    </div>

                    {artifactType !== 'mindmap' && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Focus</label>
                        <textarea
                          rows={2}
                          value={studioFocus}
                          onChange={(e) => setStudioFocus(e.target.value)}
                          placeholder="Optional topic, audience, or angle"
                          className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-sans focus:outline-none rounded-[6px] custom-scrollbar"
                        />
                      </div>
                    )}

                    {artifactType === 'audio' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Format</label>
                          <select 
                            value={audioFormat} 
                            onChange={(e) => setAudioFormat(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="deep_dive">Deep Dive Conversation</option>
                            <option value="brief">Quick Briefing Summary</option>
                            <option value="critique">Critique</option>
                            <option value="debate">Debate</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Length</label>
                          <select 
                            value={audioLength} 
                            onChange={(e) => setAudioLength(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="short">Short</option>
                            <option value="default">Default</option>
                            <option value="long">Long</option>
                          </select>
                        </div>
                      </>
                    )}

                    {artifactType === 'report' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Report Format</label>
                          <select 
                            value={reportFormat} 
                            onChange={(e) => setReportFormat(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="Briefing Doc">Briefing Document</option>
                            <option value="Study Guide">Study Guide</option>
                            <option value="Blog Post">Blog Post</option>
                            <option value="Create Your Own">Create Your Own</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Prompt Focus</label>
                          <textarea 
                            rows={2}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Focus on..."
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-sans focus:outline-none rounded-[6px] custom-scrollbar"
                          />
                        </div>
                      </>
                    )}

                    {artifactType === 'quiz' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Question Count</label>
                          <input 
                            type="number"
                            min={1}
                            max={50}
                            value={questionCount}
                            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 2)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-mono focus:outline-none rounded-[6px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Difficulty (1-5)</label>
                          <select 
                            value={quizDifficulty} 
                            onChange={(e) => setQuizDifficulty(parseInt(e.target.value) || 2)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="1">1 (Easy)</option>
                            <option value="2">2 (Default)</option>
                            <option value="3">3 (Medium)</option>
                            <option value="4">4 (Challenging)</option>
                            <option value="5">5 (Hard)</option>
                          </select>
                        </div>
                      </>
                    )}

                    {artifactType === 'flashcards' && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Difficulty</label>
                        <select 
                          value={flashcardsDifficulty} 
                          onChange={(e) => setFlashcardsDifficulty(e.target.value)}
                          className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    )}

                    {artifactType === 'slides' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Slides Style</label>
                          <select 
                            value={slidesFormat} 
                            onChange={(e) => setSlidesFormat(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="detailed_deck">Detailed Deck</option>
                            <option value="presenter_slides">Presenter Slides</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Length</label>
                          <select 
                            value={slidesLength} 
                            onChange={(e) => setSlidesLength(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="short">Short</option>
                            <option value="default">Default</option>
                          </select>
                        </div>
                      </>
                    )}

                    {artifactType === 'mindmap' && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Title</label>
                        <input
                          type="text"
                          value={mindmapTitle}
                          onChange={(e) => setMindmapTitle(e.target.value)}
                          className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                        />
                      </div>
                    )}

                    {artifactType === 'infographic' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Orientation</label>
                          <select
                            value={infographicOrientation}
                            onChange={(e) => setInfographicOrientation(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="landscape">Landscape</option>
                            <option value="portrait">Portrait</option>
                            <option value="square">Square</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Detail</label>
                          <select
                            value={infographicDetail}
                            onChange={(e) => setInfographicDetail(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="concise">Concise</option>
                            <option value="standard">Standard</option>
                            <option value="detailed">Detailed</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Style</label>
                          <select
                            value={infographicStyle}
                            onChange={(e) => setInfographicStyle(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="auto_select">Auto Select</option>
                            <option value="sketch_note">Sketch Note</option>
                            <option value="professional">Professional</option>
                            <option value="bento_grid">Bento Grid</option>
                            <option value="editorial">Editorial</option>
                            <option value="instructional">Instructional</option>
                            <option value="bricks">Bricks</option>
                            <option value="clay">Clay</option>
                            <option value="anime">Anime</option>
                            <option value="kawaii">Kawaii</option>
                            <option value="scientific">Scientific</option>
                          </select>
                        </div>
                      </>
                    )}

                    {artifactType === 'video' && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Format</label>
                          <select
                            value={videoFormat}
                            onChange={(e) => setVideoFormat(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="explainer">Explainer</option>
                            <option value="brief">Brief</option>
                            <option value="cinematic">Cinematic</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Visual Style</label>
                          <select
                            value={videoStyle}
                            onChange={(e) => setVideoStyle(e.target.value)}
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-bold focus:outline-none rounded-[6px]"
                          >
                            <option value="auto_select">Auto Select</option>
                            <option value="custom">Custom</option>
                            <option value="classic">Classic</option>
                            <option value="whiteboard">Whiteboard</option>
                            <option value="kawaii">Kawaii</option>
                            <option value="anime">Anime</option>
                            <option value="watercolor">Watercolor</option>
                            <option value="retro_print">Retro Print</option>
                            <option value="heritage">Heritage</option>
                            <option value="paper_craft">Paper Craft</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Style Prompt</label>
                          <textarea
                            rows={2}
                            value={videoStylePrompt}
                            onChange={(e) => setVideoStylePrompt(e.target.value)}
                            placeholder="Custom visual direction"
                            className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-sans focus:outline-none rounded-[6px] custom-scrollbar"
                          />
                        </div>
                      </>
                    )}

                    {artifactType === 'data-table' && (
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Table Description</label>
                        <textarea
                          rows={3}
                          value={dataTableDescription}
                          onChange={(e) => setDataTableDescription(e.target.value)}
                          placeholder="Describe the table to extract from sources"
                          className="w-full bg-transparent border border-border px-2.5 py-1.5 text-[11px] font-sans focus:outline-none rounded-[6px] custom-scrollbar"
                        />
                      </div>
                    )}

                    <button
                      disabled={generatingStudio || sources.length === 0 || (artifactType === 'data-table' && !dataTableDescription.trim())}
                      onClick={handleGenerateStudio}
                      className="w-full py-2.5 mt-2 border border-primary bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all rounded-[6px] disabled:opacity-30 flex items-center justify-center gap-1"
                    >
                      <span>Generate Media</span>
                    </button>
                    {sources.length === 0 && (
                      <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest text-center mt-2">
                        Please add a source before generating.
                      </p>
                    )}
                  </div>
                </div>

                {/* Artifact Registry */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-transparent">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Generated Artifacts</h3>
                  
                  {studioArtifacts.length === 0 ? (
                    <div className="py-12 text-center border border-border/30 rounded-[8px] text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      No artifacts generated
                    </div>
                  ) : (
                    <div className="border border-border/40 rounded-[8px] overflow-hidden divide-y divide-border/30">
                      {studioArtifacts.map((art, idx) => {
                        const normalizedType = getArtifactType(art)
                        const artifactId = getArtifactId(art)
                        const actionKey = artifactId || normalizedType
                        const canDownload = art.status === 'completed' && normalizedType !== 'unknown'

                        return (
                          <div key={artifactId || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/5 text-[11px] font-bold">
                            <div className="min-w-0">
                              <h4 className="text-foreground">{getArtifactLabel(art)}</h4>
                              <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">ID: {artifactId.slice(0,8) || 'pending'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {(normalizedType === 'quiz' || normalizedType === 'flashcards') && (
                                <select
                                  value={getDownloadFormat(art)}
                                  onChange={(e) => setArtifactDownloadFormat(prev => ({ ...prev, [artifactId]: e.target.value }))}
                                  className="h-8 bg-transparent border border-border px-2 text-[9px] font-black uppercase tracking-widest rounded-[6px]"
                                >
                                  <option value="json">JSON</option>
                                  <option value="markdown">Markdown</option>
                                  <option value="html">HTML</option>
                                </select>
                              )}
                              {(normalizedType === 'slide_deck' || normalizedType === 'slides') && (
                                <select
                                  value={getDownloadFormat(art)}
                                  onChange={(e) => setArtifactDownloadFormat(prev => ({ ...prev, [artifactId]: e.target.value }))}
                                  className="h-8 bg-transparent border border-border px-2 text-[9px] font-black uppercase tracking-widest rounded-[6px]"
                                >
                                  <option value="pdf">PDF</option>
                                  <option value="pptx">PPTX</option>
                                </select>
                              )}
                              <span className="font-mono text-[9px] text-muted-foreground/80 uppercase px-2">
                                {art.status === 'completed' ? 'READY' : art.status === 'failed' ? 'FAILED' : 'BUILDING'}
                              </span>
                              <button
                                disabled={!canDownload || artifactActionLoading === `open:${actionKey}`}
                                onClick={() => handleOpenArtifact(art)}
                                className="h-8 px-3 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] disabled:opacity-30 flex items-center gap-1.5"
                              >
                                <Eye size={12} />
                                Open
                              </button>
                              <button
                                disabled={!canDownload || artifactActionLoading === `download:${actionKey}`}
                                onClick={() => handleDownloadArtifact(art)}
                                className="h-8 px-3 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] disabled:opacity-30 flex items-center gap-1.5"
                              >
                                <Download size={12} />
                                Save
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {artifactPreview && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[82vh] bg-bento-panel border border-border rounded-[10px] shadow-2xl flex flex-col overflow-hidden">
            <div className="h-12 shrink-0 border-b border-border/40 flex items-center justify-between px-4">
              <div className="min-w-0">
                <h3 className="text-[11px] font-black uppercase tracking-widest truncate">{artifactPreview.filename}</h3>
                <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">{artifactPreview.mediaType}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={artifactPreview.url}
                  download={artifactPreview.filename}
                  className="h-8 px-3 border border-border hover:bg-muted/20 text-[9px] font-black uppercase tracking-widest rounded-[6px] flex items-center gap-1.5"
                >
                  <Download size={12} />
                  Save
                </a>
                <button
                  onClick={closeArtifactPreview}
                  className="size-8 border border-border hover:bg-muted/20 rounded-[6px] flex items-center justify-center"
                  aria-label="Close artifact preview"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-background/40">
              {artifactPreview.mediaType.startsWith('audio/') ? (
                <div className="h-full flex items-center justify-center p-8">
                  <audio src={artifactPreview.url} controls className="w-full max-w-2xl" />
                </div>
              ) : artifactPreview.mediaType.startsWith('video/') ? (
                <video src={artifactPreview.url} controls className="w-full h-full bg-black" />
              ) : artifactPreview.mediaType.startsWith('image/') ? (
                <div className="h-full overflow-auto flex items-center justify-center p-6">
                  <img src={artifactPreview.url} alt={artifactPreview.filename} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <iframe
                  src={artifactPreview.url}
                  title={artifactPreview.filename}
                  className="w-full h-full bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
