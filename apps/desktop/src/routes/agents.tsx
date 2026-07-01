import React, {useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback} from 'react'
import { useTelemetryStore } from '@/lib/telemetryStore'
import {
 ShieldCheck, RefreshCw,
 FileText, Activity,
 Zap, Search, GraduationCap,
 User, BookOpen, BookOpenCheck, DollarSign, Bot, ChevronLeft, ChevronRight, ArrowRight, Settings as SettingsIcon, Target, Database, FileEdit, Tag, Calendar, LayoutDashboard, Sparkles, Plus, Info, X, Copy, Archive, Layers, ChevronDown, Check, ArrowLeft, CheckCircle, CheckCircle2, PanelRightOpen, BrainCircuit
} from 'lucide-react'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'

interface LessonPreview {
  title: string
  lessonPath: string
  notePath?: string
  hubPath?: string
  previewUrl: string
}

interface SavedConversation {
  id: string
  title: string
  messages: Message[]
  preview: LessonPreview | null
  panelOpen: boolean
  timestamp: number
}

import {sidecarApi} from '@/lib/sidecarApi'
import {cn} from '@/lib/utils'
import { listen } from '@tauri-apps/api/event'
import { NoteCanvas } from '@/components/intelligence/NoteCanvas'
import { LearningWorkspace } from '@/components/intelligence/LearningWorkspace'
import { useConfig} from '@/lib/ConfigContext'
import {useHeader} from '@/context/header-context'
import {useSidebarContent} from '@/context/sidebar-content-context'
import {useNavigate} from 'react-router-dom'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MiniLoader } from '@/components/ui/loading-state'
import { ArtifactViewer } from '@/components/obsidian/ArtifactViewer'
import { extractArtifacts } from '@/lib/artifacts/parser'
import { useArtifactStore } from '@/lib/artifacts/store'
import { shouldShowArtifactReopenButton } from '@/lib/artifacts/panel'
import { Send, Trash2, Bookmark, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import { dispatchWalkthroughTrigger } from '@/components/layout/InteractiveTour'
import { open } from '@tauri-apps/plugin-dialog'

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  status?: string;
  customAction?: {
    label: string
    hubPath: string
    semesterName: string
    courseName: string
    unitNum: string
    hubTitle: string
    sessionId: string
    results: string[]
  }
}

/* ─── Utilities ─── */
const cleanTitle = (val: any): string => {
  if (val === undefined || val === null) return ''
  return String(val).replace(/\[\[(.*?)\]\]/g, '$1').replace(/_/g, ' ').trim()
}

const isTemporaryLessonPath = (path?: string | null) => {
  return typeof path === 'string' && path.includes('remediation_temp')
}

const firstRealLessonPath = (...paths: Array<string | null | undefined>) => {
  return paths.find(path => path && !isTemporaryLessonPath(path)) || null
}

interface OracleViewProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  activeNotePath?: string | null;
  onStateChange?: (state: {
    hasMessages: boolean;
    hasPreview: boolean;
    isPanelOpen: boolean;
    isLessonOpen: boolean;
  }) => void;
  onNoteSelect?: (path: string | null) => void;
}

