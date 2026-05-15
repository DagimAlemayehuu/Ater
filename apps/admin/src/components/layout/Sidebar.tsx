"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  Activity, 
  Settings, 
  Database,
  BarChart3,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", href: "/", icon: BarChart3 },
  { name: "Waitlist", href: "/waitlist", icon: UserPlus },
  { name: "User Base", href: "/users", icon: Users },
  { name: "Usage Logs", href: "/logs", icon: Activity },
  { name: "App Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] border-r border-black/5 bg-white flex flex-col h-full shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-8 flex items-center gap-4">
        <div className="size-10 bg-black flex items-center justify-center rounded-2xl shadow-xl">
          <ShieldCheck className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-[18px] font-black tracking-tighter uppercase leading-none text-black">Ater</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Oracle</p>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-10 mt-6">
        <div>
          <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-gray-300 mb-6">Operations</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
                    isActive 
                      ? "bg-black text-white shadow-lg shadow-black/10 scale-[1.02]" 
                      : "text-gray-500 hover:text-black hover:bg-gray-50"
                  )}
                >
                  <item.icon className={cn(
                    "size-4.5 transition-colors",
                    isActive ? "text-white" : "text-gray-300 group-hover:text-black"
                  )} />
                  <span className="text-[13px] font-bold tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-gray-300 mb-6">Status</h2>
          <div className="mx-2 p-5 bg-gray-50 border border-black/5 rounded-[2rem] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">Network</span>
              <div className="flex gap-1">
                <span className="size-1 rounded-full bg-black" />
                <span className="size-1 rounded-full bg-black/20" />
                <span className="size-1 rounded-full bg-black/20" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-8 bg-white rounded-xl flex items-center justify-center border border-black/5 shadow-sm">
                <Database className="size-3.5 text-black" />
              </div>
              <span className="text-[12px] font-bold tracking-tight truncate">PostgreSQL 17</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-black/5 mt-auto">
        <div className="flex items-center gap-4 px-3 py-3 bg-gray-50 rounded-2xl border border-black/5">
          <div className="size-8 bg-black text-white rounded-xl flex items-center justify-center text-[11px] font-black shadow-lg">AD</div>
          <div className="flex-1 truncate">
            <p className="text-[12px] font-bold truncate text-black">Admin</p>
            <p className="text-[10px] text-gray-400 font-medium truncate">admin@ater.ai</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
