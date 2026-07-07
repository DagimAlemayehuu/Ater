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
import { LearningWorkspace } from '@/components/intelligence/LearningWorkspace'
import { useConfig} from '@/lib/ConfigContext'
import {useHeader} from '@/context/header-context'
import {useSidebarContent} from '@/context/sidebar-content-context'
import {useNavigate} from 'react-router-dom'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MiniLoader } from '@/components/ui/loading-state'
import { useChatStore } from '@/context/chatStore'
import { Send, Trash2, Bookmark, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import { dispatchWalkthroughTrigger } from '@/components/layout/InteractiveTour'
import { open } from '@tauri-apps/plugin-dialog'

interface ChatMemory {
  id: string
  scope: 'durable' | 'session'
  content: string
  confidence?: number
  enabled?: boolean
  status?: string
}

interface ChatAttachment {
  id: string
  filename: string
  file_path: string
  file_type: string
  chunk_metadata?: any[]
}

interface ToolCall {
  id: string
  tool_name: string
  status: string
  arguments?: Record<string, any>
  result_summary?: string
  error_text?: string | null
  emitted_actions?: any[]
  duration_ms?: number
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  status?: string;
  parent_message_id?: string | null;
  created_at?: string;
  metadata?: any;
  customAction?: {
    label?: string
    hubPath: string
    semesterName: string
    courseName: string
    unitNum: string
    hubTitle: string
    sessionId: string
    results: string[]
    promptJobId?: string
    sourceJobId?: string
    sourceJobState?: any
  }
}

/* ─── Utilities ─── */
const cleanTitle = (val: any): string => {
  if (val === undefined || val === null) return ''
  return String(val).replace(/\[\[(.*?)\]\]/g, '$1').replace(/_/g, ' ').trim()
}

const hydrateMessageActions = (msgs: Message[]): Message[] => msgs.map((msg) => {
  const sourceTeacherAction = msg.metadata?.sourceTeacherAction
  if (!sourceTeacherAction || msg.customAction) return msg
  return { ...msg, customAction: sourceTeacherAction }
})

interface OracleViewProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  onNoteSelect?: (path: string | null) => void;
}

