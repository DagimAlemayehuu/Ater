"use client";

import React from 'react';
import { IndustrialButton } from '@/components/IndustrialButton';

export default function FeaturesPage() {
  return (
    <div className="min-h-[100dvh] bg-background w-full border-b border-outline-variant flex flex-col">
      
      {/* Section 01: Ater (Agents) */}
      <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full flex flex-col gap-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-center items-center justify-center flex-1">
          <h1 className="text-display-hero">
            ATER (AGENTS)
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            Your smart study partner. Chat with Ater Oracle, control your Pomodoro study timer with simple messages, and watch the system scan your textbooks in the background.
          </p>
          <IndustrialButton href="/features/agents" className="h-12 md:h-14 px-10 md:px-12 mt-6">
            EXPLORE ATER AGENTS
          </IndustrialButton>
        </div>
      </section>

      {/* Section 02: Academic Dashboard */}
      <section className="z-20 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full flex flex-col gap-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-center items-center justify-center flex-1">
          <h1 className="text-display-hero">
            ACADEMIC DASHBOARD
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            Your school control center. A single clean screen to see all your semesters, courses, units, and learning goals. It keeps you on track so you never miss a lesson.
          </p>
          <IndustrialButton href="/features/academic-dashboard" className="h-12 md:h-14 px-10 md:px-12 mt-6">
            EXPLORE THE DASHBOARD
          </IndustrialButton>
        </div>
      </section>

      {/* Section 03: Knowledge Base */}
      <section className="z-30 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 md:py-16">
        <div className="industrial-container w-full flex flex-col gap-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-center items-center justify-center flex-1">
          <h1 className="text-display-hero">
            KNOWLEDGE BASE
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            A safe place to read and study your notes. It is 100% compatible with Obsidian, using plain text files on your own computer. Read books and notes side-by-side and follow visual link maps.
          </p>
          <IndustrialButton href="/features/knowledge-base" className="h-12 md:h-14 px-10 md:px-12 mt-6">
            EXPLORE KNOWLEDGE BASE
          </IndustrialButton>
        </div>
      </section>
      
    </div>
  );
}