/* ─── Oracle Chat View ─── */
function OracleView({ isHistoryOpen, setIsHistoryOpen, activeNotePath, onStateChange, onNoteSelect }: OracleViewProps) {
  const navigate = useNavigate();
  const { setSidebarContent } = useSidebarContent();
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const { currentHub, history: studyHistory } = usePomodoroStore();
  const { config, saveConfig } = useConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'pipeline' ? 'pipeline' : 'ater';
  const fetchInbox = useTelemetryStore(state => state.fetchInbox);
  const fetchStatus = useTelemetryStore(state => state.fetchStatus);

  const toggleAutoDeploy = async () => {
    await saveConfig({ autoDeploy: !config?.autoDeploy });
    await sidecarApi.aterWatcherToggle();
    fetchStatus();
  };

  // Load conversation list
  const [conversations, setConversations] = useState<SavedConversation[]>([]);

  // Active conversation ID
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return localStorage.getItem('ater_oracle_active_conversation_id') || null;
  });

  const loadConversations = useCallback(async () => {
    try {
      const list = await sidecarApi.listConversations(true);
      const mapped = list.map((c: any) => ({
        id: c.id,
        title: c.title,
        messages: [],
        preview: c.metadata?.preview || null,
        panelOpen: c.metadata?.panelOpen || false,
        timestamp: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
        archived: c.archived || false
      }));
      setConversations(mapped);
    } catch (err) {
      console.error('[Oracle] Failed to list conversations:', err);
    }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const msgs = await sidecarApi.getMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('[Oracle] Failed to get messages:', err);
    }
  }, []);

  // Import legacy localStorage conversations on first run
  useEffect(() => {
    const importLegacy = async () => {
      const isImported = localStorage.getItem('ater_oracle_legacy_imported');
      if (isImported === 'true') return;

      const saved = localStorage.getItem('ater_oracle_conversations');
      if (!saved) {
        localStorage.setItem('ater_oracle_legacy_imported', 'true');
        return;
      }

      try {
        const legacyConvs = JSON.parse(saved);
        for (const c of legacyConvs) {
          const created = await sidecarApi.createConversation(c.title || 'Imported Chat', {
            preview: c.preview,
            panelOpen: c.panelOpen
          });
          if (created && created.id) {
            for (const msg of (c.messages || [])) {
              await sidecarApi.appendMessage(created.id, msg.role, msg.content);
            }
          }
        }
        localStorage.setItem('ater_oracle_legacy_imported', 'true');
        loadConversations();
      } catch (err) {
        console.error('[Oracle] Legacy import failed:', err);
      }
    };
    importLegacy();
  }, [loadConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  const activeConv = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find(c => c.id === activeConversationId) || null;
  }, [activeConversationId, conversations]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generatedSpecRef = useRef<Set<string>>(new Set());
  const artifactState = useArtifactStore();
  const [pendingPdfSession, setPendingPdfSession] = useState<{
    sessionId: string
    hubPath: string
    semesterName: string
    courseName: string
    unitNum: string
    hubTitle: string
    results: string[]
  } | null>(null);

  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);

  const [preview, setPreview] = useState<LessonPreview | null>(() => {
    if (activeConv) return activeConv.preview;
    try {
      const saved = localStorage.getItem('ater_lesson_preview');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [tutorSession, setTutorSession] = useState<any | null>(null);
  const [panelOpen, setPanelOpen] = useState(() => {
    if (activeConv) return activeConv.panelOpen;
    try {
      const saved = localStorage.getItem('ater_lesson_panel_open');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const activeLessonPath = firstRealLessonPath(
    preview?.notePath,
    activeNotePath,
    localStorage.getItem('ater_study_active_note_path'),
    localStorage.getItem('ater_canonical_lesson_path'),
    localStorage.getItem('ater_original_note_path'),
  ) || '';
  const activeLessonTitle = (!isTemporaryLessonPath(preview?.notePath) && preview?.title)
    ? preview.title
    : cleanTitle(activeLessonPath.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || '');

  const openCurrentLesson = useCallback(async () => {
    let nextPreview = preview;
    const savedPreview = localStorage.getItem('ater_lesson_preview');
    if (!nextPreview && savedPreview) {
      try {
        nextPreview = JSON.parse(savedPreview);
      } catch {
        nextPreview = null;
      }
    }

    const path = firstRealLessonPath(
      nextPreview?.notePath,
      activeNotePath,
      localStorage.getItem('ater_study_active_note_path'),
      localStorage.getItem('ater_canonical_lesson_path'),
      localStorage.getItem('ater_original_note_path'),
    ) || '';

    if (nextPreview && path && nextPreview.notePath !== path) {
      nextPreview = {
        ...nextPreview,
        title: cleanTitle(path.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || nextPreview.title || 'Lesson'),
        lessonPath: path,
        notePath: path,
      };
    }

    if (!nextPreview && path) {
      nextPreview = {
        title: cleanTitle(path.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || 'Lesson'),
        lessonPath: path,
        notePath: path,
        hubPath: '',
        previewUrl: '',
      };
    }

    if (!nextPreview) {
      toast.error('No active lesson found to continue.');
      return;
    }

    setPreview(nextPreview);
    if (nextPreview.notePath) {
      onNoteSelect?.(nextPreview.notePath);
      localStorage.setItem('ater_study_active_note_path', nextPreview.notePath);
      localStorage.setItem('ater_canonical_lesson_path', nextPreview.notePath);
      localStorage.setItem('ater_original_note_path', nextPreview.notePath);
    }

    const activeSessionId = localStorage.getItem('ater_active_session_id');
    if (activeSessionId && !tutorSession) {
      try {
        const session = await sidecarApi.getTutorStatus(activeSessionId);
        if (session) setTutorSession(session);
      } catch (err) {
        console.error('[Oracle] Failed to restore tutor session:', err);
      }
    } else if (nextPreview.hubPath && !tutorSession) {
      try {
        const session = await sidecarApi.getTutorSessionByHub(nextPreview.hubPath);
        if (session) setTutorSession(session);
      } catch (err) {
        console.error('[Oracle] Failed to restore tutor session by hub:', err);
      }
    }

    setPanelOpen(true);
    localStorage.setItem('ater_lesson_panel_open', JSON.stringify(true));
  }, [activeNotePath, onNoteSelect, preview, tutorSession]);

  const handleAttachFile = async () => {
    let assistantIndex = messages.length + 1
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Document', extensions: ['pdf', 'txt', 'md'] }]
      })

      if (!selected || typeof selected !== 'string') return

      const parts = selected.split(/[/\\]/)
      const fileName = parts[parts.length - 1] || 'document.pdf'

      setIsLoading(true);
      setActiveStatus('Saving to Inbox...');

      const userMsg = { role: 'user' as const, content: `Please process the source document: ${fileName}` }
      setMessages(prev => [...prev, userMsg])

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Source Document: ${fileName}\n\nStarting background deployment...`
      }])

      // 1. Upload/Copy file natively to Inbox
      const uploadRes = await sidecarApi.aterInboxUpload(selected, fileName)
      const inboxFilePath = uploadRes.path

      // 2. Pure detection
      setActiveStatus('Detecting curriculum...')
      setMessages(prev => {
        const next = [...prev]
        next[assistantIndex] = {
          role: 'assistant',
          content: `Source Document: ${fileName}\n\n- Saved to Inbox\n- Detecting semester and course curriculum structure...`
        }
        return next
      })

      const detectRes = await sidecarApi.aterProcess({ file_path: inboxFilePath })
      const curriculum = detectRes.detected_curriculum || {}
      const semesterName = curriculum.semester || 'General'
      const courseName = curriculum.course || 'General_Knowledge'
      const unitNum = curriculum.unit || ''
      const hubTitle = curriculum.hub_title || 'General'

      // 3. Plan Generation
      setActiveStatus('Generating learning plan...')
      setMessages(prev => {
        const next = [...prev]
        next[assistantIndex] = {
          role: 'assistant',
          content: `Source Document: ${fileName}\n\n- Saved to Inbox\n- Detected curriculum: ${semesterName} / ${courseName}\n- Planning learning roadmap...`
        }
        return next
      })

      const planRes = await sidecarApi.aterGeneratePlan({
        file_path: inboxFilePath,
        curriculum: curriculum
      })

      const planStructured = planRes.plan_structured || {}
      const sessionId = planRes.session_id

      // Extract titles and chapters
      const atomicNotes: any[] = planStructured.atomic_notes || []
      const allResults = atomicNotes.map(n => typeof n === 'string' ? n : n.title)
      const chapters: any[] = planStructured.chapters || []

      const cleanCourseTitle = courseName.replace(/[^a-zA-Z0-9]/g, '_')
      const cleanHubTitle = hubTitle.replace(/[^a-zA-Z0-9]/g, '_')
      const canonicalHubPath = `Inbox/Generated/${semesterName}/${cleanCourseTitle}/${unitNum ? `${unitNum}_` : ''}${cleanHubTitle}_Hub.md`

      // Compile roadmap markdown exactly matching the from-scratch design:
      const lessonTitle = `${courseName} — ${hubTitle.replace(/[_-]/g, ' ')}`
      let roadmapMarkdown = `## ${lessonTitle} — Learning Roadmap\n\n`
      roadmapMarkdown += `${chapters.length || allResults.length} chapters · ${allResults.length} lessons planned for: *${fileName}*\n\n`
      roadmapMarkdown += `---\n\n`

      if (chapters.length > 0) {
        const chapterCards = chapters.map((ch, chIdx) => {
          const chTitle = ch.title || 'Chapter'
          const notes = ch.atomic_notes || []
          const notesLines = notes.map((note: string) => `- [ ] ${note.replace(/[_-]/g, ' ')}`).join('\n')
          return `**Chapter ${chIdx + 1} — ${chTitle}**  \n*(${notes.length} Atomic Notes)*\n\nAtomic Notes:\n\n${notesLines}`
        })
        roadmapMarkdown += chapterCards.join('\n\n---\n\n')
      } else {
        allResults.forEach((note, idx) => {
          roadmapMarkdown += `${idx + 1}. **${note.replace(/[_-]/g, ' ')}**\n`
        })
      }
      roadmapMarkdown += `\n\n---\n\nClick **Start Lesson** to generate the full lesson workspace.`

      setPendingPdfSession({
        sessionId,
        hubPath: canonicalHubPath,
        semesterName,
        courseName,
        unitNum,
        hubTitle,
        results: allResults
      })

      setMessages(prev => {
        const next = [...prev]
        next[assistantIndex] = {
          role: 'assistant',
          content: roadmapMarkdown
        }
        return next
      })

    } catch (err: any) {
      const errMsg = err.message || 'Processing failed'
      console.error(err)
      setMessages(prev => {
        const next = [...prev]
        next[assistantIndex] = {
          role: 'assistant',
          content: `Processing Failed\n\nError: ${errMsg}`
        }
        return next
      })
      toast.error(errMsg)
    } finally {
      setIsLoading(false)
      setActiveStatus(null)
    }
  }

  // If activeConversationId is null and we have messages, initialize activeConversationId
  useEffect(() => {
    if (!activeConversationId && messages.length > 0) {
      const newId = `ater-conv-${Date.now()}`;
      setActiveConversationId(newId);
      localStorage.setItem('ater_oracle_active_conversation_id', newId);

      const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'New Chat';
      const title = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;

      const newConv: SavedConversation = {
        id: newId,
        title,
        messages,
        preview,
        panelOpen,
        timestamp: Date.now()
      };

      setConversations(prev => {
        const updated = [newConv, ...prev];
        localStorage.setItem('ater_oracle_conversations', JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeConversationId, messages]);

  // Sync active conversation changes to the list
  useEffect(() => {
    if (!activeConversationId) return;

    setConversations(prev => {
      const index = prev.findIndex(c => c.id === activeConversationId);
      const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'New Chat';
      const title = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;

      if (index > -1) {
        const existing = prev[index];
        if (
          JSON.stringify(existing.messages) === JSON.stringify(messages) &&
          JSON.stringify(existing.preview) === JSON.stringify(preview) &&
          existing.panelOpen === panelOpen
        ) {
          return prev;
        }

        const updated = [...prev];
        updated[index] = {
          ...existing,
          title: existing.title === 'New Chat' ? title : existing.title,
          messages,
          preview,
          panelOpen,
          timestamp: Date.now()
        };
        localStorage.setItem('ater_oracle_conversations', JSON.stringify(updated));
        return updated;
      } else {
        const newConv: SavedConversation = {
          id: activeConversationId,
          title,
          messages,
          preview,
          panelOpen,
          timestamp: Date.now()
        };
        const updated = [newConv, ...prev];
        localStorage.setItem('ater_oracle_conversations', JSON.stringify(updated));
        return updated;
      }
    });
  }, [messages, preview, panelOpen, activeConversationId]);

  useEffect(() => {
    if (preview) {
      if (!isTemporaryLessonPath(preview.notePath)) {
        localStorage.setItem('ater_lesson_preview', JSON.stringify(preview));
      }
    } else {
      localStorage.removeItem('ater_lesson_preview');
    }
  }, [preview]);

  useEffect(() => {
    localStorage.setItem('ater_lesson_panel_open', JSON.stringify(panelOpen));
  }, [panelOpen]);

  // Save messages to localStorage for backward compatibility
  useEffect(() => {
    localStorage.setItem('ater_oracle_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleClearCurrentChat = useCallback(async () => {
    if (activeConversationId) {
      try {
        await sidecarApi.deleteConversation(activeConversationId, true);
        loadConversations();
      } catch (err) {
        console.error('[Oracle] Clear failed:', err);
      }
    }
    setMessages([]);
    setPreview(null);
    setPanelOpen(false);
    useArtifactStore.getState().resetArtifacts();
    generatedSpecRef.current.clear();
    if (onNoteSelect) {
      onNoteSelect(null);
    }
    toast.success('Chat cleared.');
  }, [activeConversationId, onNoteSelect, loadConversations]);

  // Listen to the custom clear event from header
  useEffect(() => {
    window.addEventListener('ater-clear-chat', handleClearCurrentChat);
    return () => window.removeEventListener('ater-clear-chat', handleClearCurrentChat);
  }, [handleClearCurrentChat]);

  const handleSelectConversation = useCallback(async (convId: string) => {
    if (isLoading) {
      toast.warning("Please wait until response is complete.");
      return;
    }
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    setActiveConversationId(convId);
    localStorage.setItem('ater_oracle_active_conversation_id', convId);

    useArtifactStore.getState().resetArtifacts();

    await loadMessages(convId);
    setPreview(conv.preview);
    setPanelOpen(conv.panelOpen);
    if (onNoteSelect) {
      onNoteSelect(conv.preview ? (conv.preview.notePath || conv.preview.lessonPath || null) : null);
    }
  }, [conversations, isLoading, onNoteSelect, loadMessages]);

  const handleNewChat = useCallback(async () => {
    if (isLoading) {
      toast.warning("Please wait until response is complete.");
      return;
    }
    try {
      const created = await sidecarApi.createConversation('New Chat');
      if (created && created.id) {
        setActiveConversationId(created.id);
        localStorage.setItem('ater_oracle_active_conversation_id', created.id);
        loadConversations();
        setMessages([]);
        setPreview(null);
        setPanelOpen(false);
        useArtifactStore.getState().resetArtifacts();
        generatedSpecRef.current.clear();
        if (onNoteSelect) {
          onNoteSelect(null);
        }
      }
    } catch (err) {
      toast.error('Failed to create new conversation');
    }
  }, [isLoading, onNoteSelect, loadConversations]);

  const handleDeleteConversation = useCallback(async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (isLoading) {
      toast.warning("Please wait until response is complete.");
      return;
    }

    try {
      await sidecarApi.deleteConversation(convId, true);
      const updated = conversations.filter(c => c.id !== convId);
      setConversations(updated);

      if (activeConversationId === convId) {
        if (updated.length > 0) {
          const first = updated[0];
          setActiveConversationId(first.id);
          localStorage.setItem('ater_oracle_active_conversation_id', first.id);
          await loadMessages(first.id);
          setPreview(first.preview);
          setPanelOpen(first.panelOpen);
          if (onNoteSelect) {
            onNoteSelect(first.preview ? (first.preview.notePath || first.preview.lessonPath || null) : null);
          }
        } else {
          setActiveConversationId(null);
          localStorage.removeItem('ater_oracle_active_conversation_id');
          setMessages([]);
          setPreview(null);
          setPanelOpen(false);
          useArtifactStore.getState().resetArtifacts();
          generatedSpecRef.current.clear();
          if (onNoteSelect) {
            onNoteSelect(null);
          }
        }
      }
      toast.success('Conversation deleted.');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  }, [activeConversationId, isLoading, onNoteSelect, conversations, loadMessages]);

  useEffect(() => {
    setSidebarContent(
      <div className="flex flex-col w-full min-h-0 text-left">
        {/* Tab Selector */}
        <div className="flex border-b border-border/20 text-[9px] font-black tracking-widest mb-3 shrink-0 select-none">
          <button
            onClick={() => setSearchParams({ tab: 'ater' })}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              activeTab === 'ater'
                ? "text-foreground border-foreground font-black"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/10"
            )}
          >
            ATER
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'pipeline' })}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              activeTab === 'pipeline'
                ? "text-foreground border-foreground font-black"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/10"
            )}
          >
            PIPELINE
          </button>
        </div>

        {activeTab === 'ater' ? (
          <div className="flex flex-col w-full min-h-0">
            <div className="px-2 pb-2 flex items-center justify-between shrink-0 select-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conversations</span>
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button
                    onClick={() => window.dispatchEvent(new Event('ater-clear-chat'))}
                    className="p-1 hover:bg-muted rounded-[6px] text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear Active Chat"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <button
                  onClick={handleNewChat}
                  className="p-1 hover:bg-muted rounded-[6px] text-muted-foreground hover:text-foreground transition-colors"
                  title="New Chat"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-0.5 pr-1">
              {conversations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground/30 text-[9px] font-black uppercase tracking-widest select-none">
                  No past chats
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        "group relative flex items-center justify-between px-3 py-1.5 rounded-[6px] cursor-pointer transition-all text-left text-[11px]",
                        isActive
                          ? "bg-muted/80 text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <span className="truncate max-w-[150px] select-none">
                        {conv.title || 'Untitled Chat'}
                      </span>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-[4px] transition-all ml-1 shrink-0"
                        title="Delete Chat"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 px-1 py-2 text-xs">
            <div className="flex items-center justify-between bg-muted/20 border border-border/30 px-3 py-2 rounded-[8px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auto-Ingest</span>
              <button
                onClick={toggleAutoDeploy}
                className={cn(
                  "relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent focus:outline-none transition-colors",
                  config?.autoDeploy ? 'bg-foreground' : 'bg-muted-foreground/30'
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-3 w-3 mt-0.5 transform rounded-full bg-bento-bg shadow ring-0 transition-transform",
                  config?.autoDeploy ? 'translate-x-4' : 'translate-x-0.5'
                )} />
              </button>
            </div>
            <button
              onClick={() => { fetchInbox(); fetchStatus(); }}
              className="w-full flex items-center justify-center gap-2 h-9 bg-muted/20 border border-border/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30 rounded-[8px] transition-all"
            >
              <RefreshCw size={12} />
              Refresh Queue
            </button>
          </div>
        )}
      </div>
    , 'agents');
  }, [conversations, activeConversationId, activeTab, config?.autoDeploy, messages.length, setSidebarContent, handleNewChat, handleSelectConversation, handleDeleteConversation]);

  useEffect(() => {
    return () => {
      setSidebarContent(null, 'agents');
    };
  }, [setSidebarContent]);

  const handleClearHistory = () => {
    setConversations([]);
    localStorage.removeItem('ater_oracle_conversations');
    setActiveConversationId(null);
    localStorage.removeItem('ater_oracle_active_conversation_id');
    setMessages([]);
    useArtifactStore.getState().resetArtifacts();
    generatedSpecRef.current.clear();
    setPreview(null);
    setPanelOpen(false);
    if (onNoteSelect) {
      onNoteSelect(null);
    }
    toast.success('All conversation history cleared.');
  };

  useEffect(() => {
    for (const [messageIndex, msg] of messages.entries()) {
      if (msg.role !== 'assistant') continue;
      const extracted = extractArtifacts(msg.content);

      if (extracted.artifacts.length > 0) {
        const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const mappedArtifacts = extracted.artifacts.map((artifact) => {
          const topicId = `oracle-topic-${slugify(artifact.title)}`;
          return {
            ...artifact,
            id: topicId,
            messageIndex,
            versions: artifact.versions.map((version) => ({
              ...version,
              messageIndex,
              chapters: version.chapters.map((chapter) => ({
                ...chapter,
                id: `${topicId}-${chapter.id}`,
              })),
            })),
          };
        });

        const stateBefore = useArtifactStore.getState();
        const previousCodesByArtifact: Record<string, string> = {};
        for (const artifact of mappedArtifacts) {
          const existingArtifact = stateBefore.artifacts.find(item => item.id === artifact.id);
          const activeVersionNumber = existingArtifact ? stateBefore.activeVersionByArtifact[existingArtifact.id] : undefined;
          const activeVersion = existingArtifact?.versions.find(v => v.version === activeVersionNumber) || (existingArtifact ? existingArtifact.versions[existingArtifact.versions.length - 1] : undefined);
          const previousCode = activeVersion?.chapters.find(c => c.sandbox)?.sandbox || '';
          previousCodesByArtifact[artifact.id] = previousCode;
        }

        useArtifactStore.getState().registerArtifacts(mappedArtifacts);

        for (const artifact of mappedArtifacts) {
          const version = artifact.versions[0];
          for (const [chapterIndex, chapter] of version.chapters.entries()) {
            if (!chapter.sandboxSpec) continue;
            const key = `${messageIndex}:${artifact.id}:${chapter.id}:${chapter.sandboxSpec}`;
            if (generatedSpecRef.current.has(key)) continue;
            generatedSpecRef.current.add(key);

            const previousCode = previousCodesByArtifact[artifact.id] || '';

            const checkAndGenerate = async () => {
              const isOnline = navigator.onLine;
              if (!isOnline) {
                console.warn("Skipping sandbox compilation: browser is offline");
                useArtifactStore.getState().recordCompileError(artifact.id, "Browser is offline. Connect to the internet to compile.");
                return;
              }
              try {
                const health = await sidecarApi.health();
                if (health.status !== 'ok') {
                  console.warn("Skipping sandbox compilation: sidecar unhealthy");
                  useArtifactStore.getState().recordCompileError(artifact.id, "FastAPI sidecar service is unhealthy.");
                  return;
                }
              } catch {
                console.warn("Skipping sandbox compilation: sidecar unreachable");
                useArtifactStore.getState().recordCompileError(artifact.id, "FastAPI sidecar service is unreachable.");
                return;
              }

              try {
                const result = await sidecarApi.generateArtifactCode({
                  prompt: chapter.sandboxSpec!,
                  context: msg.content,
                  previous_code: previousCode
                });
                const code = result.code || result.answer || '';
                if (!code) {
                  useArtifactStore.getState().recordCompileError(artifact.id, "FastAPI sidecar generated empty code.");
                  return;
                }
                const chapters = version.chapters.map((item) => (
                  item.id === chapter.id ? { ...item, sandbox: code } : item
                ));
                useArtifactStore.getState().recordCompileError(artifact.id, null);
                useArtifactStore.getState().addVersion(artifact.id, chapters, code, messageIndex);
              } catch (err: any) {
                console.error("Failed to generate sandbox code:", err);
                useArtifactStore.getState().recordCompileError(artifact.id, err?.message || String(err));
              }
            };

            checkAndGenerate();
          }
        }
      }

      for (const spec of extracted.sandboxSpecs) {
        const key = `${messageIndex}:${spec.placeholderId}:${spec.prompt}`;
        if (generatedSpecRef.current.has(key)) continue;
        generatedSpecRef.current.add(key);

        const artifactId = `oracle-message-${messageIndex}-${spec.placeholderId}`;
        useArtifactStore.getState().registerArtifacts([{
          id: artifactId,
          title: spec.prompt,
          versions: [{
            version: 1,
            messageIndex,
            raw: `<sandbox-spec>${spec.prompt}</sandbox-spec>`,
            chapters: [{
              id: `${artifactId}-chapter-1`,
              title: 'Generated Sandbox',
              content: '',
              sandboxSpec: spec.prompt,
              sandboxPlaceholderId: spec.placeholderId,
            }],
          }],
        }]);

        const checkAndGenerateSpec = async () => {
          const isOnline = navigator.onLine;
          if (!isOnline) {
            console.warn("Skipping sandbox compilation: browser is offline");
            useArtifactStore.getState().recordCompileError(artifactId, "Browser is offline. Connect to the internet to compile.");
            return;
          }
          try {
            const health = await sidecarApi.health();
            if (health.status !== 'ok') {
              console.warn("Skipping sandbox compilation: sidecar unhealthy");
              useArtifactStore.getState().recordCompileError(artifactId, "FastAPI sidecar service is unhealthy.");
              return;
            }
          } catch {
            console.warn("Skipping sandbox compilation: sidecar unreachable");
            useArtifactStore.getState().recordCompileError(artifactId, "FastAPI sidecar service is unreachable.");
            return;
          }

          try {
            const result = await sidecarApi.generateArtifactCode({ prompt: spec.prompt, context: msg.content });
            const code = result.code || result.answer || '';
            if (!code) {
              useArtifactStore.getState().recordCompileError(artifactId, "FastAPI sidecar generated empty code.");
              return;
            }
            useArtifactStore.getState().recordCompileError(artifactId, null);
            useArtifactStore.getState().addVersion(artifactId, [{
              id: `${artifactId}-chapter-1-generated`,
              title: 'Generated Sandbox',
              content: '',
              sandbox: code,
            }], code, messageIndex);
          } catch (err: any) {
            console.error("Failed to generate sandbox code:", err);
            useArtifactStore.getState().recordCompileError(artifactId, err?.message || String(err));
          }
        };

        checkAndGenerateSpec();
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const onMove = (event: MouseEvent) => {
      const viewportWidth = window.innerWidth || 1;
      const rightWidth = viewportWidth - event.clientX;
      useArtifactStore.getState().setPanelWidth((rightWidth / viewportWidth) * 100);
    };
    const onUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDraggingSplit]);

  useEffect(() => {
    if (!preview?.hubPath) {
      setTutorSession(null);
      return;
    }

    let active = true;
    const fetchSession = async () => {
      try {
        let session = await sidecarApi.getTutorSessionByHub(preview.hubPath!);
        if (!session) {
          const sessId = `tutor_${preview.hubPath!.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
          session = await sidecarApi.startTutorSession({
            session_id: sessId,
            hub_path: preview.hubPath!,
            mode: 'Progressive'
          });
        }
        if (active) {
          setTutorSession(session);
        }
      } catch (err) {
        console.error('Failed to get or start tutor session in agents.tsx:', err);
      }
    };

    fetchSession();
    const timer = setInterval(fetchSession, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [preview?.hubPath]);


  const handleWikiLinkClick = useCallback(async (pageName: string) => {
    try {
      const searchRes = await sidecarApi.findVaultPage(pageName);
      if (searchRes.found && searchRes.path) {
        if (onNoteSelect) {
          onNoteSelect(searchRes.path);
        } else {
          navigate(`/obsidian?path=${encodeURIComponent(searchRes.path)}`);
        }
      } else {
        navigate(`/obsidian?search=${encodeURIComponent(pageName)}`);
      }
    } catch (err) {
      toast.error('Could not navigate to note.');
    }
  }, [navigate, onNoteSelect]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const isStartLesson = text.toLowerCase() === 'start lesson' || text.toLowerCase() === 'start';

    if (isStartLesson && pendingPdfSession) {
      try {
        const customAction = pendingPdfSession;
        setIsLoading(true);
        setActiveStatus('Deploying workspace...');

        let currentHasMore = true;
        let tempBatch = 0;
        const deployedNotePaths: string[] = [];
        let deployedHubPath = '';

        while (currentHasMore) {
          const res = await sidecarApi.aterConfirm({ session_id: customAction.sessionId });
          if (res.status === 'error') {
            throw new Error(res.message || res.detail || "Deployment failed.");
          }
          if (res.results) {
            res.results.forEach((r: any) => {
              if (r.path) {
                if (r.title.toLowerCase().endsWith('_hub') || r.path.toLowerCase().includes('_hub.md')) {
                  deployedHubPath = r.path;
                } else {
                  deployedNotePaths.push(r.path);
                }
              }
            });
          }
          tempBatch = res.current_batch || (tempBatch + 1);
          currentHasMore = res.has_more;
        }

        const finalHubPath = deployedHubPath || customAction.hubPath;

        let curriculumPaths = deployedNotePaths;
        if (curriculumPaths.length === 0) {
          curriculumPaths = customAction.results.map((note: string) => {
            const cleanCourseTitle = customAction.courseName.replace(/[^a-zA-Z0-9]/g, '_');
            const noteFilename = `${note}.md`;
            return `Inbox/Generated/${customAction.semesterName}/${cleanCourseTitle}/${noteFilename}`;
          });
        }

        const firstLessonPath = curriculumPaths[0] || finalHubPath;
        localStorage.setItem('ater_original_note_path', firstLessonPath);

        setPreview({
          title: customAction.hubTitle.replace(/[_-]/g, ' '),
          lessonPath: finalHubPath,
          notePath: firstLessonPath,
          hubPath: finalHubPath,
          previewUrl: '',
        });
        localStorage.setItem('ater_study_active_note_path', firstLessonPath);
        localStorage.setItem('ater_canonical_lesson_path', firstLessonPath);
        onNoteSelect?.(firstLessonPath);

        setTutorSession({
          session_id: customAction.sessionId,
          hub_path: finalHubPath,
          current_note_path: firstLessonPath,
          completed_notes: [],
          wagers: {},
          score: 0,
          status: 'active',
          updated_at: new Date().toISOString(),
          active_note_unlocks: [firstLessonPath],
          curriculum: curriculumPaths,
        });

        setPendingPdfSession(null);
        setPanelOpen(true);
      } catch (err: any) {
        toast.error(err.message || 'Failed to start lesson');
      } finally {
        setIsLoading(false);
        setActiveStatus(null);
      }
      return;
    }

    if (isStartLesson) {
      setIsGeneratingLesson(true);
      setGeneratingStatus('Initiating lesson creation...');
      setPreview({
        title: 'Generating Lesson...',
        lessonPath: '',
        notePath: '',
        hubPath: '',
        previewUrl: '',
      });
      setPanelOpen(true);
    } else {
      setIsGeneratingLesson(false);
      setGeneratingStatus(null);
    }

    let currentId = activeConversationId;
    if (!currentId) {
      try {
        const created = await sidecarApi.createConversation('New Chat');
        currentId = created.id;
        setActiveConversationId(currentId);
        localStorage.setItem('ater_oracle_active_conversation_id', currentId!);
      } catch (err) {
        toast.error('Failed to initialize conversation');
        setIsLoading(false);
        setActiveStatus(null);
        return;
      }
    }

    if (!textToSend) {
      setInput('');
    }

    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setIsLoading(true);
    setActiveStatus('Initiating query...');

    try {
      // 1. Run local RAG query
      let ragContext = '';
      const COMMAND_VERBS = /\b(add|create|delete|remove|update|set|navigate|go|show|open)\b/i;
      const SCHEMA_OBJECTS = /\b(course|semester|assignment|exam|year|hub|tab|view)\b/i;

      const shouldSkipRag = COMMAND_VERBS.test(text) && SCHEMA_OBJECTS.test(text);

      if (!shouldSkipRag) {
        setActiveStatus('Running semantic vector search...');
        try {
          const searchResults = await sidecarApi.search_similar(text, 5);
          if (searchResults && searchResults.length > 0) {
            ragContext = searchResults
              .map(r => `[Note: ${r.filename}] (Path: ${r.folder}/${r.filename})\nContent:\n${r.content}`)
              .join("\n\n");
          }
        } catch (ragErr) {
          console.error('[Oracle RAG] RAG fetch failed:', ragErr);
        }
      }

      // 2. Gather active user context
      const recentNotes = studyHistory
        .filter(item => item.type === 'note_focus')
        .slice(-3)
        .map(item => item.notePath)
        .filter(Boolean) as string[];

      const pomodoroState = usePomodoroStore.getState();
      const userContext = {
        display_name: config?.displayName,
        program_configured: config?.isProgramConfigured,
        active_hub: currentHub,
        recent_notes: recentNotes,
        pomodoro: {
          is_active: pomodoroState.isActive,
          time_left: pomodoroState.timeLeft,
          mode: pomodoroState.mode,
          session_count: pomodoroState.sessionCount,
          current_hub: pomodoroState.currentHub
        },
        obsidian_vault_path: config?.obsidianVaultPath,
        inbox_path: config?.inboxPath,
        auto_deploy: config?.autoDeploy,
      };

      const getActiveArtifactPayload = () => {
        const state = useArtifactStore.getState();
        const artifact = state.artifacts.find((item) => item.id === state.activeArtifactId);
        if (!artifact) return undefined;
        const versions = artifact.versions || [];
        const lastVersion = versions[versions.length - 1];
        const versionNumber = state.activeVersionByArtifact[artifact.id] || lastVersion?.version || 1;
        const version = versions.find((item) => item.version === versionNumber) || lastVersion;
        const chapters = version?.chapters || [];
        const sandboxChapter = chapters.find((chapter) => chapter.sandbox);
        const code = sandboxChapter?.sandbox || version?.raw || '';
        if (!code) return undefined;
        return {
          title: artifact.title,
          version: version?.version || 1,
          code,
        };
      };

      // 3. Call Assistant Stream API
      setActiveStatus('Contacting assistant...');
      const parentMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;

      const response = await sidecarApi.streamConversationTurn(currentId!, {
        message: text,
        parent_message_id: parentMessageId,
        rag_context: ragContext,
        active_artifact: getActiveArtifactPayload(),
        user_context: userContext
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setMessages(prev => [...prev, { role: 'assistant', content: '', status: 'incomplete' }]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body has no reader.');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'run_start') {
              setActiveRunId(parsed.run_id);
            } else if (parsed.type === 'status') {
              setActiveStatus(parsed.message);
              setGeneratingStatus(parsed.message);
            } else if (parsed.type === 'chunk') {
              setActiveStatus(null);
              assistantContent += parsed.content;
              setMessages(prev => {
                const next = [...prev];
                const lastIndex = next.length - 1;
                if (lastIndex >= 0 && next[lastIndex].role === 'assistant') {
                  next[lastIndex] = { ...next[lastIndex], content: assistantContent };
                }
                return next;
              });
            } else if (parsed.type === 'lesson_created') {
              setIsGeneratingLesson(false);
              setGeneratingStatus(null);
              if (onNoteSelect) {
                onNoteSelect(null);
              }
              const notePath = parsed.note_path || parsed.lesson_path || '';
              const hubPath = parsed.hub_path || '';
              if (notePath) {
                localStorage.setItem('ater_study_active_note_path', notePath);
                if (!isTemporaryLessonPath(notePath)) {
                  localStorage.setItem('ater_canonical_lesson_path', notePath);
                  localStorage.setItem('ater_original_note_path', notePath);
                }
              }
              setPreview({
                title: parsed.title || 'Teacher Lesson',
                lessonPath: parsed.lesson_path || '',
                notePath,
                hubPath,
                previewUrl: '',
              });
              if (Array.isArray(parsed.curriculum) && parsed.curriculum.length > 0) {
                setTutorSession({
                  session_id: `teacher_${parsed.workspace || Date.now()}`,
                  hub_path: hubPath,
                  current_note_path: notePath,
                  completed_notes: [],
                  wagers: {},
                  score: 0,
                  status: 'active',
                  updated_at: new Date().toISOString(),
                  active_note_unlocks: [notePath],
                  curriculum: parsed.curriculum,
                });
              }
              if (notePath && onNoteSelect) {
                onNoteSelect(notePath);
              }
              setPanelOpen(true);
            } else if (parsed.type === 'action') {
              if (parsed.action === 'navigate' && parsed.route) {
                navigate(parsed.route);
              } else if (parsed.action === 'toast' && parsed.message) {
                toast.info(parsed.message);
              } else if (parsed.action === 'pomodoro_start') {
                const store = usePomodoroStore.getState();
                if (parsed.duration_minutes) {
                  store.setTimeLeft(parsed.duration_minutes * 60);
                }
                if (parsed.hub_id) {
                  store.setCurrentHub(parsed.hub_id);
                }
                store.setIsActive(true);
                store.setShowOverlay(true);
                toast.success(`Pomodoro focus session started!`);
              } else if (parsed.action === 'pomodoro_pause') {
                const store = usePomodoroStore.getState();
                store.setIsActive(!store.isActive);
                toast.info(store.isActive ? "Pomodoro resumed." : "Pomodoro paused.");
              } else if (parsed.action === 'pomodoro_stop') {
                const store = usePomodoroStore.getState();
                store.setIsActive(false);
                store.setTimeLeft(25 * 60);
                toast.success("Pomodoro session stopped and reset.");
              } else if (parsed.action === 'pomodoro_set_hub' && parsed.hub_id) {
                const store = usePomodoroStore.getState();
                store.setCurrentHub(parsed.hub_id);
                toast.success(`Pomodoro hub set to ${parsed.hub_id.replace(/_/g, ' ')}.`);
              } else if (parsed.action === 'pomodoro_show_hud') {
                const store = usePomodoroStore.getState();
                store.setShowOverlay(true);
                toast.info("Opening Focus HUD");
              } else if (parsed.action === 'update_config' && parsed.key_values) {
                try {
                  await saveConfig(parsed.key_values);
                  toast.success('Settings updated.');
                } catch {
                  toast.error('Failed to save settings.');
                }
              } else if (parsed.action === 'factory_reset') {
                try {
                  await sidecarApi.factoryReset();
                  toast.success('Factory reset complete. Reloading...');
                  setTimeout(() => window.location.reload(), 1500);
                } catch {
                  toast.error('Factory reset failed.');
                }
              } else if (parsed.action === 'clear_study_history') {
                try {
                  await sidecarApi.clearStudyHistory();
                  toast.success('Study history cleared.');
                } catch {
                  toast.error('Failed to clear study history.');
                }
              } else if (parsed.action === 'toggle_auto_deploy') {
                try {
                  await saveConfig({ autoDeploy: parsed.state });
                  await sidecarApi.aterWatcherToggle();
                  toast.success(`Auto-deploy ${parsed.state ? 'enabled' : 'disabled'}.`);
                } catch {
                  toast.error('Failed to toggle auto-deploy.');
                }
              } else if (parsed.action === 'feynman_validated') {
                const score = parsed.score ?? 0;
                const feedback = parsed.feedback ?? '';
                if (parsed.is_valid) {
                  toast.success(`Feynman validated ✓ Score: ${score}/100`);
                } else {
                  toast.warning(`Feynman check: ${feedback || 'Needs improvement.'}`);
                }
              }
            }
          } catch (e) {}
        }
      }
      if (config?.isDemoMode) {
        dispatchWalkthroughTrigger('oracle_queried');
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Connection failed'}`);
      setIsGeneratingLesson(false);
      setGeneratingStatus(null);
      setPanelOpen(false);
    } finally {
      setIsLoading(false);
      setActiveStatus(null);
      setActiveRunId(null);
      loadConversations();
    }
  };

  const handleSendMessageRef = useRef(handleSendMessage);
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });

  const stableSendMessage = useCallback((textToSend?: string) => {
    handleSendMessageRef.current(textToSend);
  }, []);

  // Report state to parent dashboard for header buttons
  useEffect(() => {
    onStateChange?.({
      hasMessages: messages.length > 0,
      hasPreview: !!preview,
      isPanelOpen: panelOpen || artifactState.isPanelOpen,
      isLessonOpen: !!preview && panelOpen
    });
  }, [messages.length, preview, panelOpen, artifactState.isPanelOpen, onStateChange]);

  // Listen to custom window events for header actions
  useEffect(() => {
    const handleNewChatEvent = () => {
      handleNewChat();
    };
    const handleTogglePanelEvent = () => {
      if (preview) {
        setPanelOpen((prev: boolean) => {
          const next = !prev;
          localStorage.setItem('ater_lesson_panel_open', JSON.stringify(next));
          return next;
        });
      } else if (artifactState.artifacts.length > 0) {
        artifactState.setPanelOpen(!artifactState.isPanelOpen);
      }
    };
    window.addEventListener('ater-new-chat', handleNewChatEvent);
    window.addEventListener('ater-toggle-panel', handleTogglePanelEvent);
    return () => {
      window.removeEventListener('ater-new-chat', handleNewChatEvent);
      window.removeEventListener('ater-toggle-panel', handleTogglePanelEvent);
    };
  }, [handleNewChat, preview, artifactState]);

  const quickActions = [
    { title: "Search Vault", prompt: "What are my notes about...?", icon: Search, description: "Semantic search content." },
    { title: "Generate Quiz", prompt: "Generate a quiz about...", icon: GraduationCap, description: "Active recall test." },
    { title: "Course Info", prompt: "Tell me about my courses", icon: BookOpen, description: "Academic dashboard query." }
  ];

  return (
    <div className="flex-1 flex min-h-0 relative">
      {/* History Sidebar is now rendered in the outer sidebar */}

      {preview && panelOpen ? (
        <LearningWorkspace
          preview={preview}
          tutorSession={tutorSession}
          onTutorSessionChange={setTutorSession}
          onPreviewChange={setPreview}
          onClose={() => setPanelOpen(false)}
          isGenerating={isGeneratingLesson}
          generatingStatus={generatingStatus}
        />
      ) : (
      <div className="flex-1 flex min-h-0 relative">
        <div
          className="flex min-h-0 flex-col flex-1"
          style={{ width: artifactState.isPanelOpen ? `${100 - artifactState.panelWidth}%` : '100%' }}
        >
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 min-w-0 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center -mt-12">
              <h1 className="text-[32px] font-black uppercase tracking-tighter text-foreground">Welcome back, {config?.displayName || 'User'}</h1>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg, index) => (
                <div key={index} className="space-y-2">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end w-full">
                      <div className="max-w-[80%] bg-muted/20 border border-border px-4 py-3 text-[13px] rounded-[12px] text-foreground leading-relaxed">{msg.content}</div>
                    </div>
                  ) : (
                    msg.content ? (
                      <div className="flex justify-start w-full">
                        <div className="max-w-full w-full border border-border bg-bento-card px-6 py-5 text-[13px] rounded-[12px] text-foreground overflow-x-auto flex flex-col gap-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <AterMarkdown content={msg.content.replace(/\(\(([^)]+)\)\)/g, '[[$1]]')} onNavigate={handleWikiLinkClick} onSendMessage={stableSendMessage} />
                          </div>
                          {(() => {
                            const isLastMessage = index === messages.length - 1;
                            const hasRoadmap = msg.content.includes('Start Lesson');
                            const showStartButton = msg.role === 'assistant' && isLastMessage && hasRoadmap && !isLoading;

                            if (msg.customAction) {
                              const customAction = msg.customAction;
                              return (
                                <div className="mt-2 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                                  <p className="text-[10px] text-muted-foreground font-medium">
                                    Ready to begin? Load the generated learning path in your workspace.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const curriculumPaths = customAction.results.map((note: string) => {
                                        const cleanCourseTitle = customAction.courseName.replace(/[^a-zA-Z0-9]/g, '_')
                                        const noteFilename = `${note}.md`
                                        return `Inbox/Generated/${customAction.semesterName}/${cleanCourseTitle}/${noteFilename}`
                                      })
                                      const firstLessonPath = curriculumPaths[0] || customAction.hubPath;
                                      localStorage.setItem('ater_original_note_path', firstLessonPath);

                                      setPreview({
                                        title: customAction.hubTitle.replace(/_/g, ' '),
                                        lessonPath: customAction.hubPath,
                                        notePath: firstLessonPath,
                                        hubPath: customAction.hubPath,
                                        previewUrl: '',
                                      })
                                      localStorage.setItem('ater_study_active_note_path', firstLessonPath);
                                      localStorage.setItem('ater_canonical_lesson_path', firstLessonPath);
                                      onNoteSelect?.(firstLessonPath);

                                      setTutorSession({
                                        session_id: customAction.sessionId,
                                        hub_path: customAction.hubPath,
                                        current_note_path: firstLessonPath,
                                        completed_notes: [],
                                        wagers: {},
                                        score: 0,
                                        status: 'active',
                                        updated_at: new Date().toISOString(),
                                        active_note_unlocks: [firstLessonPath],
                                        curriculum: curriculumPaths,
                                      })

                                      setPanelOpen(true)
                                    }}
                                    className="shrink-0 h-9 px-5 bg-muted/30 text-foreground border border-border/60 font-bold text-[10px] uppercase tracking-wider rounded-[6px] hover:bg-muted/50 transition-all flex items-center gap-2"
                                  >
                                    <BookOpenCheck size={12} />
                                    Open Learning Path
                                  </button>
                                </div>
                              )
                            }

                            if (showStartButton) {
                              return (
                                <div className="mt-2 pt-4 border-t border-border/40 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleSendMessage('Start Lesson')}
                                    disabled={isLoading}
                                    className="h-9 px-5 bg-muted/30 text-foreground border border-border/60 font-bold text-[10px] uppercase tracking-wider rounded-[6px] hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                  >
                                    <BookOpenCheck size={12} />
                                    Start Lesson
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start w-full animate-pulse">
                  <div className="border border-border bg-bento-card px-5 py-4 rounded-[12px] flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{activeStatus || 'Thinking...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/40 bg-muted/10 shrink-0">
          <div className="max-w-3xl mx-auto space-y-3">
            {!panelOpen && activeLessonPath && (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border/60 bg-bento-card px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/60">
                    Active Lesson
                  </div>
                  <div className="truncate text-xs font-black text-foreground">
                    {activeLessonTitle || 'Current Lesson'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void openCurrentLesson()}
                  disabled={isLoading}
                  className="h-9 shrink-0 rounded-[8px] border border-border bg-bento-item px-4 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                >
                  <BookOpenCheck size={13} />
                  Continue Lesson
                </button>
              </div>
            )}
            <div className="relative flex items-center bg-bento-bg border border-border focus-within:border-foreground/30 rounded-[12px] transition-all overflow-hidden">
              <button
                type="button"
                onClick={handleAttachFile}
                disabled={isLoading}
                className="h-9 w-9 ml-1.5 flex items-center justify-center rounded-[8px] hover:bg-bento-item text-muted-foreground hover:text-foreground transition-all duration-150 shrink-0"
                title="Attach Source Document (PDF, TXT, MD)"
              >
                <Paperclip size={15} />
              </button>
              <textarea
                ref={textareaRef}
                data-tour="oracle-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Ask Ater..."
                className="flex-1 min-h-[44px] max-h-[120px] bg-transparent border-none p-3 text-sm focus:outline-none resize-none placeholder:text-muted-foreground/30 font-sans leading-relaxed text-foreground"
                rows={1}
                disabled={isLoading}
              />
              {isLoading && activeRunId ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await sidecarApi.cancelStream(activeRunId);
                      setIsLoading(false);
                      setActiveStatus("Cancelled.");
                      setGeneratingStatus(null);
                      setActiveRunId(null);
                      toast.success("Generation stopped.");
                    } catch (err) {
                      toast.error("Failed to cancel generation");
                    }
                  }}
                  className="h-9 px-4 mr-1.5 flex items-center justify-center rounded-[8px] bg-red-950/20 text-red-500 hover:bg-red-950/40 border border-red-500/20 shrink-0"
                  title="Cancel Generation"
                >
                  <X size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "h-9 px-4 mr-1.5 flex items-center justify-center rounded-[8px] transition-all duration-150 shrink-0",
                    input.trim() && !isLoading
                      ? "bg-muted/50 text-foreground hover:bg-bento-item border border-border/40"
                      : "text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Artifact Side Panel */}
        {(artifactState.artifacts.length > 0 && artifactState.isPanelOpen) ? (
          <>
            <button
              type="button"
              aria-label="Resize side panel"
              onMouseDown={(event) => {
                event.preventDefault();
                setIsDraggingSplit(true);
              }}
              className="w-1.5 shrink-0 cursor-col-resize border-x border-border/40 bg-muted hover:bg-foreground/20"
            />
            <div
              className="min-w-[420px] max-w-[82%] flex flex-col bg-bento-bg border-l border-border/40 min-h-0"
              style={{ width: `${artifactState.panelWidth}%` }}
            >
              <div className="flex-1 flex flex-col min-h-0 relative">
                <ArtifactViewer shielded={isDraggingSplit} />
              </div>
            </div>
          </>
        ) : null}

      </div>
      )}
    </div>
  );
}

/* ─── Optimized UI Components ─── */
function CurriculumPill({
 label,
 value,
 onChange,
 icon: Icon,
 isEditable = true,
 isDropdown = false,
 onClick,
 options = []
}: {
 label: string,
 value: string,
 onChange?: (v: string) => void,
 icon: any,
 isEditable?: boolean,
 isDropdown?: boolean,
 onClick?: () => void,
 options?: string[]
}) {
 const [isMenuOpen, setIsMenuOpen] = useState(false);

 return (
 <div className="relative">
 <div
 onClick={() => {
 if (isDropdown) onClick?.();
 else if (options.length > 0) setIsMenuOpen(!isMenuOpen);
}}
 className={cn(
 "px-2.5 py-1.5 bg-bento-bg border border-border text-xs font-semibold uppercase tracking-tight flex items-center gap-2  hover:bg-muted hover:border-muted-foreground/30",
 (isDropdown || options.length > 0) && "cursor-pointer"
 )}
 >
 <Icon size={14} className="text-muted-foreground group-hover:text-foreground " />
 <div className="flex items-center gap-1.5">
 <span className="text-muted-foreground">{label}:</span>
 {isEditable && options.length === 0 ? (
 <input
 className="bg-transparent border-none focus:outline-none text-foreground font-medium min-w-[20px] placeholder:text-muted-foreground/40 border-b border-transparent focus:border-border "
 value={value}
 onChange={(e) => onChange?.(e.target.value)}
 placeholder="Set..."
 onClick={(e) => e.stopPropagation()}
 />
 ) : (
 <span className="text-foreground font-medium">{value || 'None'}</span>
 )}
 </div>
 {(isDropdown || options.length > 0) && <ChevronDown size={14} className="text-muted-foreground ml-1" />}
 </div>

 {/* Selection Menu for Pills with Options */}
 {isMenuOpen && options.length > 0 && (
 <>
 <div className="fixed inset-0 z-[110]" onClick={() => setIsMenuOpen(false)} />
 <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border shadow-md z-[120] p-1.5 ">
 <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground tracking-tight mb-1">{label} Options</div>
 <div className="max-h-40 overflow-y-auto custom-scrollbar">
 {options.map(opt => (
 <button
 key={opt}
 onClick={() => {
 onChange?.(opt);
 setIsMenuOpen(false);
}}
 className={cn(
 "w-full text-left px-2 py-1.5 text-sm font-medium  hover:bg-muted",
 value === opt && "text-foreground bg-accent"
 )}
 >
 {opt}
 </button>
 ))}
 </div>
 </div>
 </>
 )}
 </div>
 )
}

function BatchTreeView({batches, processedNotes}: {batches: any[], processedNotes: any[]}) {
  const firstPendingRef = useRef<HTMLDivElement | null>(null);

  // Determine sorted list for hook dependency check
  const processedTitles = useMemo(() => {
    if (!processedNotes) return new Set<string>();
    return new Set(processedNotes.map((n: any) => {
      // Robust extraction of title from processed notes
      const raw = typeof n === 'string' ? n : (n?.title ?? (typeof n === 'object' ? JSON.stringify(n) : ''));
      return cleanTitle(raw).toLowerCase().trim();
    }));
  }, [processedNotes]);

  const allNotes: {batchId: number; note: string; isDone: boolean}[] = [];
  batches?.forEach((batch: any) => {
    batch.notes?.forEach((note: string) => {
      const normalizedNote = cleanTitle(note).toLowerCase().trim();
      allNotes.push({
        batchId: batch.id,
        note,
        isDone: processedTitles.has(normalizedNote),
      });
    });
  });

  const sorted = [
    ...allNotes.filter(n => n.isDone),
    ...allNotes.filter(n => !n.isDone),
  ];

  const firstPendingIdx = sorted.findIndex(n => !n.isDone);

  useEffect(() => {
    if (firstPendingIdx !== -1) {
      firstPendingRef.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }
  }, [firstPendingIdx]);

  if (!batches || batches.length === 0) return null;

 return (
 <div className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-2 pb-4 max-h-[340px]">
   {sorted.map((item, idx) => {
     const isCurrentNote = !item.isDone && idx === firstPendingIdx;
     return (
       <div
         key={`${item.batchId}-${item.note}-${idx}`}
         ref={isCurrentNote ? firstPendingRef : null}
         className={cn(
           "flex items-center gap-3 px-2 py-1.5 rounded-[6px] transition-all",
           item.isDone ? "opacity-35" : "opacity-100",
           isCurrentNote && "bg-muted/15 border border-border/40"
         )}       >
         <div className="shrink-0 flex items-center justify-center w-3 h-3">
           {item.isDone ? (
             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
               <circle cx="6" cy="6" r="5" fill="currentColor" className="text-muted-foreground/50" />
             </svg>
           ) : (
             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
               <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"
                 className={isCurrentNote ? "text-foreground" : "text-muted-foreground/30"} />
             </svg>
           )}
         </div>
         <span className={cn(
           "text-[11px] font-black uppercase tracking-widest truncate flex-1",
           item.isDone
             ? "line-through text-muted-foreground/30"
             : isCurrentNote
               ? "text-foreground"
               : "text-muted-foreground/60"
         )}>
           {cleanTitle(item.note)}
         </span>
         {isCurrentNote && (
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 shrink-0">
             Now
           </span>
         )}
       </div>
     );
   })}
 </div>
 )
}

/* ─── Plan Card View Component ─── */
function PlanCardView({planRaw}: {planRaw: string}) {
 const extract = (tag: string) => {
 const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's')
 const match = planRaw.match(regex)
 return match ? match[1].trim() : null
}

 const hubContent = extract('hub_note')
 const pqContent = extract('pq_note')
 const atomicContent = extract('atomic_notes')

 const cleanLink = (text: string) => cleanTitle(text).replace(/\*\*/g, '').replace(/\*/g, '')

 const parseAtomicTree = (text: string) => {
 // Strategy 1: Bulleted/numbered list lines (standard AI output)
 const listLines = text.split('\n').filter(l =>
 l.trim().match(/^\d+\./) || l.trim().startsWith('-') || l.trim().startsWith('*')
 )

 // Strategy 2: Comma-separated [[links]] inline (also common AI output)
 const inlineLinks: string[] = []
 if (listLines.length === 0) {
 const allLinks = [...text.matchAll(/\[\[([^\]]+)\]\]/g)]
 allLinks.forEach(m => inlineLinks.push(m[1]))
}

 if (listLines.length === 0 && inlineLinks.length > 0) {
 // Return flat card nodes from inline links
 return inlineLinks.map(title => ({
 level: 0,
 title: cleanLink(`[[${title}]]`),
 mode: null,
 parent: null,
 pages: [],
 description: ''
}))
}

 return listLines.map(line => {
 // Determine level from indentation
 const indentMatch = line.match(/^(\s*)/)
 const spaces = indentMatch ? indentMatch[1].length : 0
 const level = Math.floor(spaces / 2)

 // Extract content
 const rawContent = line.replace(/^\s*(\d+\.|-|\*)\s*/, '').trim()

 // Extract bits
 const titleMatch = rawContent.match(/\[\[(.*?)\]\]/)
 const modeMatch = rawContent.match(/\(Mode\s+([A-Z]+)\)/i)
 const parentMatch = rawContent.match(/Parent:\s*\[\[(.*?)\]\]/)
 const pagesMatch = rawContent.match(/Pages:\s*\[(.*?)\]/)

 let description = '';
 if (rawContent.includes(':')) {
 // Try to find the description which is usually after the mode and before Parent/Pages
 description = rawContent.split(':').slice(1).join(':')
 .split('Parent:')[0]
 .split('Pages:')[0]
 .trim();
}

 return {
 level,
 title: titleMatch ? cleanLink(titleMatch[1]) : cleanLink(rawContent.split('-')[0]),
 mode: modeMatch ? modeMatch[1] : null,
 parent: parentMatch ? parentMatch[1] : null,
 pages: pagesMatch ? pagesMatch[1].split(',').map(p => p.trim()).filter(p => p) : [],
 description: description
}
})
}

 const atomicTree = atomicContent ? parseAtomicTree(atomicContent) : []

 return (
 <div className="flex flex-col overflow-y-auto custom-scrollbar pr-2 gap-6 h-full">
 <div className="flex flex-col gap-3">
 {hubContent && (
 <div className="border border-border bg-bento-bg p-5 hover:border-muted-foreground/30  group">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-1.5 bg-muted text-foreground">
 <Bot size={16} />
 </div>
 <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Topic</h4>
 </div>
 <div className="text-sm font-medium text-foreground underline decoration-muted-foreground/20 underline-offset-4 cursor-default">
 {cleanLink(hubContent)}
 </div>
 </div>
 )}
 {pqContent && (
 <div className="border border-border bg-bento-bg p-5 hover:border-muted-foreground/30  group">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-1.5 bg-muted text-foreground">
 <ShieldCheck size={16} />
 </div>
 <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Test</h4>
 </div>
 <div className="text-sm font-medium text-foreground underline decoration-muted-foreground/20 underline-offset-4 cursor-default">
 {cleanLink(pqContent)}
 </div>
 </div>
 )}
 </div>

 <div className="flex flex-col gap-4 overflow-visible">
 <div className="flex items-center gap-2 px-1 shrink-0">
 <Layers size={16} className="text-muted-foreground" />
 <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Notes</h4>
 </div>

 <div className="flex flex-col gap-2">
 {atomicTree.map((node, i) => (
 <div
 key={i}
 style={{marginLeft: `${node.level * 24}px`}}
 className={cn(
 "p-3 border bg-bento-bg hover:border-muted-foreground/30 hover:bg-bento-card0  relative overflow-hidden group min-w-0 w-full",
 node.level > 0 ? "border-dashed opacity-90 scale-[1] border-border" : "border-solid border-border shadow-sm"
 )}
 >
 {node.level > 0 && (
 <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border group-hover:bg-muted-foreground/40 " />
 )}
 <div className="flex items-start justify-between gap-4 min-w-0">
 <div className="flex items-start gap-3 min-w-0 flex-1">
 <div className={cn(
 "p-1.5 shrink-0 mt-0.5",
 node.level === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
 )}>
 <FileText size={12} />
 </div>
 <div className="flex flex-col gap-1 min-w-0">
 <div className="font-bold text-[13px] text-foreground truncate group-hover:text-foreground ">
 {node.title}
 {node.mode && (
 <span className="ml-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest border border-border px-1 rounded">
 {node.mode}
 </span>
 )}
 </div>
 {node.description && (
 <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
 {node.description}
 </p>
 )}
 {node.pages.length > 0 && (
 <div className="flex items-center gap-1.5 mt-1.5">
 <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Relevant Pages:</span>
 <div className="flex flex-wrap gap-1">
 {node.pages.map(p => (
 <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground border border-border hover:bg-bento-bg hover:border-muted-foreground/30  cursor-default">
 {p}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 {node.parent && (
 <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-muted-foreground shrink-0">
 <ArrowLeft size={10} />
 <span className="truncate max-w-[80px]">{node.parent}</span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
      </div>
    </div>
  )
}

/* ─── Optimized UI Components ─── */
function AiPressureBar() {
  const pressure = useTelemetryStore(state => state.queueStatus?.governor_pressure);
  const throttleEvent = useTelemetryStore(state => state.queueStatus?.last_throttle_event);

  if (pressure === undefined) return null;

  return (
    <div className="mt-4 flex flex-col gap-1.5 gpu-accelerated">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        <span>AI Pressure</span>
        <span>{Math.round(pressure * 100)}%</span>
      </div>
      <div className="h-1 w-full bg-bento-bg border border-border">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pressure > 0.8 ? "bg-destructive" :
            pressure > 0.5 ? "bg-amber-500" : "bg-foreground"
          )}
          style={{width: `${Math.min(100, pressure * 100)}%`}}
        />
      </div>
      {throttleEvent && (
        <p className="mt-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest animate-pulse">
          Throttled: {throttleEvent}
        </p>
      )}
    </div>
  );
}

/* ─── AI Agents (Ater) Dashboard ─── */
function AterDashboard({onBack}: {onBack: () => void}) {
 const {config, saveConfig} = useConfig()
 const navigate = useNavigate()
 const [searchParams, setSearchParams] = useSearchParams()
 const activeTab = searchParams.get('tab') === 'pipeline' ? 'pipeline' : 'ater'

 // Use Zustand for global telemetry
 const queueStatus = useTelemetryStore(state => state.queueStatus)
 const inboxFiles = useTelemetryStore(state => state.inboxFiles)
 const loadingInbox = useTelemetryStore(state => state.isLoadingInbox)
 const fetchInbox = useTelemetryStore(state => state.fetchInbox)
 const startPolling = useTelemetryStore(state => state.startPolling)
 const stopPolling = useTelemetryStore(state => state.stopPolling)
 const fetchStatus = useTelemetryStore(state => state.fetchStatus)

 const [selectedInboxFile, setSelectedInboxFile] = useState<any>(null)
 const [processing, setProcessing] = useState(false)
 const [activePlan, setActivePlan] = useState<string | null>(null)
 const [structuredPlan, setStructuredPlan] = useState<any>(null)
 const [sessionId, setSessionId] = useState<string | null>(null)
 const [anchoredHub, setAnchoredHub] = useState<any>(null)
 const [availableHubs, setAvailableHubs] = useState<any[]>([])
 const [availableOptions, setAvailableOptions] = useState<{courses: string[], semesters: string[], units: string[]}>({courses: [], semesters: [], units: []})
 const [curriculum, setCurriculum] = useState({course: '', unit: '', semester: '', hub_title: ''})
 const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
 const [isCurriculumReady, setIsCurriculumReady] = useState(false)
 const [currentBatch, setCurrentBatch] = useState<number>(0)
 const [totalBatches, setTotalBatches] = useState<number>(0)
 const [isCompleted, setIsCompleted] = useState(false)
 const [batchFeed, setBatchFeed] = useState<any[]>([])
 const [aterError, setAterError] = useState<string | null>(null)
 const [isAwaitingNextBatch, setIsAwaitingNextBatch] = useState(false)

 const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ater_oracle_history_sidebar_open');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [oracleState, setOracleState] = useState({
    hasMessages: false,
    hasPreview: false,
    isPanelOpen: false,
    isLessonOpen: false
  });

  const artifactState = useArtifactStore();

  // Split-Pane Layout States
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ater_study_split_width');
      return saved ? JSON.parse(saved) : 50;
    } catch {
      return 50;
    }
  });

  const [lastUnsnappedWidth, setLastUnsnappedWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ater_study_split_last_width');
      return saved ? JSON.parse(saved) : 50;
    } catch {
      return 50;
    }
  });

  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState(false);
  const [activeNotePath, setActiveNotePath] = useState<string | null>(() => {
    return firstRealLessonPath(
      localStorage.getItem('ater_study_active_note_path'),
      localStorage.getItem('ater_canonical_lesson_path'),
      localStorage.getItem('ater_original_note_path'),
    );
  });
  const [hasNewNoteAlert, setHasNewNoteAlert] = useState(false);

  const studyContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggleHistory = () => {
      setIsHistoryOpen(prev => {
        const next = !prev;
        localStorage.setItem('ater_oracle_history_sidebar_open', JSON.stringify(next));
        return next;
      });
    };
    const handleOpenHistory = () => {
      setIsHistoryOpen(true);
      localStorage.setItem('ater_oracle_history_sidebar_open', JSON.stringify(true));
    };
    window.addEventListener('ater-toggle-history', handleToggleHistory);
    window.addEventListener('ater-open-history', handleOpenHistory);
    return () => {
      window.removeEventListener('ater-toggle-history', handleToggleHistory);
      window.removeEventListener('ater-open-history', handleOpenHistory);
    };
  }, []);

  useEffect(() => {
    if (oracleState.isLessonOpen) {
      setIsLeftCollapsed(false);
      setIsRightCollapsed(true);
    } else {
      setIsLeftCollapsed(false);
      setIsRightCollapsed(false);
    }
  }, [oracleState.isLessonOpen]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!studyContainerRef.current) return;
      const rect = studyContainerRef.current.getBoundingClientRect();
      const widthPx = rect.width;
      if (widthPx <= 0) return;

      const relativeX = e.clientX - rect.left;
      const pct = Math.max(15, Math.min(85, (relativeX / widthPx) * 100));

      setIsLeftCollapsed(false);
      setIsRightCollapsed(false);
      setLeftPaneWidth(pct);
      setLastUnsnappedWidth(pct);
      localStorage.setItem('ater_study_split_left_collapsed', 'false');
      localStorage.setItem('ater_study_split_right_collapsed', 'false');
      localStorage.setItem('ater_study_split_width', JSON.stringify(pct));
      localStorage.setItem('ater_study_split_last_width', JSON.stringify(pct));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Listen to note-created Tauri events
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    const setupListener = async () => {
      try {
        const u = await listen<any>('note-created', (event) => {
          const path = event.payload?.path || event.payload?.note_path || (typeof event.payload === 'string' ? event.payload : null);
          if (path && typeof path === 'string') {
            setActiveNotePath(path);
            localStorage.setItem('ater_study_active_note_path', path);
            if (!isTemporaryLessonPath(path)) {
              localStorage.setItem('ater_canonical_lesson_path', path);
            }

            // Trigger a pulse alert to notify user without expanding
            setHasNewNoteAlert(true);
          }
        });
        unlistenFn = u;
      } catch (err) {
        console.error('Failed to setup note-created listener:', err);
      }
    };
    setupListener();
    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  const {setCenterContent, setRightContent} = useHeader()

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
   count: batchFeed.length,
   getScrollElement: () => parentRef.current,
   estimateSize: () => 300,
   overscan: 5,
  })

 // Sync Header Actions
 useEffect(() => {
  if (activeTab === 'pipeline') {
    const HeaderActions = (
     <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-muted/30 border border-border/40 px-2.5 py-1 rounded-[8px] text-[9px] font-black uppercase tracking-widest text-muted-foreground">
       <span>Auto-Ingest</span>
       <button
        onClick={toggleAutoDeploy}
        className={cn(
         "relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border border-transparent focus:outline-none transition-colors",
         config?.autoDeploy ? 'bg-foreground' : 'bg-muted-foreground/30'
        )}
       >
        <span className={cn(
         "pointer-events-none inline-block h-2.5 w-2.5 mt-0.5 transform rounded-full bg-bento-bg shadow ring-0 transition-transform",
         config?.autoDeploy ? 'translate-x-3.5' : 'translate-x-0.5'
        )} />
       </button>
      </div>
      <button
       onClick={() => {fetchInbox(); fetchStatus();}}
       className="flex items-center justify-center w-8 h-8 bg-muted/30 border border-border/40 text-muted-foreground rounded-[8px] hover:text-foreground hover:border-foreground/30 transition-all"
      >
       <RefreshCw size={12} />
      </button>
     </div>
    );
    setRightContent(HeaderActions);
  } else {
    // Oracle View Actions are in sub-header now, so top right is empty
    setRightContent(null);
  }
  return () => setRightContent(null);
 }, [config?.autoDeploy, queueStatus, activeTab]);

  useEffect(() => {
   fetchInbox();
   startPolling(2000);
   return () => stopPolling();
  }, [])

 const toggleAutoDeploy = async () => {
 await saveConfig({autoDeploy: !config?.autoDeploy})
 await sidecarApi.aterWatcherToggle()
 fetchStatus()
}

 const resetAterSession = () => {
 setSessionId(null)
 setIsAwaitingConfirmation(false)
 setIsCurriculumReady(false)
 setIsAwaitingNextBatch(false)
 setIsCompleted(false)
 setActivePlan(null)
 setStructuredPlan(null)
 setBatchFeed([])
 setSelectedInboxFile(null)
 setAterError(null)
 fetchInbox()
}

 const processSelectedFile = async (manualHubId?: string) => {
 if (!selectedInboxFile) return
 setProcessing(true)
 setAterError(null)
 setActivePlan(null)
 setStructuredPlan(null)
 setIsCurriculumReady(false)
 setIsAwaitingConfirmation(false)

 try {
 const res = await sidecarApi.aterProcess({
 file_path: selectedInboxFile.path,
 target_hub_id: manualHubId ? String(manualHubId) : undefined
})

 if (res.status === 'error') {
  setAterError((res as any).message || 'Detection failed');
  setProcessing(false);
  return;
 }

 setAnchoredHub(res.anchored_hub)
 setAvailableHubs(res.available_hubs || [])
 setAvailableOptions(res.available_options || {courses: [], semesters: [], units: []})

 const anchor = res.anchored_hub
 const detected = res.detected_curriculum

 setCurriculum({
 course: anchor?.course || detected?.course || '',
 unit: String(anchor?.unit || detected?.unit || ''),
 semester: anchor?.semester || detected?.semester || '',
 hub_title: cleanTitle(anchor?.title || (detected?.hub_title ? (
 (detected.unit ? detected.unit + ' ' : '') + detected.hub_title + ' Hub'
 ) : '')),
})
 setIsCurriculumReady(true)
} catch (err: any) {
 setAterError(err.message || 'Detection failed')
} finally {setProcessing(false)}
}

 const startPlanning = async () => {
 if (!selectedInboxFile) return
 setProcessing(true)
 setAterError(null)
 try {
 const res = await sidecarApi.aterGeneratePlan({
 file_path: selectedInboxFile.path,
 curriculum: {
 course: String(curriculum.course || ""),
 unit: String(curriculum.unit || ""),
 semester: String(curriculum.semester || ""),
 hub_title: String(curriculum.hub_title || "")
},
 target_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
})
 setActivePlan(res.plan_raw)
 setStructuredPlan(res.plan_structured)
 setSessionId(res.session_id)
 setIsAwaitingConfirmation(true)
 setTotalBatches(res.plan_structured?.batches?.length || 1)
 setCurrentBatch(0)
} catch (err: any) {
 setAterError(err.message || 'Planning failed')
} finally {setProcessing(false)}
}

 const confirmDeployment = async (isStrict = false) => {
 if (!sessionId) return
 setProcessing(true)
 setIsAwaitingConfirmation(false)
 setIsAwaitingNextBatch(false)

 try {
 let currentHasMore = true;
 let currentLocalBatch = currentBatch;

 while (currentHasMore) {
 const command = isStrict ? "Proceed Batch (Auto)" : (currentLocalBatch === 0
 ? "Confirm Final Plan & Proceed Batch 1"
 : `Proceed Batch ${currentLocalBatch + 1}`);

 const res = await sidecarApi.aterConfirm({
 session_id: sessionId,
 command,
 curriculum_override: currentLocalBatch === 0 ? {
 course: String(curriculum.course || ""),
 unit: String(curriculum.unit || ""),
 semester: String(curriculum.semester || ""),
 hub_title: String(curriculum.hub_title || "")
} : undefined,
 anchored_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
})

 if (res.status === 'error') throw new Error((res as any).message || "Workflow failed.");

 const tempBatch = res.current_batch || (currentLocalBatch + 1)
 currentLocalBatch = tempBatch
 setCurrentBatch(tempBatch)
 setBatchFeed(prev => [...prev, { batch: tempBatch, results: res.results || [], ai_output: res.ai_output || "" }])
 currentHasMore = res.has_more;

 if (currentHasMore) {
 if (isStrict) await new Promise(r => setTimeout(r, 500));
 else { setIsAwaitingNextBatch(true); break; }
} else {
  setIsCompleted(true);

  // Resolve first atomic note and expand right panel
  const firstNote = structuredPlan?.atomic_notes?.[0];
  const firstNoteTitle = typeof firstNote === 'string' ? firstNote : (firstNote?.title || firstNote?.note);
  if (firstNoteTitle) {
    try {
      const findRes = await sidecarApi.findVaultPage(firstNoteTitle);
      if (findRes.found && findRes.path) {
        setActiveNotePath(findRes.path);
        localStorage.setItem('ater_study_active_note_path', findRes.path);
        if (!isTemporaryLessonPath(findRes.path)) {
          localStorage.setItem('ater_canonical_lesson_path', findRes.path);
        }
        setIsRightCollapsed(false);
        localStorage.setItem('ater_study_split_right_collapsed', 'false');
      }
    } catch (findErr) {
      console.error('Failed to auto-open first curriculum note:', findErr);
    }
  }
  break;
}
}
} catch (err: any) {
 setAterError(err.message || 'Workflow failed')
 setIsAwaitingNextBatch(true)
} finally { setProcessing(false) }
}

 return (
 <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden gap-3">


    <div className="flex-1 overflow-hidden relative">
      <div
        ref={studyContainerRef}
        className={cn(
          "h-full w-full flex overflow-hidden relative bg-bento-panel rounded-[12px] border border-border/40 shadow-sm",
          activeTab !== 'ater' && "hidden"
        )}
      >
          <style>{`
            @keyframes grayPulse {
              0%, 100% { background-color: rgba(120, 120, 120, 0.15); }
              50% { background-color: rgba(120, 120, 120, 0.45); }
            }
            .animate-gray-pulse {
              animation: grayPulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}</style>

          {/* Left Margin Tab (shows when left pane is collapsed) */}
          {isLeftCollapsed && (
            <button
              onClick={() => {
                setIsLeftCollapsed(false);
                setLeftPaneWidth(lastUnsnappedWidth);
                setHasNewNoteAlert(false);
                localStorage.setItem('ater_study_split_left_collapsed', 'false');
                localStorage.setItem('ater_study_split_width', JSON.stringify(lastUnsnappedWidth));
              }}
              className={cn(
                "w-4 h-full bg-muted/20 border-r border-border/40 hover:bg-muted/40 transition-colors flex items-center justify-center shrink-0 cursor-pointer relative",
                hasNewNoteAlert && "animate-gray-pulse bg-muted/60"
              )}
              title="Restore Chat Panel"
            >
              <div className="rotate-90 origin-center whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Chat
              </div>
            </button>
          )}

          {/* Left Pane (Oracle View) */}
          <div
            className={cn("h-full overflow-hidden flex flex-col relative", isLeftCollapsed && "hidden")}
            style={{ width: (!activeNotePath || isRightCollapsed || oracleState.isLessonOpen) ? '100%' : `${leftPaneWidth}%` }}
          >
            <OracleView
              isHistoryOpen={isHistoryOpen}
              setIsHistoryOpen={setIsHistoryOpen}
              activeNotePath={activeNotePath}
              onStateChange={setOracleState}
              onNoteSelect={(path) => {
                setActiveNotePath(path);
                if (path) {
                  localStorage.setItem('ater_study_active_note_path', path);
                  if (!isTemporaryLessonPath(path)) {
                    localStorage.setItem('ater_canonical_lesson_path', path);
                  }
                } else {
                  localStorage.removeItem('ater_study_active_note_path');
                }
              }}
            />
          </div>

          {/* Vertical Divider / Drag Handle */}
          {activeNotePath && !oracleState.isLessonOpen && !isLeftCollapsed && !isRightCollapsed && (
            <div className="w-1.5 shrink-0 flex flex-col relative bg-muted/50 border-x border-border/40 group/divider">
              {/* Invisible touch target for drag handle */}
              <div
                className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize z-20"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
              />
              {/* Control Buttons Container at the top of the handle */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-1 items-center bg-bento-card border border-border/40 p-1 rounded-full shadow-md">
                <button
                  onClick={() => {
                    setIsLeftCollapsed(true);
                    setIsRightCollapsed(false);
                    localStorage.setItem('ater_study_split_left_collapsed', 'true');
                    localStorage.setItem('ater_study_split_right_collapsed', 'false');
                  }}
                  className="size-4 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Collapse Left (Chat)"
                >
                  <ChevronLeft size={10} />
                </button>
                <button
                  onClick={() => {
                    setIsLeftCollapsed(false);
                    setIsRightCollapsed(false);
                    setLeftPaneWidth(50);
                    setLastUnsnappedWidth(50);
                    localStorage.setItem('ater_study_split_left_collapsed', 'false');
                    localStorage.setItem('ater_study_split_right_collapsed', 'false');
                    localStorage.setItem('ater_study_split_width', '50');
                    localStorage.setItem('ater_study_split_last_width', '50');
                  }}
                  className="size-4 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Reset to 50/50"
                >
                  <div className="size-1.5 rounded-full bg-foreground" />
                </button>
                <button
                  onClick={() => {
                    setIsLeftCollapsed(false);
                    setIsRightCollapsed(true);
                    localStorage.setItem('ater_study_split_left_collapsed', 'false');
                    localStorage.setItem('ater_study_split_right_collapsed', 'true');
                  }}
                  className="size-4 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Collapse Right (Note Canvas)"
                >
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>
          )}

          {/* Right Pane (Note Canvas) */}
          <div
            className={cn("h-full overflow-hidden flex flex-col relative", (!activeNotePath || isRightCollapsed || oracleState.isLessonOpen) && "hidden")}
            style={{ width: isLeftCollapsed ? '100%' : `${100 - leftPaneWidth}%` }}
          >
            <NoteCanvas
              notePath={activeNotePath}
              onClose={() => {
                setActiveNotePath(null);
                localStorage.removeItem('ater_study_active_note_path');
              }}
              onNavigate={async (pageName) => {
                try {
                  const res = await sidecarApi.findVaultPage(pageName);
                  if (res.found && res.path) {
                    setActiveNotePath(res.path);
                    localStorage.setItem('ater_study_active_note_path', res.path);
                    if (!isTemporaryLessonPath(res.path)) {
                      localStorage.setItem('ater_canonical_lesson_path', res.path);
                    }
                  } else {
                    setActiveNotePath(pageName);
                    localStorage.setItem('ater_study_active_note_path', pageName);
                    if (!isTemporaryLessonPath(pageName)) {
                      localStorage.setItem('ater_canonical_lesson_path', pageName);
                    }
                  }
                } catch (err) {
                  console.error('Failed to resolve page name in NoteCanvas onNavigate:', err);
                  setActiveNotePath(pageName);
                  localStorage.setItem('ater_study_active_note_path', pageName);
                  if (!isTemporaryLessonPath(pageName)) {
                    localStorage.setItem('ater_canonical_lesson_path', pageName);
                  }
                }
              }}
            />
          </div>

          {/* Right Margin Tab (shows when right pane is collapsed) */}
          {isRightCollapsed && activeNotePath && !oracleState.isLessonOpen && (
            <button
              onClick={() => {
                setIsRightCollapsed(false);
                setLeftPaneWidth(lastUnsnappedWidth);
                setHasNewNoteAlert(false);
                localStorage.setItem('ater_study_split_right_collapsed', 'false');
                localStorage.setItem('ater_study_split_width', JSON.stringify(lastUnsnappedWidth));
              }}
              className={cn(
                "w-4 h-full bg-muted/20 border-l border-border/40 hover:bg-muted/40 transition-colors flex items-center justify-center shrink-0 cursor-pointer relative",
                hasNewNoteAlert && "animate-gray-pulse bg-muted/60"
              )}
              title="Restore Note Panel"
            >
              <div className="-rotate-90 origin-center whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Notes
              </div>
            </button>
          )}
      </div>

      <div
        className={cn(
          "h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-y-auto custom-scrollbar p-6",
          activeTab !== 'pipeline' && "hidden"
        )}
      >
          <div className="max-w-3xl mx-auto w-full h-full flex flex-col overflow-hidden">
        {/* Pipeline Content (Already exists in AterDashboard return) */}
        {queueStatus?.status !== 'idle' && (
          <div className="flex flex-col h-full overflow-hidden mb-4">
          <div className="p-8 rounded-[12px] border border-border bg-bento-card flex flex-col h-full overflow-hidden gap-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-6 shrink-0">
          <div className="flex items-center gap-3">
          <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Processing File</p>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{queueStatus?.current_file || 'Initializing...'}</h2>
          {queueStatus?.queue_size > 0 && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          + {queueStatus.queue_size} file{queueStatus.queue_size > 1 ? 's' : ''} pending
          </p>
          )}
          </div>
          </div>
          <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Progress</p>
          <p className="text-xl font-black tracking-tight text-foreground">{queueStatus?.current_batch} / {queueStatus?.total_batches}</p>
          </div>
          </div>

          <div className="space-y-4 shrink-0">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          <span>Completion</span>
          <span>{Math.round(((queueStatus?.current_batch || 0) / (queueStatus?.total_batches || 1)) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden border border-border">
          <div className="h-full bg-foreground transition-all duration-500" style={{width: `${((queueStatus?.current_batch || 0) / (queueStatus?.total_batches || 1)) * 100}%`}} />
          </div>

          <AiPressureBar />
          </div>

          <div className={cn("p-4 border border-border rounded-[8px] shrink-0",
          queueStatus?.last_action?.toLowerCase().includes("rate limit") || queueStatus?.last_action?.toLowerCase().includes("fail") || queueStatus?.status === 'error'
          ? "bg-destructive/10 border-destructive/20 text-destructive"
          : "bg-accent/50 text-muted-foreground"
          )}>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Last Action</p>
          <p className="text-[11px] font-bold">{queueStatus?.last_action ? cleanTitle(queueStatus.last_action) : 'Waking up agent...'}</p>
          </div>

          {queueStatus?.planned_batches?.length > 0 && (
          <div className="pt-6 border-t border-border">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4">Plan Feed</h4>
          <BatchTreeView batches={queueStatus.planned_batches} processedNotes={queueStatus.processed_notes || []} />
          </div>
          )}
          </div>
          </div>
        )}

        {queueStatus?.status === 'idle' && !selectedInboxFile && (
          <div className="flex flex-col items-center justify-center h-full px-6 overflow-hidden">
           <div className="text-center mb-10 shrink-0">
           <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4 mt-8">Everything done</h2>
           <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Drop a PDF in the inbox folder</p>
           </div>

           {!config?.autoDeploy && (
             <div className="flex-1 w-full overflow-y-auto custom-scrollbar min-h-0 pb-12">
             <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
             {loadingInbox ? (
             Array.from({length: 4}).map((_, i) => (
             <div key={i} className="h-32 rounded-[12px] bg-bento-card border border-border animate-pulse" />
             ))
             ) : inboxFiles.length > 0 ? (
             inboxFiles.map(f => (
             <div
             key={f.path}
             data-tour="inbox-file-item"
             onClick={() => {setSelectedInboxFile(f); setAterError(null); setActivePlan(null); setIsAwaitingConfirmation(false); setIsCurriculumReady(false); setBatchFeed([]);}}
             className="p-8 rounded-[12px] border border-border bg-bento-card hover:bg-accent/50 hover:border-foreground/30 cursor-pointer group flex flex-col justify-between transition-all shadow-sm"
             >
             <div>
             <h3 className="text-sm font-black uppercase tracking-tight text-foreground truncate">{f.name}</h3>
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 truncate mt-2">{f.path}</p>
             </div>
             <div className="mt-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-foreground/20 group-hover:text-foreground/60 transition-colors">
               <span>Ready to Process</span>
               <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
             </div>
             </div>
             ))
             ) : (
             <div className="col-span-full py-20 border border-dashed border-border rounded-[12px] flex flex-col items-center justify-center text-muted-foreground/30 bg-bento-card">
             <Archive size={32} className="mb-4 opacity-50" />
             <p className="text-[10px] font-black uppercase tracking-widest">Inbox empty</p>
             </div>
             )}
             </div>
             </div>
           )}
          </div>
        )}

        {selectedInboxFile && queueStatus?.status === 'idle' && (
          <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 rounded-[12px] border border-border bg-bento-card mb-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
          <button onClick={() => setSelectedInboxFile(null)} className="px-3 py-1.5 bg-accent border border-border rounded-[6px] text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">BACK</button>
          <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Target File</p>
          <h3 className="text-base font-black uppercase tracking-tight text-foreground truncate max-w-sm">{selectedInboxFile.name}</h3>
          </div>
          </div>
          <div className="flex items-center gap-2">
          {!isCurriculumReady && !processing && (
          <button data-tour="process-file-btn" onClick={() => processSelectedFile()} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-accent/50 hover:border-foreground/40 rounded-[8px] transition-colors">Process File</button>
          )}
          {isCurriculumReady && !activePlan && !processing && (
          <button data-tour="generate-plan-btn" onClick={startPlanning} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground border border-primary bg-primary hover:opacity-90 rounded-[8px] transition-colors">Generate Plan</button>
          )}
          {isAwaitingConfirmation && (
          <div className="flex items-center gap-2">
          <button data-tour="confirm-deploy-btn" onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground border border-primary bg-primary hover:opacity-90 rounded-[8px] transition-colors disabled:opacity-50">Confirm Setup & Deploy</button>
          <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-accent rounded-[8px] transition-colors disabled:opacity-50">Deploy Step 1</button>
          </div>
          )}
          {isAwaitingNextBatch && (
          <div className="flex items-center gap-2">
          <button onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground border border-primary bg-primary hover:opacity-90 rounded-[8px] transition-colors disabled:opacity-50">Finish All</button>
          <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-accent rounded-[8px] transition-colors disabled:opacity-50">Next Step</button>
          </div>
          )}
          {isCompleted && (
          <button onClick={resetAterSession} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-accent rounded-[8px] transition-colors">Reset</button>
          )}
          </div>
          </div>

          {processing && !activePlan && !batchFeed.length && (
          <div className="py-24 flex flex-col items-center justify-center text-center"><MiniLoader label="Generating" /></div>
          )}

          {processing && (activePlan || batchFeed.length > 0) && (
          <div className="mb-8 p-6 rounded-[12px] bg-bento-card border border-border shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
          <div className="ater-mini-loader text-muted-foreground" />
          <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-1">Status</p>
          <p className="text-sm font-black uppercase tracking-tight text-foreground">Executing Plan...</p>
          </div>
          </div>
          <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 uppercase">Batch {currentBatch} / {totalBatches}</p>
          </div>
          )}

          {isCurriculumReady && !activePlan && !processing && (
          <div className="mb-8 p-8 rounded-[12px] bg-bento-card border border-border shrink-0 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-4">
          <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Details Found</h4>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Verify metadata before planning</p>
          </div>
          </div>
          <div className="flex flex-wrap gap-3">
          <CurriculumPill label="Anchor" value={anchoredHub?.title || 'Standalone'} icon={Database} isEditable={false} />
          <CurriculumPill label="Hub Title" value={curriculum.hub_title} onChange={v => setCurriculum(p => ({...p, hub_title: v}))} icon={FileEdit} />
          <CurriculumPill label="Course" value={curriculum.course} onChange={v => setCurriculum(p => ({...p, course: v}))} icon={BookOpen} options={availableOptions.courses} />
          <CurriculumPill label="Unit" value={curriculum.unit} onChange={v => setCurriculum(p => ({...p, unit: v}))} icon={Tag} options={availableOptions.units} />
          <CurriculumPill label="Semester" value={curriculum.semester} onChange={v => setCurriculum(p => ({...p, semester: v}))} icon={Calendar} options={availableOptions.semesters} />
          </div>
          </div>
          )}

          {activePlan && !processing && !batchFeed.length && (
          <div className="flex-1 overflow-hidden min-h-0">
          <div className="p-8 rounded-[12px] bg-bento-card border border-border flex flex-col overflow-hidden h-full shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
          <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Plan Ready</h4>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Ready to create notes</p>
          </div>
          </div>
          <PlanCardView planRaw={activePlan} />
          </div>
          </div>
          )}

          {batchFeed.length > 0 && (
          <div ref={parentRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-6 mt-4 pr-2">
          <div className="flex items-center justify-between pb-4 border-b border-border">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Execution Logs</h4>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{currentBatch} / {totalBatches} Completed</span>
          </div>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
          const b = batchFeed[virtualRow.index]
          return (
          <div key={virtualRow.index} data-index={virtualRow.index} ref={virtualizer.measureElement} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }} className="py-3">
          <div className="p-6 rounded-[12px] border border-border bg-bento-card shadow-sm">
          <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-[4px] bg-primary text-[10px] font-black text-primary-foreground flex items-center justify-center">{b.batch}</div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", b.results.length > 0 ? "text-foreground" : "text-destructive")}>{b.results.length > 0 ? "Success" : "Failed"}</span>
          </div>
          {b.results.length === 0 && (
          <div className="mb-4 mt-2 p-4 rounded-[8px] bg-destructive/5 border border-destructive/20">
          <p className="text-[10px] text-destructive font-black uppercase tracking-widest mb-3">No Ater Regions detected.</p>
          <pre className="text-[9px] bg-bento-panel border border-border p-3 rounded-[6px] overflow-x-auto font-sans text-muted-foreground/60 whitespace-pre-wrap">{b.ai_output}</pre>
          </div>
          )}
          <div className="grid grid-cols-2 gap-3">
          {b.results.map((r: any, i: number) => (
          <div key={i} className="p-4 border border-border rounded-[8px] bg-accent/50 flex items-center gap-3 hover:border-foreground/30 transition-colors">
          <div className="p-2 bg-bento-panel rounded-[4px] border border-border text-muted-foreground/40"><FileText size={14} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest truncate text-foreground/80">{r.title}</span>
          </div>
          ))}
          </div>
          </div>
          </div>
          )
          })}
          </div>
          </div>
          )}

          {isCompleted && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-[12px] bg-bento-card border border-border text-foreground/40 flex items-center justify-center mb-6 shadow-sm"><CheckCircle2 size={32} /></div>
          <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-foreground">All Done</h4>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-8 max-w-sm">All files saved to your vault.</p>
          <button onClick={() => navigate('/obsidian')} className="flex items-center justify-center rounded-[8px] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary-foreground bg-primary border border-primary hover:opacity-90 transition-colors">Go to Vault</button>
          </div>
          )}

          {aterError && (
          <div className="p-6 rounded-[8px] bg-destructive/5 border border-destructive/20 mt-8">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-destructive">Error</div>
          <p className="text-[10px] font-sans text-destructive/80">{aterError}</p>
          </div>
          )}
          </div>
        )}
        </div>
      </div>
    </div>
  </div>
 )
}

/* ─── Main Agents Hub ─── */
export default function Agents({onBack}: {onBack?: () => void}) {
 return <AterDashboard onBack={onBack || (() => {})} />
}