/* ─── Oracle Chat View ─── */
function OracleView({ isHistoryOpen, setIsHistoryOpen, onNoteSelect }: OracleViewProps) {
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

  const conversations = useChatStore(state => state.conversations);
  const setConversations = useChatStore(state => state.setConversations);
  const activeConversationId = useChatStore(state => state.activeConversationId);
  const setActiveConversationId = useChatStore(state => state.setActiveConversationId);
  const activeSessionId = useChatStore(state => state.activeSessionId);
  const setActiveSessionId = useChatStore(state => state.setActiveSessionId);
  const activeWorkspace = useChatStore(state => state.activeWorkspace);
  const setActiveWorkspace = useChatStore(state => state.setActiveWorkspace);
  const messages = useChatStore(state => state.messages);
  const setMessages = useChatStore(state => state.setMessages);

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
      setMessages(hydrateMessageActions(msgs));
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

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeMessageIds, setActiveMessageIds] = useState<Record<string, string>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [memories, setMemories] = useState<ChatMemory[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [attachmentsPanelOpen, setAttachmentsPanelOpen] = useState(false);
  const [expandedToolMessageId, setExpandedToolMessageId] = useState<string | null>(null);
  const [toolCallsByMessageId, setToolCallsByMessageId] = useState<Record<string, ToolCall[]>>({});
  const [toolTimelineLoadingId, setToolTimelineLoadingId] = useState<string | null>(null);

  const messageGroups = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    for (const m of messages) {
      const parentKey = m.parent_message_id || 'root';
      if (!groups[parentKey]) groups[parentKey] = [];
      groups[parentKey].push(m);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const t1 = a.created_at ? new Date(a.created_at).getTime() : 0;
        const t2 = b.created_at ? new Date(b.created_at).getTime() : 0;
        return t1 - t2;
      });
    }
    return groups;
  }, [messages]);

  const activeThread = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    const thread: Message[] = [];
    let currentParent = 'root';
    
    while (messageGroups[currentParent] && messageGroups[currentParent].length > 0) {
      const siblings = messageGroups[currentParent];
      let activeId = activeMessageIds[currentParent];
      let activeMsg = siblings.find(s => s.id === activeId);
      if (!activeMsg) {
        activeMsg = siblings[siblings.length - 1];
      }
      thread.push(activeMsg);
      currentParent = activeMsg.id!;
    }
    return thread;
  }, [messages, messageGroups, activeMessageIds]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingPdfSession, setPendingPdfSession] = useState<{
    sessionId: string
    promptJobId?: string
    sourceJobId?: string
    sourceJobState?: any
    hubPath: string
    semesterName: string
    courseName: string
    unitNum: string
    hubTitle: string
    results: string[]
  } | null>(null);
  const handledRouteSourceJobRef = useRef<string | null>(null);

  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);

  const preview = activeWorkspace;
  const setPreview = setActiveWorkspace;
  const [tutorSession, setTutorSession] = useState<any | null>(null);
  const [panelOpen, setPanelOpen] = useState(() => {
    if (activeConv) return activeConv.panelOpen;
    return false;
  });

  const refreshRuntimePanels = useCallback(async (convId: string) => {
    try {
      const [memoryRows, attachmentRows] = await Promise.all([
        sidecarApi.listMemories(convId),
        sidecarApi.listAttachments(convId),
      ]);
      setMemories(Array.isArray(memoryRows) ? memoryRows : []);
      setAttachments(Array.isArray(attachmentRows) ? attachmentRows : []);
    } catch (err) {
      console.error('[Oracle] Failed to load runtime panels:', err);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      void refreshRuntimePanels(activeConversationId);
    } else {
      setMemories([]);
      setAttachments([]);
      setToolCallsByMessageId({});
      setExpandedToolMessageId(null);
    }
  }, [activeConversationId, refreshRuntimePanels]);

  const toggleToolTimeline = useCallback(async (messageId: string) => {
    if (expandedToolMessageId === messageId) {
      setExpandedToolMessageId(null);
      return;
    }

    setExpandedToolMessageId(messageId);
    if (toolCallsByMessageId[messageId]) return;

    setToolTimelineLoadingId(messageId);
    try {
      let calls = await sidecarApi.getMessageTools(messageId);
      if ((!Array.isArray(calls) || calls.length === 0)) {
        const currentMessage = useChatStore.getState().messages.find((message: Message) => message.id === messageId);
        const siblingMessages = useChatStore.getState().messages.filter((message: Message) => (
          message.role === 'assistant' &&
          message.parent_message_id &&
          currentMessage?.parent_message_id &&
          message.parent_message_id === currentMessage.parent_message_id &&
          message.id !== messageId
        ));

        for (const sibling of siblingMessages) {
          if (!sibling.id) continue;
          const siblingCalls = await sidecarApi.getMessageTools(sibling.id);
          if (Array.isArray(siblingCalls) && siblingCalls.length > 0) {
            calls = siblingCalls.map((call: ToolCall) => ({
              ...call,
              result_summary: call.result_summary
                ? `[Recorded on another response version]\n${call.result_summary}`
                : '[Recorded on another response version]',
            }));
            break;
          }
        }
      }
      setToolCallsByMessageId(prev => ({
        ...prev,
        [messageId]: Array.isArray(calls) ? calls : [],
      }));
    } catch (err) {
      console.error('[Oracle] Failed to load tool timeline:', err);
      toast.error('Failed to load tool timeline');
    } finally {
      setToolTimelineLoadingId(null);
    }
  }, [expandedToolMessageId, toolCallsByMessageId]);

  const updateMemoryEnabled = useCallback(async (memoryId: string, enabled: boolean) => {
    try {
      await sidecarApi.patchMemory(memoryId, { enabled });
      if (activeConversationId) await refreshRuntimePanels(activeConversationId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update memory');
    }
  }, [activeConversationId, refreshRuntimePanels]);

  const deleteMemory = useCallback(async (memoryId: string) => {
    try {
      await sidecarApi.deleteMemory(memoryId);
      if (activeConversationId) await refreshRuntimePanels(activeConversationId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete memory');
    }
  }, [activeConversationId, refreshRuntimePanels]);

  const handleAttachFile = async () => {
    let currentMsgs: Message[] = []
    let assistantIndex = 0
    let attachmentConversationId = activeConversationId;
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

      let createdAttachmentConversation = false;
      if (!attachmentConversationId) {
        const created = await sidecarApi.createConversation(`Source: ${fileName}`);
        attachmentConversationId = created.id;
        createdAttachmentConversation = true;
        setActiveConversationId(attachmentConversationId);
        setMessages([]);
        await loadConversations();
      }

      const userMsg = { role: 'user' as const, content: `Please process the source document: ${fileName}` }
      const assistantPlaceholder = {
        role: 'assistant' as const,
        content: `Source Document: ${fileName}\n\nStarting background deployment...`
      }
      const baseMessages = createdAttachmentConversation ? [] : useChatStore.getState().messages;
      currentMsgs = [...baseMessages, userMsg, assistantPlaceholder]
      assistantIndex = currentMsgs.length - 1
      setMessages(currentMsgs)

      // 1. Upload/Copy file natively to Inbox
      const learningScope = 'external' as const
      const uploadRes = await sidecarApi.aterInboxUpload(selected, fileName, learningScope)
      const inboxFilePath = uploadRes.path
      await sidecarApi.appendMessage(attachmentConversationId!, userMsg.role, userMsg.content);

      const extension = fileName.split('.').pop()?.toLowerCase();
      const fileType = extension === 'pdf' ? 'pdf' : extension === 'md' ? 'markdown' : 'text';
      try {
        await sidecarApi.uploadAttachment(attachmentConversationId!, inboxFilePath, fileType);
        await refreshRuntimePanels(attachmentConversationId!);
      } catch (attachmentErr) {
        console.error('[Oracle] Failed to register chat attachment:', attachmentErr);
      }

      // 2. Unified source job creation
      setActiveStatus('Auditing source...')
      currentMsgs = [...currentMsgs]
      currentMsgs[assistantIndex] = {
        role: 'assistant',
        content: `Source Document: ${fileName}\n\n- Saved to Inbox\n- Auditing source and building learning roadmap...`
      }
      setMessages(currentMsgs)

      const sourceJob = await sidecarApi.createSourceLearningJob({
        file_path: inboxFilePath,
        conversation_id: attachmentConversationId || undefined,
        learning_scope: learningScope,
      })

      const semesterName = 'Source'
      const courseName = sourceJob.domain || 'Source_Learning'
      const unitNum = ''
      const hubTitle = sourceJob.topic || sourceJob.title || fileName
      const sessionId = `source:${sourceJob.job_id}`
      const allResults: string[] = (sourceJob.roadmap || [])
        .map((item: any) => item.title)
        .filter(Boolean)
      const chapters = allResults.length > 0 ? [{
        title: sourceJob.title || 'Source Roadmap',
        atomic_notes: allResults
      }] : []
      const canonicalHubPath = sourceJob.hub_path || sourceJob.roadmap?.[0]?.hub_path || ''

      // Compile roadmap markdown exactly matching the from-scratch design:
      const lessonTitle = `${courseName} — ${hubTitle.replace(/[_-]/g, ' ')}`
      let roadmapMarkdown = `## ${lessonTitle} — Learning Roadmap\n\n`
      roadmapMarkdown += `${sourceJob.audit?.page_count || 0} pages · ${allResults.length} source-grounded concepts planned for: *${fileName}*\n\n`
      if (sourceJob.warnings?.length) {
        roadmapMarkdown += `Warnings:\n\n${sourceJob.warnings.map((w: any) => `- ${w.severity}: ${w.description}`).join('\n')}\n\n`
      }
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
        roadmapMarkdown += [
          `No teachable concepts were returned for this source yet.`,
          ``,
          `Debug details:`,
          `- Job ID: ${sourceJob.job_id || 'missing'}`,
          `- Status: ${sourceJob.status || 'unknown'}`,
          `- Topic: ${sourceJob.topic || sourceJob.title || 'unknown'}`,
          `- Page count: ${sourceJob.audit?.page_count || sourceJob.page_count || 0}`,
          ``,
          `Try attaching the file again after refreshing, or open the Source Job status if this repeats.`
        ].join('\n')
      }
      roadmapMarkdown += `\n\n---\n\nClick **Start Lesson** to open the source-grounded teacher workspace.`

      const sourceTeacherAction = {
        label: 'Start Lesson',
        sourceJobId: sourceJob.job_id,
        sourceJobState: sourceJob,
        hubPath: canonicalHubPath,
        semesterName,
        courseName,
        unitNum,
        hubTitle,
        sessionId,
        results: allResults
      }

      setPendingPdfSession({
        ...sourceTeacherAction
      })

      const successMsgs = [...currentMsgs]
      successMsgs[assistantIndex] = {
        role: 'assistant',
        content: roadmapMarkdown,
        metadata: { sourceTeacherAction },
        customAction: sourceTeacherAction
      }
      await sidecarApi.appendMessage(
        attachmentConversationId!,
        'assistant',
        roadmapMarkdown,
        undefined,
        { sourceTeacherAction }
      );
      setMessages(successMsgs)
      if (createdAttachmentConversation) {
        await loadConversations();
      }
      const persistedMessages = await sidecarApi.getMessages(attachmentConversationId!);
      setMessages(hydrateMessageActions(persistedMessages));

    } catch (err: any) {
      const errMsg = err.message || 'Processing failed'
      console.error(err)
      const failMsgs = currentMsgs.length ? [...currentMsgs] : [...useChatStore.getState().messages]
      failMsgs[assistantIndex] = {
        role: 'assistant',
        content: `Processing Failed\n\nError: ${errMsg}`
      }
      if (attachmentConversationId) {
        try {
          await sidecarApi.appendMessage(attachmentConversationId, 'assistant', `Processing Failed\n\nError: ${errMsg}`);
        } catch (appendErr) {
          console.error('[Oracle] Failed to persist source processing error:', appendErr);
        }
      }
      setMessages(failMsgs)
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

      setConversations([newConv, ...conversations]);
    }
  }, [activeConversationId, messages]);

  // Sync active conversation changes to the list
  useEffect(() => {
    if (!activeConversationId) return;

    setConversations(conversations.map(c => {
      if (c.id === activeConversationId) {
        const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'New Chat';
        const title = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;
        return {
          ...c,
          title: c.title === 'New Chat' ? title : c.title,
          messages,
          preview,
          panelOpen,
          timestamp: Date.now()
        };
      }
      return c;
    }));
  }, [messages, preview, panelOpen, activeConversationId]);

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

    try {
      const msgs = hydrateMessageActions(await sidecarApi.getMessages(convId));
      setMessages(msgs);

      // Restore tutor session from metadata if present
      const assistantWithMeta = [...msgs].reverse().find(m => m.role === 'assistant' && m.metadata?.session_id);
      if (assistantWithMeta && assistantWithMeta.metadata) {
        const meta = assistantWithMeta.metadata;
        const notePath = meta.note_path || meta.lesson_path || '';
        const nextPreview = {
          title: meta.title || 'Teacher Lesson',
          lessonPath: meta.lesson_path || '',
          notePath,
          hubPath: meta.hub_path || '',
          previewUrl: '',
        };
        setPreview(nextPreview);
        if (meta.session_id) {
          setActiveSessionId(meta.session_id);
          try {
            const session = await sidecarApi.getTutorStatus(meta.session_id);
            if (session) {
              setTutorSession(session);
              setPanelOpen(true);
            }
          } catch (e) {
            console.error('[Oracle] Failed to restore tutor session:', e);
          }
        }
      } else {
        setPreview(conv.preview);
        setPanelOpen(conv.panelOpen);
        if (onNoteSelect) {
          onNoteSelect(conv.preview ? (conv.preview.notePath || conv.preview.lessonPath || null) : null);
        }
      }
    } catch (err) {
      console.error('[Oracle] Failed to load messages:', err);
    }
  }, [conversations, isLoading, onNoteSelect, loadMessages, setActiveConversationId, setActiveSessionId, setPreview, setMessages]);

  const handleNewChat = useCallback(async () => {
    if (isLoading) {
      toast.warning("Please wait until response is complete.");
      return;
    }
    try {
      const created = await sidecarApi.createConversation('New Chat');
      if (created && created.id) {
        setActiveConversationId(created.id);
        loadConversations();
        setMessages([]);
        setPreview(null);
        setPanelOpen(false);
        if (onNoteSelect) {
          onNoteSelect(null);
        }
      }
    } catch (err) {
      toast.error('Failed to create new conversation');
    }
  }, [isLoading, onNoteSelect, loadConversations, setActiveConversationId, setMessages, setPreview]);

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
          await loadMessages(first.id);
          setPreview(first.preview);
          setPanelOpen(first.panelOpen);
          if (onNoteSelect) {
            onNoteSelect(first.preview ? (first.preview.notePath || first.preview.lessonPath || null) : null);
          }
        } else {
          setActiveConversationId(null);
          setMessages([]);
          setPreview(null);
          setPanelOpen(false);
          if (onNoteSelect) {
            onNoteSelect(null);
          }
        }
      }
      toast.success('Conversation deleted.');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  }, [activeConversationId, isLoading, onNoteSelect, conversations, loadMessages, setActiveConversationId, setConversations, setMessages, setPreview]);

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
            BULK IMPORT
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
                    aria-label="Clear Active Chat"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={handleNewChat}
                  className="p-1 hover:bg-muted rounded-[6px] text-muted-foreground hover:text-foreground transition-colors"
                  title="New Chat"
                  aria-label="New Chat"
                >
                  <Plus size={14} aria-hidden="true" />
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
                        aria-label={`Delete chat: ${conv.title || 'Untitled Chat'}`}
                      >
                        <Trash2 size={12} aria-hidden="true" />
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

  const handleBranchMessage = async (messageId: string, newContent: string) => {
    setIsLoading(true);
    setActiveStatus('Branching chat...');
    try {
      const response = await sidecarApi.branchMessage(activeConversationId!, messageId, newContent);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body has no reader.');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let assistantContent = '';
      let isFirstChunk = true;

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
            if (parsed.type === 'branch_created') {
              const newUserId = parsed.new_user_message_id;
              const updatedMsgs = hydrateMessageActions(await sidecarApi.getMessages(activeConversationId!));
              setMessages(updatedMsgs);
              
              const userMsgObj = updatedMsgs.find((m: any) => m.id === newUserId);
              if (userMsgObj) {
                setActiveMessageIds(prev => ({
                  ...prev,
                  [userMsgObj.parent_message_id || 'root']: newUserId
                }));
              }
            } else if (parsed.type === 'run_start') {
              setActiveRunId(parsed.run_id);
            } else if (parsed.type === 'status') {
              setActiveStatus(parsed.message);
            } else if (parsed.type === 'chunk') {
              if (isFirstChunk) {
                const currentMsgs = hydrateMessageActions(await sidecarApi.getMessages(activeConversationId!));
                setMessages(currentMsgs);
                isFirstChunk = false;
              }
              setActiveStatus(null);
              assistantContent += parsed.content;
              const currentMsgs = [...useChatStore.getState().messages];
              const lastIndex = currentMsgs.length - 1;
              if (lastIndex >= 0 && currentMsgs[lastIndex].role === 'assistant') {
                currentMsgs[lastIndex] = { ...currentMsgs[lastIndex], content: assistantContent };
              }
              setMessages(currentMsgs);
            } else if (parsed.type === 'lesson_created') {
              setIsGeneratingLesson(false);
              setGeneratingStatus(null);
              if (onNoteSelect) {
                onNoteSelect(null);
              }
              const notePath = parsed.note_path || parsed.lesson_path || '';
              if (notePath) {
                setPreview({
                  title: parsed.title || 'Teacher Lesson',
                  lessonPath: parsed.lesson_path || '',
                  notePath,
                  hubPath: parsed.hub_path || '',
                  previewUrl: '',
                });
                setActiveSessionId(parsed.session_id);
                try {
                  const session = await sidecarApi.getTutorStatus(parsed.session_id);
                  if (session) {
                    setTutorSession(session);
                  }
                } catch {}
                setPanelOpen(true);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      const finalMsgs = hydrateMessageActions(await sidecarApi.getMessages(activeConversationId!));
      setMessages(finalMsgs);
    } catch (err: any) {
      toast.error(err.message || 'Branching failed');
    } finally {
      setIsLoading(false);
      setActiveStatus(null);
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    setIsLoading(true);
    setActiveStatus('Regenerating response...');
    try {
      const response = await sidecarApi.regenerateMessage(activeConversationId!, messageId);
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
              const updatedMsgs = hydrateMessageActions(await sidecarApi.getMessages(activeConversationId!));
              setMessages(updatedMsgs);
              
              setActiveMessageIds(prev => ({
                ...prev,
                [parsed.parent_message_id || 'root']: parsed.message_id
              }));
            } else if (parsed.type === 'status') {
              setActiveStatus(parsed.message);
            } else if (parsed.type === 'chunk') {
              setActiveStatus(null);
              assistantContent += parsed.content;
              const currentMsgs = [...useChatStore.getState().messages];
              const lastIndex = currentMsgs.length - 1;
              if (lastIndex >= 0 && currentMsgs[lastIndex].role === 'assistant') {
                currentMsgs[lastIndex] = { ...currentMsgs[lastIndex], content: assistantContent };
              }
              setMessages(currentMsgs);
            } else if (parsed.type === 'lesson_created') {
              setIsGeneratingLesson(false);
              setGeneratingStatus(null);
              if (onNoteSelect) {
                onNoteSelect(null);
              }
              const notePath = parsed.note_path || parsed.lesson_path || '';
              if (notePath) {
                setPreview({
                  title: parsed.title || 'Teacher Lesson',
                  lessonPath: parsed.lesson_path || '',
                  notePath,
                  hubPath: parsed.hub_path || '',
                  previewUrl: '',
                });
                setActiveSessionId(parsed.session_id);
                try {
                  const session = await sidecarApi.getTutorStatus(parsed.session_id);
                  if (session) {
                    setTutorSession(session);
                  }
                } catch {}
                setPanelOpen(true);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      const finalMsgs = hydrateMessageActions(await sidecarApi.getMessages(activeConversationId!));
      setMessages(finalMsgs);
    } catch (err: any) {
      toast.error(err.message || 'Regeneration failed');
    } finally {
      setIsLoading(false);
      setActiveStatus(null);
    }
  };

  const handleClearHistory = () => {
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
    setPreview(null);
    setPanelOpen(false);
    if (onNoteSelect) {
      onNoteSelect(null);
    }
    toast.success('All conversation history cleared.');
  };

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

  const startTeacherJobAction = useCallback(async (customAction: NonNullable<Message['customAction']>) => {
    const jobId = customAction.promptJobId || customAction.sourceJobId;
    if (!jobId) return false;

    const started = customAction.promptJobId
      ? await sidecarApi.startPromptTeacherJob(jobId)
      : await sidecarApi.startSourceLearningJob(jobId);
    const sourceJob = started.source_job || customAction.sourceJobState || {};
    const tutor = started.tutor_session || {};
    const currentNote = tutor.current_note || {};
    const notePath = tutor.current_note_path || `${currentNote.note_title || sourceJob.topic || 'Source_Lesson'}.md`;
    localStorage.setItem('ater_original_note_path', notePath);
    localStorage.setItem('ater_study_active_note_path', notePath);
    localStorage.setItem('ater_canonical_lesson_path', notePath);

    const canonicalHubPath = tutor.hub_path || customAction.hubPath;

    setPreview({
      title: sourceJob.topic || customAction.hubTitle.replace(/[_-]/g, ' '),
      lessonPath: canonicalHubPath,
      notePath,
      hubPath: canonicalHubPath,
      previewUrl: '',
    });
    onNoteSelect?.(notePath);

    setTutorSession({
      session_id: tutor.session_id,
      source_job_id: jobId,
      prompt_job_id: customAction.promptJobId,
      source_job: sourceJob,
      hub_path: canonicalHubPath,
      current_note_path: notePath,
      current_concept_node_id: tutor.current_concept_node_id,
      completed_notes: tutor.completed_notes || [],
      wagers: {},
      score: 0,
      status: 'active',
      updated_at: new Date().toISOString(),
      active_note_unlocks: tutor.active_note_unlocks || [notePath],
      curriculum: tutor.curriculum || (sourceJob.roadmap || []).map((item: any) => item.path).filter(Boolean),
      coverage: sourceJob.coverage,
      roadmap: tutor.roadmap || sourceJob.roadmap,
      warnings: sourceJob.warnings || [],
    });

    setPendingPdfSession(null);
    setPanelOpen(true);
    return true;
  }, [onNoteSelect, setPreview]);

  useEffect(() => {
    const routeSourceJobId = searchParams.get('sourceJobId');
    if (!routeSourceJobId || handledRouteSourceJobRef.current === routeSourceJobId) return;
    handledRouteSourceJobRef.current = routeSourceJobId;

    const loadAcademicSourceJob = async () => {
      try {
        setIsLoading(true);
        setActiveStatus('Loading academic roadmap...');
        const sourceJob = await sidecarApi.getSourceLearningJob(routeSourceJobId);
        const placement = sourceJob.placement || {};
        const semesterName = placement.semester || 'General';
        const courseName = placement.course || sourceJob.domain || 'Academic';
        const unitNum = placement.unit || placement.chapter_title || '';
        const hubTitle = placement.chapter_title || sourceJob.topic || sourceJob.title || 'Academic Chapter';
        const sessionId = `source:${sourceJob.job_id}`;
        const allResults: string[] = (sourceJob.roadmap || [])
          .map((item: any) => item.title)
          .filter(Boolean);
        const canonicalHubPath = sourceJob.hub_path || placement.parent_hub_path || '';

        let roadmapMarkdown = `## ${courseName} — ${hubTitle.replace(/[_-]/g, ' ')} — Learning Roadmap\n\n`;
        roadmapMarkdown += `${sourceJob.audit?.page_count || 0} pages · ${allResults.length} source-grounded concepts planned.\n\n`;
        if (sourceJob.warnings?.length) {
          roadmapMarkdown += `Warnings:\n\n${sourceJob.warnings.map((w: any) => `- ${w.severity}: ${w.description}`).join('\n')}\n\n`;
        }
        roadmapMarkdown += `---\n\n`;
        if (allResults.length > 0) {
          roadmapMarkdown += `**Chapter — ${hubTitle.replace(/[_-]/g, ' ')}**  \n*(${allResults.length} Atomic Notes)*\n\nAtomic Notes:\n\n`;
          roadmapMarkdown += allResults.map((note: string) => `- [ ] ${note.replace(/[_-]/g, ' ')}`).join('\n');
        } else {
          roadmapMarkdown += `No teachable concepts were returned for this source yet.`;
        }
        const actionLabel = searchParams.get('fromAcademic') === '1' ? 'Confirm Roadmap' : 'Start Lesson';
        roadmapMarkdown += `\n\n---\n\nClick **${actionLabel}** to open the source-grounded teacher workspace.`;

        const sourceTeacherAction = {
          label: searchParams.get('start') === '1' ? 'Continue Lesson' : actionLabel,
          sourceJobId: sourceJob.job_id,
          sourceJobState: sourceJob,
          hubPath: canonicalHubPath,
          semesterName,
          courseName,
          unitNum,
          hubTitle,
          sessionId,
          results: allResults,
        };
        const routeMessage: Message = {
          role: 'assistant',
          content: roadmapMarkdown,
          metadata: { sourceTeacherAction },
          customAction: sourceTeacherAction,
        };
        setActiveConversationId(null);
        setMessages([routeMessage]);
        setPendingPdfSession(sourceTeacherAction);
        if (searchParams.get('start') === '1') {
          await startTeacherJobAction(sourceTeacherAction);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load academic roadmap.');
      } finally {
        setIsLoading(false);
        setActiveStatus(null);
      }
    };

    void loadAcademicSourceJob();
  }, [searchParams, setMessages, startTeacherJobAction]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const isStartLesson = text.toLowerCase() === 'start lesson' || text.toLowerCase() === 'start';

    const latestTeacherAction = [...useChatStore.getState().messages]
      .reverse()
      .map((message: Message) => message.customAction || message.metadata?.sourceTeacherAction)
      .find((action: Message['customAction']) => action?.sourceJobId || action?.promptJobId);

    if (isStartLesson && !pendingPdfSession && latestTeacherAction) {
      try {
        setIsLoading(true);
        setActiveStatus('Starting teacher tutor...');
        await startTeacherJobAction(latestTeacherAction);
        return;
      } catch (err: any) {
        toast.error(err.message || 'Failed to start lesson.');
      } finally {
        setIsLoading(false);
        setActiveStatus(null);
      }
      return;
    }

    if (isStartLesson && pendingPdfSession) {
      try {
        const customAction = pendingPdfSession;
        setIsLoading(true);
        setActiveStatus(customAction.sourceJobId || customAction.promptJobId ? 'Starting teacher tutor...' : 'Deploying workspace...');

        if (customAction.sourceJobId || customAction.promptJobId) {
          await startTeacherJobAction(customAction);
          return;
        }

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
            const cleanSemester = customAction.semesterName.replace(/[^a-zA-Z0-9]/g, '_');
            const cleanCourseTitle = customAction.courseName.replace(/[^a-zA-Z0-9]/g, '_');
            const cleanUnit = (customAction.unitNum || customAction.hubTitle || 'General').replace(/[^a-zA-Z0-9]/g, '_');
            const cleanHub = (customAction.hubTitle || 'Learning_Path').replace(/[^a-zA-Z0-9]/g, '_');
            const noteFilename = `${note}.md`;
            return `Notes/academic/${cleanSemester}/${cleanCourseTitle}/${cleanUnit}/01_${cleanHub}/${noteFilename}`;
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

      // 3. Call Assistant Stream API
      setActiveStatus('Contacting assistant...');
      const parentMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;

      const response = await sidecarApi.streamConversationTurn(currentId!, {
        message: text,
        parent_message_id: parentMessageId,
        rag_context: ragContext,
        user_context: userContext
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      setMessages([...useChatStore.getState().messages, { role: 'assistant', content: '', status: 'incomplete' }]);

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
              const currentMsgs = [...useChatStore.getState().messages];
              const lastIndex = currentMsgs.length - 1;
              if (lastIndex >= 0 && currentMsgs[lastIndex].role === 'assistant') {
                currentMsgs[lastIndex] = { ...currentMsgs[lastIndex], content: assistantContent };
              }
              setMessages(currentMsgs);
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
                if (!notePath.includes('remediation_temp')) {
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
                const sessionId = parsed.session_id || `teacher_${parsed.workspace || Date.now()}`;
                setActiveSessionId(sessionId);
                setTutorSession({
                  session_id: sessionId,
                  source_job_id: parsed.source_job_id,
                  prompt_job_id: parsed.prompt_job_id,
                  hub_path: hubPath,
                  current_note_path: notePath,
                  current_concept_node_id: parsed.current_concept_node_id,
                  completed_notes: [],
                  wagers: {},
                  score: 0,
                  status: 'active',
                  updated_at: new Date().toISOString(),
                  active_note_unlocks: [notePath],
                  curriculum: parsed.curriculum,
                  coverage: parsed.coverage,
                  roadmap: parsed.roadmap,
                  warnings: parsed.warnings || [],
                });
              }
              if (notePath && onNoteSelect) {
                onNoteSelect(notePath);
              }
              setPanelOpen(true);
            } else if (parsed.type === 'prompt_teacher_job') {
              const promptJobId = parsed.prompt_job_id || parsed.job_id;
              if (promptJobId && parsed.next_action === 'start_learning') {
                const roadmap = Array.isArray(parsed.roadmap) ? parsed.roadmap : [];
                const topic = parsed.topic || roadmap[0]?.title || 'Prompt Teacher';
              const hubPath = parsed.hub_path || '';
                setPendingPdfSession({
                  sessionId: `prompt:${promptJobId}`,
                  promptJobId,
                  sourceJobState: {
                    job_id: promptJobId,
                    topic,
                    roadmap,
                    coverage: parsed.coverage,
                    warnings: parsed.warnings || [],
                  },
                  hubPath,
                  semesterName: 'Prompt',
                  courseName: 'Prompt_Teacher',
                  unitNum: '1',
                  hubTitle: topic,
                  results: roadmap.map((item: any) => item.title).filter(Boolean),
                });
              }
            } else if (parsed.type === 'source_learning_job') {
              const sourceJobId = parsed.source_job_id || parsed.job_id;
              if (sourceJobId && parsed.next_action === 'start_learning') {
                const roadmap = Array.isArray(parsed.roadmap) ? parsed.roadmap : [];
                const topic = parsed.topic || roadmap[0]?.title || 'Source Learning';
                const hubPath = parsed.hub_path || '';
                setPendingPdfSession({
                  sessionId: `source:${sourceJobId}`,
                  sourceJobId,
                  sourceJobState: {
                    job_id: sourceJobId,
                    topic,
                    roadmap,
                    coverage: parsed.coverage,
                    warnings: parsed.warnings || [],
                  },
                  hubPath,
                  semesterName: 'Source',
                  courseName: 'Source_Learning',
                  unitNum: '1',
                  hubTitle: topic,
                  results: roadmap.map((item: any) => item.title).filter(Boolean),
                });
              }
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
      if (currentId) {
        const finalMessages = hydrateMessageActions(await sidecarApi.getMessages(currentId));
        setMessages(finalMessages);
        await refreshRuntimePanels(currentId);
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
      }
    };
    window.addEventListener('ater-new-chat', handleNewChatEvent);
    window.addEventListener('ater-toggle-panel', handleTogglePanelEvent);
    return () => {
      window.removeEventListener('ater-new-chat', handleNewChatEvent);
      window.removeEventListener('ater-toggle-panel', handleTogglePanelEvent);
    };
  }, [handleNewChat, preview]);

  const quickActions = [
    { title: "Search Vault", prompt: "What are my notes about...?", icon: Search, description: "Semantic search content." },
    { title: "Generate Quiz", prompt: "Generate a quiz about...", icon: GraduationCap, description: "Active recall test." },
    { title: "Course Info", prompt: "Tell me about my courses", icon: BookOpen, description: "Academic dashboard query." }
  ];

  return (
    <div className="h-full w-full flex min-h-0 relative">
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
        <div className="flex min-h-0 flex-col flex-1">
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 min-w-0 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center -mt-12">
              <h1 className="text-[32px] font-black uppercase tracking-tighter text-foreground">Welcome back, {config?.displayName || 'User'}</h1>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {activeThread.map((msg, index) => {
                const parentKey = msg.parent_message_id || 'root';
                const siblings = messageGroups[parentKey] || [];
                const siblingIndex = siblings.findIndex(s => s.id === msg.id);
                const citations = Array.isArray(msg.metadata?.citations) ? msg.metadata.citations : [];
                const toolCalls = msg.id ? (toolCallsByMessageId[msg.id] || []) : [];
                const isToolTimelineOpen = Boolean(msg.id && expandedToolMessageId === msg.id);

                return (
                  <div key={msg.id || index} className="space-y-2 group">
                    {msg.role === 'user' ? (
                      <div className="flex flex-col items-end w-full gap-2">
                        {editingMessageId === msg.id ? (
                          <div className="w-full max-w-[80%] bg-muted/10 border border-border p-3 rounded-[12px] flex flex-col gap-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full bg-transparent border-0 outline-none text-[13px] text-foreground resize-none custom-scrollbar"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="h-7 px-3 border border-border hover:bg-muted text-[10px] uppercase font-bold rounded-[6px] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (editingContent.trim()) {
                                    handleBranchMessage(msg.id!, editingContent.trim());
                                    setEditingMessageId(null);
                                  }
                                }}
                                className="h-7 px-3 bg-foreground text-background hover:opacity-90 text-[10px] uppercase font-bold rounded-[6px] transition-colors"
                              >
                                Save & Resend
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative max-w-[80%] flex flex-col gap-1 items-end">
                            <div className="bg-muted/20 border border-border px-4 py-3 text-[13px] rounded-[12px] text-foreground leading-relaxed">
                              {msg.content}
                            </div>
                            
                            {/* Hover Edit Action */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 mt-1">
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id!);
                                  setEditingContent(msg.content);
                                }}
                                className="text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 bg-muted/10 hover:bg-muted/30 px-2 py-0.5 rounded-[4px] border border-border/20 transition-all"
                                aria-label="Edit message"
                              >
                                <FileEdit size={10} aria-hidden="true" />
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.content ? (
                        <div className="flex justify-start w-full">
                          <div className="max-w-full w-full border border-border bg-bento-card px-6 py-5 text-[13px] rounded-[12px] text-foreground overflow-x-auto flex flex-col gap-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <AterMarkdown content={msg.content.replace(/\(\(([^)]+)\)\)/g, '[[$1]]')} onNavigate={handleWikiLinkClick} onSendMessage={stableSendMessage} />
                            </div>
                            {(msg.status && msg.status !== 'completed') && (
                              <div className="flex items-center gap-2 rounded-[6px] border border-border/40 bg-muted/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <Activity size={12} />
                                {msg.status}
                              </div>
                            )}
                            {citations.length > 0 && (
                              <div className="rounded-[8px] border border-border/40 bg-muted/10 px-3 py-2">
                                <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                  <Bookmark size={11} />
                                  Citations
                                </div>
                                <div className="space-y-1.5">
                                  {citations.map((citation: any, citationIndex: number) => (
                                    <div key={`${msg.id}-citation-${citationIndex}`} className="flex items-start gap-2 text-[11px] text-foreground/80">
                                      <span className="mt-0.5 text-[9px] font-black text-muted-foreground tabular-nums">{citationIndex + 1}</span>
                                      <span className="min-w-0 break-words">
                                        {citation.filename || citation.source || citation.path || 'Source'}
                                        {citation.page ? ` · page ${citation.page}` : ''}
                                        {citation.paragraph ? ` · paragraph ${citation.paragraph}` : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {msg.id && (
                              <div className="rounded-[8px] border border-border/40 bg-muted/10 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleToolTimeline(msg.id!)}
                                  className="w-full h-8 px-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                  aria-expanded={isToolTimelineOpen}
                                  aria-label="Toggle tool timeline"
                                >
                                  <span className="flex items-center gap-2">
                                    <Activity size={12} aria-hidden="true" />
                                    Tool Timeline
                                  </span>
                                  <ChevronDown size={12} className={cn("transition-transform", isToolTimelineOpen && "rotate-180")} aria-hidden="true" />
                                </button>
                                {isToolTimelineOpen && (
                                  <div className="border-t border-border/40 px-3 py-2 space-y-2">
                                    {toolTimelineLoadingId === msg.id ? (
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Loading tools...</p>
                                    ) : toolCalls.length === 0 ? (
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">No tool calls recorded.</p>
                                    ) : toolCalls.map(call => (
                                      <div key={call.id} className="rounded-[6px] border border-border/30 bg-bento-panel px-3 py-2">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <span className="text-[10px] font-black text-foreground">{call.tool_name}</span>
                                          <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest",
                                            call.status === 'failed' ? "text-destructive" : "text-muted-foreground"
                                          )}>
                                            {call.status}
                                          </span>
                                        </div>
                                        {call.arguments && (
                                          <pre className="mb-1 overflow-x-auto rounded-[4px] bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground font-sans">
                                            {JSON.stringify(call.arguments, null, 2)}
                                          </pre>
                                        )}
                                        {call.result_summary && (
                                          <p className="text-[10px] text-foreground/75">{call.result_summary}</p>
                                        )}
                                        {call.error_text && (
                                          <p className="text-[10px] text-destructive">{call.error_text}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {(() => {
                              const isLastMessage = index === activeThread.length - 1;
                              const hasRoadmap = msg.content.includes('Start Lesson') || msg.content.includes('Confirm Roadmap') || Boolean(msg.customAction);
                              const showStartButton = msg.role === 'assistant' && isLastMessage && hasRoadmap && !isLoading;

                              if (msg.customAction) {
                                const customAction = msg.customAction;
                                if (customAction.sourceJobId || customAction.promptJobId) {
                                  return (
                                    <div className="mt-2 pt-4 border-t border-border/40 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            setIsLoading(true);
                                            setActiveStatus('Starting teacher tutor...');
                                            await startTeacherJobAction(customAction);
                                          } catch (err: any) {
                                            toast.error(err.message || 'Failed to start lesson.');
                                          } finally {
                                            setIsLoading(false);
                                            setActiveStatus(null);
                                          }
                                        }}
                                        disabled={isLoading}
                                        className="h-9 px-5 bg-muted/30 text-foreground border border-border/60 font-bold text-[10px] uppercase tracking-wider rounded-[6px] hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                      >
                                        <BookOpenCheck size={12} />
                                        {customAction.label || 'Start Lesson'}
                                      </button>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="mt-2 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                      Ready to begin? Load the generated learning path in your workspace.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const curriculumPaths = customAction.results.map((note: string) => {
                                          const cleanSemester = customAction.semesterName.replace(/[^a-zA-Z0-9]/g, '_')
                                          const cleanCourseTitle = customAction.courseName.replace(/[^a-zA-Z0-9]/g, '_')
                                          const cleanUnit = (customAction.unitNum || customAction.hubTitle || 'General').replace(/[^a-zA-Z0-9]/g, '_')
                                          const cleanHub = (customAction.hubTitle || 'Learning_Path').replace(/[^a-zA-Z0-9]/g, '_')
                                          const noteFilename = `${note}.md`
                                          return `Notes/academic/${cleanSemester}/${cleanCourseTitle}/${cleanUnit}/01_${cleanHub}/${noteFilename}`
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

                    {/* Sibling & Regenerate Controls */}
                    <div className="flex items-center gap-4 px-2 select-none h-6">
                      {siblings.length > 1 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-[4px] border border-border/20">
                          <button
                            onClick={() => {
                              const prevIdx = (siblingIndex - 1 + siblings.length) % siblings.length;
                              setActiveMessageIds(prev => ({
                                ...prev,
                                [parentKey]: siblings[prevIdx].id!
                              }));
                            }}
                            className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Previous version"
                          >
                            <ChevronLeft size={10} aria-hidden="true" />
                          </button>
                          <span className="font-bold tabular-nums" aria-label={`Version ${siblingIndex + 1} of ${siblings.length}`}>{siblingIndex + 1} / {siblings.length}</span>
                          <button
                            onClick={() => {
                              const nextIdx = (siblingIndex + 1) % siblings.length;
                              setActiveMessageIds(prev => ({
                                ...prev,
                                [parentKey]: siblings[nextIdx].id!
                              }));
                            }}
                            className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Next version"
                          >
                            <ChevronRight size={10} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      {msg.role === 'assistant' && !isLoading && (
                        <button
                          onClick={() => handleRegenerateMessage(msg.id!)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 bg-muted/10 hover:bg-muted/30 px-2 py-0.5 rounded-[4px] border border-border/20 transition-all"
                          aria-label="Regenerate response"
                        >
                          <RefreshCw size={10} aria-hidden="true" />
                          Regenerate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
            {(activeConversationId || memories.length > 0 || attachments.length > 0) && (
              <div className="rounded-[10px] border border-border/50 bg-bento-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMemoryPanelOpen(prev => !prev)}
                      className={cn(
                        "h-7 px-2 rounded-[6px] border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors",
                        memoryPanelOpen ? "bg-muted/40 border-foreground/30 text-foreground" : "bg-muted/10 border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                      aria-expanded={memoryPanelOpen}
                      aria-label={`Toggle memories panel (${memories.length} memories)`}
                    >
                      <BrainCircuit size={12} aria-hidden="true" />
                      Memories
                      <span className="tabular-nums">{memories.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachmentsPanelOpen(prev => !prev)}
                      className={cn(
                        "h-7 px-2 rounded-[6px] border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors",
                        attachmentsPanelOpen ? "bg-muted/40 border-foreground/30 text-foreground" : "bg-muted/10 border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                      aria-expanded={attachmentsPanelOpen}
                      aria-label={`Toggle sources panel (${attachments.length} sources)`}
                    >
                      <Paperclip size={12} aria-hidden="true" />
                      Sources
                      <span className="tabular-nums">{attachments.length}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => activeConversationId && refreshRuntimePanels(activeConversationId)}
                    disabled={!activeConversationId}
                    className="h-7 w-7 rounded-[6px] border border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground disabled:opacity-40 flex items-center justify-center"
                    title="Refresh chat runtime context"
                    aria-label="Refresh chat runtime context"
                  >
                    <RefreshCw size={12} aria-hidden="true" />
                  </button>
                </div>

                {memoryPanelOpen && (
                  <div className="px-3 py-2 border-b border-border/40 space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {memories.length === 0 ? (
                      <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">No stored memories for this conversation.</p>
                    ) : memories.map(memory => (
                      <div key={memory.id} className="flex items-start justify-between gap-3 rounded-[6px] border border-border/30 bg-muted/10 px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{memory.scope}</span>
                            {memory.status && <span className="text-[9px] font-bold text-muted-foreground/60">{memory.status}</span>}
                          </div>
                          <p className="text-[11px] text-foreground/85 leading-relaxed">{memory.content}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateMemoryEnabled(memory.id, !memory.enabled)}
                            className="h-6 px-2 rounded-[4px] border border-border/30 text-[9px] font-bold uppercase text-muted-foreground hover:text-foreground"
                          >
                            {memory.enabled === false ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMemory(memory.id)}
                            className="h-6 w-6 rounded-[4px] border border-border/30 text-muted-foreground hover:text-destructive flex items-center justify-center"
                            title="Delete memory"
                            aria-label="Delete memory"
                          >
                            <Trash2 size={11} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {attachmentsPanelOpen && (
                  <div className="px-3 py-2 space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {attachments.length === 0 ? (
                      <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">No source attachments registered.</p>
                    ) : attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-[6px] border border-border/30 bg-muted/10 px-3 py-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <FileText size={13} className="text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-foreground">{attachment.filename}</p>
                            <p className="truncate text-[9px] text-muted-foreground">{attachment.file_type} · {attachment.file_path}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const job = await sidecarApi.promoteAttachmentToSourceJob(attachment.id);
                              toast.success(`Source job ready: ${job.title || job.file_name}`);
                            } catch (err: any) {
                              toast.error(err.message || 'Failed to promote source');
                            }
                          }}
                          className="h-6 px-2 rounded-[4px] border border-border/30 text-[9px] font-bold uppercase text-muted-foreground hover:text-foreground shrink-0"
                        >
                          Learn
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="relative flex items-center bg-bento-bg border border-border focus-within:border-foreground/30 rounded-[12px] transition-all overflow-hidden">
              <button
                type="button"
                onClick={handleAttachFile}
                disabled={isLoading}
                className="h-9 w-9 ml-1.5 flex items-center justify-center rounded-[8px] hover:bg-bento-item text-muted-foreground hover:text-foreground transition-all duration-150 shrink-0"
                title="Attach Source Document (PDF, TXT, MD)"
                aria-label="Attach Source Document (PDF, TXT, MD)"
              >
                <Paperclip size={15} aria-hidden="true" />
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
                    aria-label="Cancel Generation"
                >
                    <X size={14} aria-hidden="true" />
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
                    aria-label="Send message"
                >
                    <Send size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

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
        className={cn(
          "h-full w-full flex min-h-0 overflow-hidden relative bg-bento-panel rounded-[12px] border border-border/40 shadow-sm",
          activeTab !== 'ater' && "hidden"
        )}
      >
        <OracleView
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          onNoteSelect={() => {}}
        />
      </div>

      <div
        className={cn(
          "h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-y-auto custom-scrollbar p-6",
          activeTab !== 'pipeline' && "hidden"
        )}
      >
          <div className="max-w-3xl mx-auto w-full h-full flex flex-col overflow-hidden">
        {/* Bulk/background import content */}
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
