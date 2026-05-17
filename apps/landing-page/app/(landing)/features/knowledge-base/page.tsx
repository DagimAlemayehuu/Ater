"use client";

import React from 'react';
import Link from 'next/link';
import { IndustrialButton } from '@/components/IndustrialButton';
import { Shield, Share2, AlignLeft } from 'lucide-react';

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      
      {/* SECTION 01: HERO / SOVEREIGNTY */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              <span className="technical-label text-[10px] text-primary">SECURE STORAGE</span>
            </div>
            <h1 className="text-display-hero">
              KNOWLEDGE BASE
            </h1>
            <p className="text-body opacity-85 font-sans">
              A private note system that links directly to your local folders. All your study notes stay entirely on your computer—private and safe.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Save notes in simple Markdown files directly on your computer.</li>
              <li>&gt; Absolute privacy for your study guides, outlines, and lecture notes.</li>
              <li>&gt; Open notes instantly without needing any internet connection.</li>
            </ul>
          </div>
          
          {/* Editor Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">MY_NOTE_VAULT</span>
              <span className="text-[10px] opacity-40">STATUS: PRIVATE</span>
            </div>
            <div className="border border-outline-variant/30 bg-background/50 p-4 flex flex-col gap-3">
              <div className="text-primary font-bold">---</div>
              <div><span className="opacity-50">subject:</span> &quot;Computer Science&quot;</div>
              <div><span className="opacity-50">topic:</span> &quot;Database Indexes&quot;</div>
              <div><span className="opacity-50">links:</span> &quot;[[B-Trees]], [[Searching]]&quot;</div>
              <div className="text-primary font-bold">---</div>
              <div className="mt-2 text-sm font-bold text-on-background uppercase border-b border-outline-variant/20 pb-2">## 1. Local Notes</div>
              <div className="opacity-75">
                Every study module you create maps directly to a simple text file on your drive.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02: GRAPH TOPOLOGY */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-center">
          {/* Graph Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">VISUAL MAP</span>
              <span className="text-[10px] opacity-40">CONNECTIONS: ACTIVE</span>
            </div>
            <div className="border border-outline-variant/30 bg-background/30 p-6 flex flex-col gap-4 items-center justify-center min-h-[220px]">
              <div className="relative flex flex-col items-center justify-center size-36 border border-outline-variant/20 rounded-full">
                <span className="absolute size-3 bg-primary rounded-full animate-pulse"></span>
                <span className="absolute top-4 left-4 size-2 bg-on-background/40 rounded-full"></span>
                <span className="absolute bottom-6 right-2 size-2 bg-on-background/40 rounded-full"></span>
                
                <svg className="absolute inset-0 size-full" style={{ pointerEvents: 'none' }}>
                  <line x1="72" y1="72" x2="24" y2="24" stroke="var(--color-outline-variant)" strokeWidth="1" strokeDasharray="2 2" className="stroke-outline-variant opacity-50" />
                  <line x1="72" y1="72" x2="128" y2="110" stroke="var(--color-outline-variant)" strokeWidth="1" strokeDasharray="2 2" className="stroke-outline-variant opacity-50" />
                </svg>
                
                <div className="mt-12 font-mono text-[9px] opacity-40 uppercase">ACTIVE: DATABASE NOTES</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Share2 className="size-4 text-primary" />
              <span className="technical-label text-[10px] text-primary">VISUAL MAP</span>
            </div>
            <h2 className="text-section-heading">GRAPH MAP</h2>
            <p className="text-body opacity-85">
              See how your notes connect. Ater scans links between different notes to automatically build a visual study map.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Use simple links to connect notes together.</li>
              <li>&gt; Instantly see how different courses and chapters relate.</li>
              <li>&gt; Spot topics you might have missed or need to study more.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 03: GUTTER LAYOUTS */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-12 items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <AlignLeft className="size-4 text-primary" />
                <span className="technical-label text-[10px] text-primary">CLEAN DESIGN</span>
              </div>
              <h2 className="text-section-heading">CLEAN LAYOUTS</h2>
              <p className="text-body opacity-85">
                A simple design system made for distraction-free reading. Keep your study lists and lecture details looking neat and tidy.
              </p>
              <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
                <li>&gt; Clean margins and spacing for long reading sessions.</li>
                <li>&gt; No clutter or unnecessary elements on screen.</li>
                <li>&gt; Beautiful layout for math, tables, diagrams, and quizzes.</li>
              </ul>
            </div>
            
            {/* Gutter Mockup */}
            <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <span className="text-primary font-bold">SPACING FORMAT</span>
                <span className="text-[10px] opacity-40">CLEAN SPACING</span>
              </div>
              <div className="space-y-4">
                <div className="border-l-2 border-primary pl-4 py-1">
                  <p className="font-bold text-primary"># MAIN LECTURE NOTE</p>
                  <p className="text-[9px] opacity-45">Simple spacing borders</p>
                </div>
                <div className="bg-background/40 p-4 border border-outline-variant/30 text-on-surface/80 text-[10px]">
                  Notes are separated with neat borders, making it easy to scan text and study quickly.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
