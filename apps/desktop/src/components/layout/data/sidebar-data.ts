import {
  LayoutDashboard,
  Database,
  FileText,
  Brain,
  Zap,
  Settings,
  Users,
  Target,
  UserCircle
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
          title: 'Workforce',
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
    {
      title: 'Planning',
      items: [
        {
          title: 'Strategist',
          url: '/strategist',
          icon: Brain,
        },
        {
          title: 'Profiles',
          url: '/profiles',
          icon: UserCircle,
        },
        {
          title: 'Goals',
          url: '/goals',
          icon: Target,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
