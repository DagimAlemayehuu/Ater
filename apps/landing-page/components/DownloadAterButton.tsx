"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DownloadAterButton() {
  const [downloads, setDownloads] = useState({
    mac: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest/download/Ater-aarch64.dmg',
    windows: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest/download/Ater_setup.exe',
    version: 'v0.0.27',
    loading: true
  });

  useEffect(() => {
    async function fetchLatest() {
      try {
        const response = await fetch('https://api.github.com/repos/DagimAlemayehuu/Ater_Releases/releases/latest');
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        const assets = data.assets || [];
        const version = data.tag_name || 'v0.0.27';

        // Find the Silicon Mac DMG (aarch64 and .dmg)
        const macAsset = assets.find((a: any) => 
          a.name.toLowerCase().includes('aarch64') && a.name.endsWith('.dmg')
        );
        
        // Find the Windows Setup EXE (.exe)
        const winAsset = assets.find((a: any) => 
          a.name.endsWith('.exe')
        );

        setDownloads({
          mac: macAsset ? macAsset.browser_download_url : 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest/download/Ater-aarch64.dmg',
          windows: winAsset ? winAsset.browser_download_url : 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest/download/Ater_setup.exe',
          version: version,
          loading: false
        });
      } catch (error) {
        console.error("Failed to fetch latest Ater release", error);
        setDownloads(prev => ({ ...prev, loading: false }));
      }
    }
    fetchLatest();
  }, []);

  const downloadList = [
    { 
      label: 'macOS (Apple Silicon)', 
      info: `ARM64_SILICON | ${downloads.version}`, 
      url: downloads.mac,
      icon: Cpu
    },
    { 
      label: 'Windows', 
      info: `X64_EXECUTABLE | ${downloads.version}`, 
      url: downloads.windows,
      icon: Monitor
    }
  ];

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {downloadList.map((item) => (
          <a 
            key={item.label}
            href={item.url}
            download
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
        {downloads.loading ? 'CHECKING LATEST RELEASE...' : `${downloads.version.toUpperCase()}-BETA_PRODUCTION_STABLE`}
      </p>
    </div>
  );
}
