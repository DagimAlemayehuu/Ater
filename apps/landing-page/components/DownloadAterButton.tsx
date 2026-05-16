"use client";

import React from 'react';
import { Download, Cpu, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DownloadAterButton() {
  const downloads = [
    { 
      label: 'macOS (Intel)', 
      info: 'X64_BINARY | 148MB', 
      url: 'https://github.com/DagimAlemayehuu/ater-releases/releases/latest/download/Ater-x64.dmg',
      icon: Cpu
    },
    { 
      label: 'macOS (M-Series)', 
      info: 'ARM64_SILICON | 142MB', 
      url: 'https://github.com/DagimAlemayehuu/ater-releases/releases/latest/download/Ater-aarch64.dmg',
      icon: Cpu
    },
    { 
      label: 'Windows', 
      info: 'X64_EXECUTABLE | 156MB', 
      url: 'https://github.com/DagimAlemayehuu/ater-releases/releases/latest/download/Ater_setup.exe',
      icon: Monitor
    }
  ];

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {downloads.map((item) => (
          <a 
            key={item.label}
            href={item.url}
            className={cn(
              "industrial-btn industrial-btn-primary w-full h-12 px-6 flex items-center justify-between group",
              "active:scale-[0.99] transition-all"
            )}
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black tracking-tight">{item.label.toUpperCase()}</span>
              <span className="text-[7px] font-bold opacity-30 tracking-[0.2em]">{item.info}</span>
            </div>
            <item.icon className="size-3.5 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
          </a>
        ))}
      </div>
      
      <p className="technical-label opacity-20 text-center text-[7px] pt-2">
        V0.1.0-BETA_PRODUCTION_STABLE
      </p>
    </div>
  );
}
