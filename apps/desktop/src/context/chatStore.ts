import { create } from 'zustand'

export interface LessonPreview {
  title: string
  lessonPath: string
  notePath?: string
  hubPath?: string
  previewUrl: string
}

interface ChatStore {
  activeConversationId: string | null
  activeSessionId: string | null
  activeWorkspace: LessonPreview | null
  conversations: any[]
  messages: any[]
  sidebarOpen: boolean
  
  setActiveConversationId: (id: string | null) => void
  setActiveSessionId: (id: string | null) => void
  setActiveWorkspace: (workspace: LessonPreview | null) => void
  setConversations: (conversations: any[]) => void
  setMessages: (messages: any[]) => void
  setSidebarOpen: (open: boolean) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConversationId: null,
  activeSessionId: null,
  activeWorkspace: null,
  conversations: [],
  messages: [],
  sidebarOpen: true,

  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  setConversations: (conversations) => set({ conversations }),
  setMessages: (messages) => set({ messages }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
