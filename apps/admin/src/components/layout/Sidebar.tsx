"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, ShieldAlert, BadgeDollarSign, Users, Settings, Clock, Terminal, Package } from "lucide-react";

const navItems = [
  { name: "Overview", href: "/?tab=telemetry", icon: Activity },
  { name: "Users", href: "/?tab=users", icon: Users },
  { name: "Waitlist", href: "/waitlist", icon: Clock },
  { name: "Releases", href: "/releases", icon: Package },
  { name: "System Logs", href: "/logs", icon: Terminal },
  { name: "Economy", href: "/?tab=economy", icon: BadgeDollarSign },
  { name: "Security", href: "/?tab=pipelines", icon: ShieldAlert },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "telemetry";

  return (
    <aside className="w-16 bg-bento-panel border border-border/40 rounded-[12px] flex flex-col items-center py-6 justify-between shrink-0 h-full select-none shadow-sm z-50">
      <div className="flex flex-col gap-8 items-center w-full">
        {/* Empty branding space */}
        <div className="size-10 mb-2" />

        {/* Navigation Links */}
        <nav className="flex flex-col gap-4 items-center w-full">
          {navItems.map((item) => {
            const isTabLink = item.href.includes("tab=");
            const itemTab = isTabLink ? item.href.split("tab=")[1] : null;
            const isActive = isTabLink 
              ? (pathname === "/" && activeTab === itemTab)
              : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative transition-all rounded-[8px] flex items-center justify-center size-10",
                  isActive 
                    ? "text-foreground bg-bento-item" 
                    : "text-muted-foreground hover:text-foreground hover:bg-bento-item"
                )}
                title={item.name}
              >
                {isActive && <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-foreground rounded-r-[2px]" />}
                <Icon className="size-5" strokeWidth={2.5} />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 items-center w-full">
        <Link
          href="/settings"
          className={cn(
            "relative transition-all rounded-[8px] flex items-center justify-center size-10",
            pathname === "/settings"
              ? "text-foreground bg-bento-item"
              : "text-muted-foreground hover:text-foreground hover:bg-bento-item"
          )}
          title="Settings"
        >
          {pathname === "/settings" && <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-foreground rounded-r-[2px]" />}
          <Settings className="size-5" strokeWidth={2.5} />
        </Link>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={
      <aside className="w-16 bg-bento-panel border border-border/40 rounded-[12px] flex flex-col items-center py-6 shrink-0 h-full select-none" />
    }>
      <SidebarContent />
    </Suspense>
  );
}
