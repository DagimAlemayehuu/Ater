"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const FALLBACK_VERSION = 'v0.4.6';

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

export function DownloadAterButton() {
  const [downloads, setDownloads] = useState({
    mac: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest/download/Ater-aarch64.dmg',
    windows: 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest/download/Ater_setup.exe',
    version: FALLBACK_VERSION,
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
        const version = data.tag_name || FALLBACK_VERSION;

        // Find the Silicon Mac DMG (aarch64 and .dmg)
        const macAsset = assets.find((a: ReleaseAsset) =>
          a.name.toLowerCase().includes('aarch64') && a.name.endsWith('.dmg')
        );
        
        // Find the Windows Setup EXE (.exe)
        const winAsset = assets.find((a: ReleaseAsset) =>
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
      
      {/* Help Link and Modal Guide */}
      <div className="border-t border-outline-variant/30 pt-3">
        <button 
          onClick={() => setShowGuide(true)}
          className="w-full py-2 flex items-center justify-between text-[9px] font-black tracking-[0.25em] text-primary/60 hover:text-primary transition-all uppercase"
        >
          <span>Need Installation Help?</span>
          <span className="font-bold underline tracking-widest">SHOW GUIDE ▾</span>
        </button>

        {showGuide && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            {/* Modal Box */}
            <div className="w-full max-w-md bg-surface border border-outline-variant p-6 md:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-outline-variant pb-4">
                <span className="technical-label !text-[11px] text-primary">INSTALLATION GUIDE</span>
                <button 
                  onClick={() => setShowGuide(false)} 
                  className="technical-label opacity-40 hover:opacity-100 transition-opacity !text-[10px] px-3 py-1.5 border border-outline-variant hover:border-primary cursor-pointer"
                >
                  CLOSE [X]
                </button>
              </div>

              {/* Tab Selectors */}
              <div className="flex border-b border-outline-variant/30 pb-2 gap-6">
                <button 
                  onClick={() => setGuideTab('mac')}
                  className={cn(
                    "text-[10px] font-black tracking-[0.2em] pb-1.5 transition-all border-b-2 font-mono uppercase cursor-pointer",
                    guideTab === 'mac' ? "border-primary text-primary" : "border-transparent opacity-40 hover:opacity-100"
                  )}
                >
                  MACOS
                </button>
                <button 
                  onClick={() => setGuideTab('win')}
                  className={cn(
                    "text-[10px] font-black tracking-[0.2em] pb-1.5 transition-all border-b-2 font-mono uppercase cursor-pointer",
                    guideTab === 'win' ? "border-primary text-primary" : "border-transparent opacity-40 hover:opacity-100"
                  )}
                >
                  WINDOWS
                </button>
              </div>

              {/* Tab Content */}
              {guideTab === 'mac' ? (
                <div className="space-y-4 text-[11px] leading-relaxed text-body">
                  <p className="font-bold text-primary uppercase tracking-wider !text-[10px]">
                    If macOS blocks launch:
                  </p>
                  <ol className="list-decimal pl-4 space-y-3 font-mono text-[10px] opacity-80">
                    <li>
                      Open your Mac&apos;s <strong className="text-on-surface font-sans font-bold">Terminal</strong> app.
                    </li>
                    <li>
                      Type the following command followed by a space:
                      <div className="mt-2 p-3 bg-background border border-outline-variant flex items-center justify-between font-mono text-[10px]">
                        <span>xattr -cr </span>
                        <button 
                          onClick={copyCommand}
                          className="text-[9px] text-primary hover:underline font-black tracking-widest uppercase px-2 py-0.5 border border-outline-variant hover:border-primary cursor-pointer"
                        >
                          {copiedCmd ? "COPIED" : "COPY"}
                        </button>
                      </div>
                    </li>
                    <li>
                      Open your Applications folder in Finder and drag <strong className="text-primary font-sans font-bold">Ater.app</strong> directly into the Terminal window.
                    </li>
                    <li>
                      Press <strong className="text-primary font-sans font-bold">Enter</strong> and launch the app normally.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-4 text-[11px] leading-relaxed text-body">
                  <p className="font-bold text-primary uppercase tracking-wider !text-[10px]">
                    If Windows blocks launch:
                  </p>
                  <ol className="list-decimal pl-4 space-y-3 font-mono text-[10px] opacity-80">
                    <li>
                      Launch the downloaded <strong className="text-primary font-sans font-bold">Ater_setup.exe</strong> file.
                    </li>
                    <li>
                      Click the small <strong className="text-on-surface underline font-sans font-bold">More info</strong> link on the alert window.
                    </li>
                    <li>
                      Click <strong className="text-primary font-sans font-bold">Run anyway</strong>.
                    </li>
                    <li>
                      The installer will finish normally.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="technical-label opacity-20 text-center text-[7px] pt-1">
        {downloads.loading ? 'CHECKING LATEST RELEASE...' : `${downloads.version.toUpperCase()}-BETA`}
      </p>
    </div>
  );
}
