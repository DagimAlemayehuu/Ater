import {
  LayoutDashboard,
  Settings,
  Zap,
  MessageSquare,
  Brain,
  GraduationCap,
  Command,
  FileText,
  Database,
  Crosshair,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Administrator',
    email: 'admin@lifeos.local',
    avatar: '',
  },
  teams: [
    {
      name: 'Life OS',
      logo: Command,
      plan: 'Admin System',
    },
  ],
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Strategist',
          url: '/strategist',
          icon: Crosshair,
        },
        {
          title: 'Goals',
          url: '/goals',
          icon: Zap,
        },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        {
          title: 'Chat',
          url: '/chat',
          icon: MessageSquare,
        },
        {
          title: 'Architect',
          url: '/oka',
          icon: Brain,
        },
        {
          title: 'Academics',
          url: '/academics',
          icon: GraduationCap,
        },
        {
          title: 'Zettelkasten',
          url: '/obsidian',
          icon: FileText,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Notion',
          url: '/notion',
          icon: Database,
        },
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
