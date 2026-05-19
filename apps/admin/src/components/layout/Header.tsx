"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-50">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground truncate">Admin Portal</span>
        <div className="flex items-center gap-2 px-3 py-1 border border-border bg-accent/20">
          <div className="size-1.5 bg-primary rounded-none" />
          <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Live</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-accent border border-border rounded-none flex items-center justify-center transition-none"
          title="Toggle Theme"
        >
          {mounted ? (
            theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />
          ) : (
            <div className="size-4" /> // Placeholder to maintain layout
          )}
        </button>
      </div>
    </header>
  );
}
