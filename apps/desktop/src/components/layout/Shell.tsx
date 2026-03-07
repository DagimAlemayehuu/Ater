import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Zap,
    Terminal,
    UserCircle,
    Settings,
    BrainCircuit,
    PanelLeft,
    ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Sidebar definition
 */
const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'The Strategist', path: '/strategist', icon: Zap },
    { label: 'The Debugger', path: '/debugger', icon: Terminal },
    { label: 'Profiles', path: '/profiles', icon: UserCircle },
    { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Shell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = React.useState(false)
    const location = useLocation()

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden antialiased dark">
            {/* Sidebar */}
            <aside
                className={cn(
                    "relative flex flex-col border-r bg-card transition-all duration-300",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                <div className="flex items-center h-14 px-4 border-b">
                    <BrainCircuit className="w-6 h-6 mr-2 text-primary" />
                    {!collapsed && <span className="font-bold tracking-tight">LIFE OS</span>}
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center px-3 py-2 rounded-md transition-colors",
                                "hover:bg-muted hover:text-foreground",
                                isActive ? "bg-muted text-foreground" : "text-muted-foreground",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", !collapsed && "mr-3")} />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md hover:text-foreground"
                >
                    <PanelLeft className="h-4 w-4" />
                </button>
            </aside>

            {/* Main content */}
            <main className="flex flex-col flex-1 min-w-0 overflow-auto">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Life OS</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="font-medium text-foreground">
                            {navItems.find(n => n.path === location.pathname)?.label || 'Overview'}
                        </span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                        {/* Dynamic sidecar status badge would go here */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border bg-muted/50 text-[10px] font-bold tracking-widest uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            ONLINE
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
