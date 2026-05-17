"use client";

import React from 'react';
import { IndustrialButton } from '@/components/IndustrialButton';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background w-full border-b border-outline-variant flex flex-col">
      
      {/* Section 01: Academic Dashboard */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant py-20">
        <div className="industrial-container w-full flex flex-col gap-8 max-w-4xl mx-auto text-center items-center">
          <h1 className="text-display-hero">
            ACADEMIC DASHBOARD
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            Your entire academic life in a single view. Manage courses, semesters, and deadlines with surgical precision.
          </p>
          <IndustrialButton href="/features/academic-dashboard" className="h-14 px-12 mt-6">
            EXPLORE MORE
          </IndustrialButton>
        </div>
      </section>

      {/* Section 02: Knowledge Base */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant py-20">
        <div className="industrial-container w-full flex flex-col gap-8 max-w-4xl mx-auto text-center items-center">
          <h1 className="text-display-hero">
            KNOWLEDGE BASE
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            Local-first knowledge architecture. Secured with maximum compression and graph topology connections directly inside your vault.
          </p>
          <IndustrialButton href="/features/knowledge-base" className="h-14 px-12 mt-6">
            EXPLORE MORE
          </IndustrialButton>
        </div>
      </section>

      {/* Section 03: Agents */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full py-20">
        <div className="industrial-container w-full flex flex-col gap-8 max-w-4xl mx-auto text-center items-center">
          <h1 className="text-display-hero">
            AGENTS
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            Context-aware artificial intelligence. Agents designed to reason across the entire knowledge architecture.
          </p>
          <IndustrialButton href="/features/agents" className="h-14 px-12 mt-6">
            EXPLORE MORE
          </IndustrialButton>
        </div>
      </section>
      
    </div>
  );
}
