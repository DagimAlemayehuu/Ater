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

  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'mac' | 'win'>('mac');
  const [copiedCmd, setCopiedCmd] = useState(false);

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

  const copyCommand = () => {
    navigator.clipboard.writeText("xattr -cr ");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

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
    <div className="w-full space-y-4">
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
      
      {/* Help Link and Expandable Guide */}
      <div className="border-t border-outline-variant/30 pt-3">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="w-full py-1.5 flex items-center justify-between text-[8px] font-black tracking-[0.25em] text-primary/50 hover:text-primary transition-all uppercase"
        >
          <span>Need Installation Help?</span>
          <span className="font-bold underline tracking-widest">{showGuide ? "HIDE INFO ▴" : "INSTALLATION GUIDE ▾"}</span>
        </button>

        {showGuide && (
          <div className="mt-3 p-5 bg-background border border-outline-variant/60 rounded-[0.5rem] space-y-4 animate-in slide-in-from-top-1.5 duration-200">
            {/* Tab Selectors */}
            <div className="flex border-b border-outline-variant/30 pb-2 gap-4">
              <button 
                onClick={() => setGuideTab('mac')}
                className={cn(
                  "text-[8px] font-black tracking-[0.2em] pb-1.5 transition-all border-b-2",
                  guideTab === 'mac' ? "border-primary text-primary" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                MACOS BYPASS
              </button>
              <button 
                onClick={() => setGuideTab('win')}
                className={cn(
                  "text-[8px] font-black tracking-[0.2em] pb-1.5 transition-all border-b-2",
                  guideTab === 'win' ? "border-primary text-primary" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                WINDOWS BYPASS
              </button>
            </div>

            {/* Tab Panes */}
            {guideTab === 'mac' ? (
              <div className="space-y-3 text-[10px] leading-relaxed text-body opacity-80">
                <p className="font-bold text-primary text-[10px] uppercase tracking-wider">Fixing "Ater.app is damaged" Quarantine Lock:</p>
                <ol className="list-decimal pl-4 space-y-2 font-mono text-[9px] text-body/90">
                  <li>
                    Open your Mac's <span className="text-primary font-bold font-sans">Terminal</span>.
                  </li>
                  <li>
                    Type the following command with a space at the end:
                    <div className="mt-1.5 p-2.5 bg-black border border-outline-variant/40 rounded flex items-center justify-between text-white font-mono text-[9px]">
                      <span>xattr -cr </span>
                      <button 
                        onClick={copyCommand}
                        className="text-[7.5px] text-primary hover:underline font-sans font-black tracking-widest uppercase"
                      >
                        {copiedCmd ? "COPIED" : "COPY"}
                      </button>
                    </div>
                  </li>
                  <li>
                    Open your <span className="font-sans font-bold text-primary">Applications</span> folder in Finder, drag & drop <span className="text-primary font-bold">Ater.app</span> directly into the Terminal window to auto-fill the path.
                  </li>
                  <li>
                    Press <span className="text-primary font-bold font-sans">Enter</span> and launch Ater cleanly!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-[10px] leading-relaxed text-body opacity-80">
                <p className="font-bold text-primary text-[10px] uppercase tracking-wider">Bypassing "Windows protected your PC" filter:</p>
                <ol className="list-decimal pl-4 space-y-2 font-mono text-[9px] text-body/90">
                  <li>
                    Double-click the downloaded <span className="text-primary font-bold">Ater_setup.exe</span> installer.
                  </li>
                  <li>
                    On the blue SmartScreen alert box, click the small <span className="text-primary font-bold underline font-sans">More info</span> link in the description.
                  </li>
                  <li>
                    Click the newly revealed <span className="text-primary font-bold font-sans">Run anyway</span> button at the bottom-right.
                  </li>
                  <li>
                    The setup wizard will launch and set up Ater perfectly!
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="technical-label opacity-20 text-center text-[7px] pt-1">
        {downloads.loading ? 'CHECKING LATEST RELEASE...' : `${downloads.version.toUpperCase()}-BETA_PRODUCTION_STABLE`}
      </p>
    </div>
  );
}
