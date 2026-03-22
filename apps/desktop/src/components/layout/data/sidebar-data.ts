import {
  LayoutDashboard,
  Database,
  FileText,
  Users,
  Zap
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'User',
    email: 'user@lifeos.local',
    avatar: '',
  },
  teams: [
    {
      name: 'Life OS',
      logo: Zap,
      plan: 'Local',
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
      ],
    },
    {
      title: 'Workspaces',
      items: [
        {
          title: 'Notion',
          url: '/notion',
          icon: Database,
        },
        {
          title: 'Obsidian',
          url: '/obsidian',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        {
          title: 'Orchestrator',
          url: '/chat',
          icon: Zap,
        },
        {
          title: 'Agents',
          url: '/agents',
          icon: Users,
        },
        {
          title: 'Automations',
          url: '/automations',
          icon: Zap,
        },
      ],
    },
  ],
}
