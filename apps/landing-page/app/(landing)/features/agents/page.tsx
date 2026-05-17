"use client";

import React from 'react';
import Link from 'next/link';
import { IndustrialButton } from '@/components/IndustrialButton';
import { Cpu, Eye, Workflow } from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      
      {/* SECTION 01: HERO / LOCAL COMPUTE */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-primary" />
              <span className="technical-label text-[10px] text-primary">LOCAL AI</span>
            </div>
            <h1 className="text-display-hero">
              REASONING AGENTS
            </h1>
            <p className="text-body opacity-85">
              Smart AI assistants that run directly on your own computer. Get help analyzing and studying your notes without sending your data to the cloud.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Run AI tasks safely on your own hardware.</li>
              <li>&gt; Absolute data privacy—your personal notes never leave your device.</li>
              <li>&gt; Quick responses using offline AI model caching.</li>
            </ul>
          </div>
          
          {/* Local Compute Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">LOCAL_AI_ASSISTANT</span>
              <span className="text-[10px] opacity-40">CPU: NATIVE</span>
            </div>
            <div className="p-4 border border-outline-variant/30 bg-background/50 flex flex-col gap-2">
              <span className="text-[9px] opacity-40 uppercase">YOUR QUESTION</span>
              <p className="text-on-background font-bold uppercase">&quot;Compare database indexes based on my notes.&quot;</p>
            </div>
            <div className="p-4 border border-outline-variant/30 bg-background/30 flex flex-col gap-2">
              <span className="text-[9px] opacity-40 uppercase">AI RESPONSE // OFFLINE MODE</span>
              <p className="text-emerald-500 font-bold">&gt; ANALYZING LOCAL FILES... DONE (100% SECURE)</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02: VERIFIABLE REASONING */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-center">
          {/* Reasoning Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">AI STEPS</span>
              <span className="text-[10px] opacity-40">3 SOURCES FOUND</span>
            </div>
            <div className="space-y-3 text-[10px]">
              <div className="p-3 border border-outline-variant/30 bg-background/40 flex flex-col gap-1">
                <span className="text-[8px] opacity-45 uppercase">STEP 1: READING SOURCES</span>
                <p className="text-primary font-bold">&gt; FOUND: Database_Notes.md</p>
              </div>
              <div className="p-3 border border-outline-variant/30 bg-background/40 flex flex-col gap-1">
                <span className="text-[8px] opacity-45 uppercase">STEP 2: DETECTING CONNECTIONS</span>
                <p className="text-primary font-bold">&gt; FOUND LINK: [[B-Trees]]</p>
              </div>
              <div className="p-3 border border-outline-variant/30 bg-background/40 flex flex-col gap-1">
                <p className="text-emerald-500 font-bold">&gt; ANSWER COMPILED WITH SOURCES</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              <span className="technical-label text-[10px] text-primary">CLEAR PROOF</span>
            </div>
            <h2 className="text-section-heading">VERIFIABLE REASONING</h2>
            <p className="text-body opacity-85">
              No guesswork. See exactly where the AI gets its answers by tracing suggestions directly back to your study files.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Trace citations and notes back to exact files in your vault.</li>
              <li>&gt; Read the full step-by-step logic the AI used to compile answers.</li>
              <li>&gt; Adjust AI rules anytime to match your learning style.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 03: AGENT SYNAPSE */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-12 items-center justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Workflow className="size-4 text-primary" />
                <span className="technical-label text-[10px] text-primary">WORKFLOWS</span>
              </div>
              <h2 className="text-section-heading">AGENT TASKS</h2>
              <p className="text-body opacity-85">
                Set up background tasks to make your studying easier. The AI can find gaps in your study notes or automatically write practice flashcards.
              </p>
              <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
                <li>&gt; Find missing definitions or key topics in your study notes.</li>
                <li>&gt; Summarize textbooks or lecture PDFs in the background.</li>
                <li>&gt; Automatically create flashcard lists to test your memory.</li>
              </ul>
            </div>
            
            {/* Synapse Mockup */}
            <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <span className="text-primary font-bold">BACKGROUND_TASKS</span>
                <span className="text-[10px] opacity-40">TASKS: RUNNING</span>
              </div>
              <div className="space-y-2">
                <div className="border border-outline-variant/30 p-3 bg-background/40 flex justify-between items-center text-[10px]">
                  <span>&gt; NOTE CHECK: CS 301 VAULT</span>
                  <span className="text-emerald-500 font-bold">COMPLETE</span>
                </div>
                <div className="border border-outline-variant/30 p-3 bg-background/40 flex justify-between items-center text-[10px]">
                  <span>&gt; FLASHCARDS: B-TREES</span>
                  <span className="text-primary font-bold">12 CREATED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
