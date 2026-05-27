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
    <header className="h-14 bg-bento-panel border border-border/40 rounded-[12px] flex items-center justify-between px-6 z-40 select-none shadow-sm">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground">
          Control center
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-1.5 hover:bg-bento-item border border-border/40 rounded-[8px] flex items-center justify-center transition-all cursor-pointer text-muted-foreground hover:text-foreground"
          title="Toggle Theme"
        >
          {mounted ? (
            theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />
          ) : (
            <div className="size-4" />
          )}
        </button>
      </div>
    </header>
  );
}
