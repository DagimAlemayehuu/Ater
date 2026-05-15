"use client";

import React, { useState, useEffect } from 'react';
import { Download, Monitor, Laptop, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DownloadAterButton() {
  const [os, setOs] = useState<'mac' | 'windows' | 'linux' | 'unknown'>('unknown');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (userAgent.indexOf('mac') !== -1) setOs('mac');
    else if (userAgent.indexOf('win') !== -1) setOs('windows');
    else if (userAgent.indexOf('linux') !== -1) setOs('linux');
    else setOs('unknown');
  }, []);

  const getDownloadUrl = () => {
    const base = 'https://github.com/DagimAlemayehuu/LifeOs/releases/latest/download/';
    switch (os) {
      case 'mac': return `${base}Ater.dmg`;
      case 'windows': return `${base}Ater_setup.exe`;
      case 'linux': return `${base}Ater.AppImage`;
      default: return 'https://github.com/DagimAlemayehuu/LifeOs/releases/latest';
    }
  };

  const getOsIcon = () => {
    switch (os) {
      case 'mac': return <Laptop className="size-4" />;
      case 'windows': return <Monitor className="size-4" />;
      case 'linux': return <Terminal className="size-4" />;
      default: return <Download className="size-4" />;
    }
  };

  const getOsLabel = () => {
    switch (os) {
      case 'mac': return 'macOS';
      case 'windows': return 'Windows';
      case 'linux': return 'Linux';
      default: return 'Desktop App';
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4 w-full">
      <a 
        href={getDownloadUrl()}
        className={cn(
          "group w-full py-5 px-8 bg-foreground text-background flex items-center justify-between",
          "hover:bg-foreground/90 transition-all duration-300 border border-transparent active:scale-[0.99]"
        )}
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Download</span>
          <span className="text-sm font-black uppercase tracking-[0.1em]">{getOsLabel()} Build</span>
        </div>
        <div className="size-10 bg-background/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          {getOsIcon()}
        </div>
      </a>
      
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">
        v0.1.0-beta • High-Fidelity Binary
      </p>
    </div>
  );
}
