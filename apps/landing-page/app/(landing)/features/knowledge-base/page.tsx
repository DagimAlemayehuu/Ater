"use client";

import React from 'react';
import { MacbookMockup } from '@/components/MacbookMockup';

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col">
      
      {/* SECTION 01: SOVEREIGNTY / LOCAL NOTE VAULT */}
      <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-6 text-center items-center justify-center flex-1">
          <h1 className="text-display-hero text-center w-full uppercase">
            KNOWLEDGE BASE
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85 text-center">
            A safe place to keep all your study notes. Your files stay on your own computer, with generation and reasoning powered by secure external LLM connections.
          </p>
          
          {/* Integrated Mockup */}
          <div className="w-full max-w-4xl relative origin-center flex items-center justify-center mt-2">
            <MacbookMockup 
              lightSrc="/notes-light.png" 
              darkSrc="/notes-dark.png" 
              alt="Knowledge Base Note Vault" 
              priority 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
            {[
              { label: "Local-First Storage", desc: "Your notes live inside plain files on your hard drive." },
              { label: "Offline Accessibility", desc: "Instant startup and note opening with zero internet needed." },
              { label: "Markdown Standard", desc: "No locked formats. Take your notes to any other app." }
            ].map(item => (
              <div key={item.label} className="p-4 border border-outline-variant bg-surface flex flex-col gap-1 text-left">
                <span className="text-[10px] opacity-50 uppercase">{item.label}</span>
                <span className="text-sm font-bold tracking-tight text-primary uppercase">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* SECTION 02: DYNAMIC COLLAPSIBLE WORKSPACE */}
      <section className="z-20 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">A CLEAN WORKSPACE</h2>
            <p className="text-body opacity-85">
              A clean screen that helps you focus. Work without distractions using adjustable layouts. You can see your note list on the left, your main lesson in the middle, and the study assistant on the right.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Collapsible Left Panel hosts directory navigation and file lists.</li>
              <li> Center Canvas renders rich Markdown study notes and document viewers.</li>
              <li> Collapsible Right Panel keeps the AI Sidecar and Property Inspectors ready.</li>
            </ul>
          </div>
          
          {/* Workspace Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-4 flex flex-col gap-3 text-[10px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Workspace Shell</span>
              <span className="opacity-40">PANELS: ACTIVE</span>
            </div>
            <div className="grid grid-cols-4 gap-2 h-44 text-[9px]">
              {/* Left Panel */}
              <div className="border border-outline-variant/30 bg-background/40 p-2 flex flex-col gap-1.5 overflow-hidden">
                <span className="opacity-40 uppercase tracking-tighter">OUTLINE</span>
                <div className="text-emerald-500 font-bold">[X] Syllabus</div>
                <div className="opacity-60">[ ] Limits</div>
                <div className="opacity-60">[ ] Graph</div>
              </div>
              {/* Center Panel */}
              <div className="col-span-2 border border-outline-variant/50 bg-background/10 p-2 flex flex-col gap-2 overflow-hidden">
                <div className="font-bold border-b border-outline-variant/20 pb-1 text-primary">LIMITS INTRODUCTION</div>
                <p className="text-[9px] opacity-70">
                  A limit is the value that a function approaches as the input approaches some value.
                </p>
              </div>
              {/* Right Panel */}
              <div className="border border-outline-variant/30 bg-background/40 p-2 flex flex-col gap-1.5 overflow-hidden">
                <span className="opacity-40 uppercase tracking-tighter">PROPERTIES</span>
                <div>course: CS101</div>
                <div>year: 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: HIGH-FIDELITY DOCUMENT VIEWERS */}
      <section className="z-30 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          
          {/* Viewers Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Note Viewer</span>
              <span className="text-[10px] opacity-40">LINKS: PARSED</span>
            </div>
            
            <div className="border border-outline-variant/30 bg-background/50 p-4 flex flex-col gap-3">
              <div className="flex gap-2 items-center">
                <span className="text-[9px] px-2 py-0.5 border border-primary text-primary bg-background">WIKI LINK</span>
                <span className="opacity-75">Clicking [[Calculus-Limits]] traverses notes.</span>
              </div>
              
              <div className="flex gap-2 items-center border-t border-outline-variant/10 pt-2">
                <span className="text-[9px] px-2 py-0.5 border border-primary text-primary bg-background">CHECKLIST</span>
                <span className="text-emerald-500 font-bold">[X] Toggled checklist writes to disk.</span>
              </div>

              <div className="border border-primary/20 bg-primary/5 p-3 flex flex-col gap-1 mt-1">
                <span className="text-[9px] text-primary font-bold">FLOATING ACTIONS</span>
                <p className="text-[10px]">Highlighted text triggers a floating &quot;Explain More&quot; button.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">SIDE-BY-SIDE READERS</h2>
            <p className="text-body opacity-85">
              Read your books and notes side-by-side. You can click on direct links to jump to other notes, check off things you've learned to update your files instantly, and ask the assistant to explain hard words.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Clickable wiki links [[NoteName]] connect topics instantly.</li>
              <li> Sandboxed PDF frames stream text highlight coordinates to the system.</li>
              <li> Checking boxes updates the raw file content instantly on your hard drive.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 04: NEURAL CONCEPT GRAPH */}
      <section className="z-[40] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">A VISUAL BRAIN MAP</h2>
            <p className="text-body opacity-85">
              See a visual map of your brain. Watch how different topics connect to each other like a web. The more notes you write about a specific topic, the bigger its circle gets so you know what is important.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Force-directed equations balance repulsive constants and spring link distances.</li>
              <li> Larger study hubs represent files with the highest note density.</li>
              <li> Zoom-dependent logic ensures text labels show only when you zoom in.</li>
            </ul>
          </div>
          
          {/* Neural Graph Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Study Map</span>
              <span className="text-[9px] opacity-40">SIMULATION: RIGID</span>
            </div>
            <div className="border border-outline-variant/30 bg-background/30 p-6 flex flex-col gap-4 items-center justify-center min-h-[220px]">
              <div className="relative flex flex-col items-center justify-center size-36 border border-outline-variant/20 rounded-full">
                <span className="absolute size-4 bg-primary rounded-full animate-pulse"></span>
                <span className="absolute top-4 left-4 size-2.5 bg-primary/70 rounded-full"></span>
                <span className="absolute bottom-6 right-2 size-2 bg-on-background/40 rounded-full"></span>
                <span className="absolute top-10 right-6 size-2 bg-on-background/40 rounded-full"></span>
                
                <svg className="absolute inset-0 size-full" style={{ pointerEvents: 'none' }}>
                  <line x1="72" y1="72" x2="24" y2="24" stroke="var(--color-outline-variant)" strokeWidth="1" className="stroke-outline-variant opacity-40" />
                  <line x1="72" y1="72" x2="128" y2="110" stroke="var(--color-outline-variant)" strokeWidth="1" className="stroke-outline-variant opacity-40" />
                  <line x1="72" y1="72" x2="110" y2="40" stroke="var(--color-outline-variant)" strokeWidth="1" className="stroke-outline-variant opacity-40" />
                </svg>
                
                <div className="mt-12 text-[8px] text-primary font-bold tracking-tight uppercase">GPA: Calculus Hub</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: CONCEPT PATHWAYS & TRAVERSAL */}
      <section className="z-[50] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          {/* Concept Pathways Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Study Path Navigation</span>
              <span className="text-[10px] opacity-40">HUB: DATABASE</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] opacity-40 uppercase">ACTIVE PATH</span>
                <div className="border border-outline-variant/30 bg-background/40 p-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-primary text-[10px]">Part 2: B-Trees Analysis</span>
                    <p className="text-[8px] opacity-50 mt-0.5">Semesters study list</p>
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold">[X] DONE</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 h-9 border border-outline-variant hover:bg-background text-[9px] font-bold uppercase transition-colors">
                  &lt; PREVIOUS STEP
                </button>
                <button className="flex-1 h-9 border border-primary bg-primary text-background hover:bg-background hover:text-primary text-[9px] font-bold uppercase transition-colors">
                  FINISH & NEXT &gt;
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">YOUR STUDY PATHS</h2>
            <p className="text-body opacity-85">
              Your personal study roadmap. Ater turns a big list of study files into a step-by-step sequential guide, showing you exactly what to read first, second, and third so you never get lost.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Convert outline documents to step-by-step sequential reading bars.</li>
              <li> Automated navigation loads previous and next steps quickly.</li>
              <li> Launch focus sessions to keep study history logged in real time.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 06: FRONTMATTER METADATA INSPECTOR */}
      <section className="z-[60] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">NOTE PROPERTY CARDS</h2>
            <p className="text-body opacity-85">
              Manage note details instantly. Track which class a note belongs to, mark lessons as completed, set due dates, and update your local study database with simple checklists.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Visual fields isolate course connections, dates, and checklists.</li>
              <li> Form changes parse variables back into YAML headers.</li>
              <li> Saves parameters directly to note files automatically.</li>
            </ul>
          </div>
          
          {/* Metadata Inspector Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Note Properties</span>
              <span className="text-[10px] opacity-40">YAML HEADER</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { name: "Course", type: "Link", val: "[[CS-301]]" },
                { name: "Completed", type: "Checkbox", val: "[X]" },
                { name: "Deadline", type: "Date", val: "2026-05-20" }
              ].map(prop => (
                <div key={prop.name} className="border border-outline-variant/30 p-2.5 bg-background/40 flex justify-between items-center text-[10px]">
                  <span className="opacity-45">{prop.name}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-[8px] opacity-30 uppercase">{prop.type}</span>
                    <span className="font-bold text-primary">{prop.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 07: LOCAL AI SIDECAR & PROMPT CONTROL */}
      <section className="z-[70] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          {/* Local AI Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Tutor Sidecar</span>
              <span className="text-[10px] opacity-40">STREAMING ACTIVE</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5 border border-outline-variant/30 p-3 bg-background/40">
                <span className="text-[8px] opacity-40 uppercase">EXPLANATION STREAM</span>
                <p className="text-[10px] text-primary">
                  &quot;B-Trees optimize hard drive operations by letting you read large blocks of data at once...&quot;
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[8px] opacity-45 uppercase">PROMPT ADJUSTMENT PARAMETERS</span>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span>INNOVATION</span>
                    <span className="text-primary">70%</span>
                  </div>
                  <div className="h-1 bg-outline-variant/30 relative">
                    <div className="absolute left-0 top-0 h-full w-[70%] bg-primary"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span>POLISH LEVEL</span>
                    <span className="text-primary">90%</span>
                  </div>
                  <div className="h-1 bg-outline-variant/30 relative">
                    <div className="absolute left-0 top-0 h-full w-[90%] bg-primary"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">YOUR PRIVATE TUTOR</h2>
            <p className="text-body opacity-85">
              Highlight any sentence in your books or notes, and the AI sidecar tutor will explain it instantly in simple words—powered by secure external LLM providers.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Stream explanations instantly using secure external LLM connections.</li>
              <li> Dual personas translate details: Strategist for architectures, Creator for code.</li>
              <li> Sliders adjust generation settings like innovation, detail levels, and polish.</li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}
