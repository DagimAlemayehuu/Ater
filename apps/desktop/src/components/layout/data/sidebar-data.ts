import {
  LayoutDashboard,
  Database,
  FileText,
  Brain,
  Zap,
  Settings
} from "lucide-react"

export const sidebarData = {
  navMain: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "Workspaces",
      items: [
        { title: "Notion Hub", url: "/notion", icon: Database },
        { title: "Obsidian Vault", url: "/obsidian", icon: FileText }
      ]
    },
    {
      title: "Intelligence",
      items: [
        { title: "Agents", url: "/agents", icon: Brain },
        { title: "Automations", url: "/automations", icon: Zap }
      ]
    },
    {
      title: "System",
      items: [
        { title: "Settings", url: "/settings", icon: Settings }
      ]
    }
  ]
}
