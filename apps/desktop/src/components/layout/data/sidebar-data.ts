import {
  FileText,
  Users,
  Zap,
  RefreshCw
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
      title: 'Knowledge Base',
      items: [
        {
          title: 'Obsidian',
          url: '/obsidian',
          icon: FileText,
        },
        {
          title: 'Vault Sync',
          url: '/vault-sync',
          icon: RefreshCw,
        },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        {
          title: 'Agents',
          url: '/agents',
          icon: Users,
        },
      ],
    },
  ],
}
