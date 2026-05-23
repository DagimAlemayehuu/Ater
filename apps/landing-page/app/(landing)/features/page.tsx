"use client";

import React from 'react';
import { IndustrialButton } from '@/components/IndustrialButton';

export default function FeaturesPage() {
  return (
    <div className="min-h-[100dvh] bg-background w-full border-b border-outline-variant flex flex-col">
      
      {/* Section 01: Academic Dashboard */}
      <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full flex flex-col gap-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-center items-center justify-center flex-1">
          <h1 className="text-display-hero">
            ACADEMIC DASHBOARD
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            Your school control center. One simple dashboard to see all your classes, homework, and exams. It helps you stay organized so you never forget a deadline.
          </p>
          <IndustrialButton href="/features/academic-dashboard" className="h-12 md:h-14 px-10 md:px-12 mt-6">
            EXPLORE THE DASHBOARD
          </IndustrialButton>
        </div>
      </section>

      {/* Section 02: Knowledge Base */}
      <section className="z-20 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 md:py-16">
        <div className="industrial-container w-full flex flex-col gap-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-center items-center justify-center flex-1">
          <h1 className="text-display-hero">
            KNOWLEDGE BASE
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            A safe place to keep all your study notes. Read textbooks and write notes side-by-side, view visual maps of your topics, and keep your files private on your own computer.
          </p>
          <IndustrialButton href="/features/knowledge-base" className="h-12 md:h-14 px-10 md:px-12 mt-6">
            EXPLORE THE VAULT
          </IndustrialButton>
        </div>
      </section>

      {/* Section 03: Agents */}
      <section className="z-30 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 md:py-16">
        <div className="industrial-container w-full flex flex-col gap-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-center items-center justify-center flex-1">
          <h1 className="text-display-hero">
            REASONING AGENTS
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85">
            Helpful study assistants. Friendly computer helpers that scan your books, plan your study roadmaps, and build custom practice quizzes automatically.
          </p>
          <IndustrialButton href="/features/agents" className="h-12 md:h-14 px-10 md:px-12 mt-6">
            EXPLORE THE ASSISTANTS
          </IndustrialButton>
        </div>
      </section>
      
    </div>
  );
}
