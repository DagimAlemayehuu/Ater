import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Settings,
    Brain,
    Menu,
    Moon,
    Sun,
    Database,
    FileText,
    Zap,
    Users,
    Command
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'

const navGroups = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Workspaces',
        items: [
            { label: 'Notion', path: '/notion', icon: Database },
            { label: 'Obsidian', path: '/obsidian', icon: FileText },
        ],
    },
    {
        title: 'Intelligence',
        items: [
            { label: 'Orchestrator', path: '/chat', icon: Zap },
            { label: 'Workforce', path: '/agents', icon: Users },
            { label: 'Automations', path: '/automations', icon: Command },
        ],
    },
    {
        title: 'System',
        items: [
            { label: 'Settings', path: '/settings', icon: Settings },
        ],
    },
]

const allNavItems = navGroups.flatMap(g => g.items)

export default function Shell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()
    const { theme, setTheme } = useTheme()

    const currentItem = allNavItems.find(n => n.path === location.pathname)
    const isFullPage = location.pathname === '/chat'

    return (
        <SidebarProvider defaultOpen={!collapsed}>
            <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased selection:bg-foreground selection:text-background w-full">

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/40 bg-background transition-all duration-300 lg:relative lg:translate-x-0 overflow-hidden shrink-0",
                    collapsed ? "w-[60px] min-w-[60px] max-w-[60px]" : "w-[240px] min-w-[240px] max-w-[240px]",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo Area */}
                <div className={cn("flex h-14 items-center shrink-0 border-b border-border/40", collapsed ? "justify-center px-2" : "px-4 gap-3")}>
                    <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-foreground text-background font-black">
                        <Zap className="w-4 h-4 fill-current" />
                    </div>
                    {!collapsed && (
                        <span className="font-black text-xs uppercase tracking-[0.2em] text-foreground/90">LifeOS</span>
                    )}
                </div>

                {/* Nav Links */}
                <nav className={cn("flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar", collapsed ? "px-1.5" : "px-2")}>
                    {navGroups.map((group) => (
                        <div key={group.title} className="space-y-1">
                            {!collapsed && (
                                <h4 className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2">
                                    {group.title}
                                </h4>
                            )}
                            <div className="space-y-1.5">
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.path
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                                "flex items-center rounded-md transition-all duration-150 group relative",
                                                collapsed ? "justify-center p-2.5 mx-auto" : "px-3 py-2 gap-3",
                                                isActive
                                                    ? "bg-muted text-foreground font-medium"
                                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className={cn("shrink-0", collapsed ? "w-4 h-4" : "w-4 h-4")} />
                                            {!collapsed && <span className="text-sm tracking-tight">{item.label}</span>}

                                            {/* Tooltip for collapsed view */}
                                            {collapsed && (
                                                <div className="absolute left-full ml-2 hidden group-hover:block z-50 rounded-md bg-popover border px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md whitespace-nowrap">
                                                    {item.label}
                                                </div>
                                            )}
                                        </NavLink>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="flex h-14 items-center justify-between gap-4 border-b border-border/40 bg-background px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent text-muted-foreground focus:outline-none"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                            <span className="font-bold text-foreground tracking-tight uppercase text-xs">
                                {currentItem?.label || 'Page'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 ml-auto">
                        {/* Removed redundant toggles per user request */}
                    </div>
                </header>

                {/* Dynamic Content Area */}
                <div className={cn(
                    "flex-1 overflow-auto custom-scrollbar relative",
                    isFullPage ? "p-0" : "p-6 sm:p-8"
                )}>
                    <div className={cn("mx-auto h-full", isFullPage ? "max-w-none" : "max-w-7xl")}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
        </SidebarProvider>
    )
}
