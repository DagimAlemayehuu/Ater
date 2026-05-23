"use client";

import React from 'react';
import { MacbookMockup } from '@/components/MacbookMockup';

export default function AgentsPage() {
  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col">
      
      {/* SECTION 01: HERO / SYSTEM COMMAND */}
      <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-6 text-center items-center justify-center flex-1">
          <h1 className="text-display-hero text-center w-full uppercase">
            REASONING AGENTS
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85 text-center">
            Helpful study assistants. Ater uses small, private computer helpers (agents) that automatically scan your books, plan your study roadmaps, and build custom practice quizzes for you.
          </p>
          
          {/* Integrated Mockup */}
          <div className="w-full max-w-4xl relative origin-center flex items-center justify-center mt-2">
            <MacbookMockup 
              lightSrc="/dashboard-light.png" 
              darkSrc="/dashboard-dark.png" 
              alt="Reasoning Agents Dashboard" 
              priority 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
            {[
              { label: "Automatic roadmaps", desc: "Helper agents sort topics from simple to advanced." },
              { label: "100% Private", desc: "All assistants run locally on your own machine." },
              { label: "Smart Governor", desc: "Monitors and balances system loads to keep things fast." }
            ].map(item => (
              <div key={item.label} className="p-4 border border-outline-variant bg-surface flex flex-col gap-1 text-left">
                <span className="text-[10px] opacity-50 uppercase">{item.label}</span>
                <span className="text-sm font-bold tracking-tight text-primary uppercase">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* SECTION 02: DYNAMIC TWO-STATE UI LIFECYCLE */}
      <section className="z-20 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">SMART WORKSPACE</h2>
            <p className="text-body opacity-85">
              A smart screen that changes as you study. It shows you your inbox when you upload new textbooks, and automatically updates to a live progress tracking screen when the assistants are building your notes.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li><strong>Inbox Mode</strong>: Ater scans your textbooks and groups notes by subject.</li>
              <li> <strong>Generation Mode</strong>: Watch notes get written and sorted live in real-time.</li>
              <li> Live gauges show system speed and active processing windows.</li>
            </ul>
          </div>
          
          {/* UI Lifecycle Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Planning Engine</span>
              <span className="text-[10px] opacity-40">ACTIVE BATCH: 3</span>
            </div>
            
            <div className="space-y-3 text-[10px]">
              <div className="p-3 border border-outline-variant/30 bg-background/40 flex justify-between items-center opacity-40 line-through">
                <span>[X] Part 1: B-Trees Fundamentals</span>
                <span>DONE</span>
              </div>
              <div className="p-3 border border-primary bg-background flex justify-between items-center font-bold">
                <span className="text-primary">&gt; Part 2: Range Queries & Complexity</span>
                <span className="text-emerald-500 animate-pulse">GENERATING NOW</span>
              </div>
              
              <div className="space-y-1 mt-4">
                <div className="flex justify-between text-[9px]">
                  <span>API PRESSURE INDICATOR</span>
                  <span className="text-primary">SAFE ZONE</span>
                </div>
                <div className="h-1.5 bg-outline-variant/30 relative">
                  <div className="absolute left-0 top-0 h-full w-[45%] bg-primary"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: 7-STAGE PIPELINE & SELF-HEALING */}
      <section className="z-30 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          
          {/* Pipeline Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Self Healing Assistant</span>
              <span className="text-[10px] opacity-40">REPAIR LOOP</span>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 border border-red-500/20 bg-red-500/5 flex flex-col gap-1 text-[10px]">
                <span className="text-red-500 font-bold">VERIFIER EXCEPTION ALERT:</span>
                <span className="opacity-75">Broken wikilinks detected in H1 prose block.</span>
              </div>
              
              <div className="p-3 border border-outline-variant/30 bg-background/50 flex flex-col gap-1 text-[10px]">
                <span className="text-primary font-bold">&gt; CRITIC AGENT: RE-WRITE INSTRUCTION ISSUED</span>
                <span className="text-emerald-500">&gt; SELF-HEALING ENGINE RUNNING... HEALED SUCCESS</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">AUTO-FIXING NOTES</h2>
            <p className="text-body opacity-85">
              If the helpers make a formatting mistake or a link gets broken, a checker assistant catches it and fixes it instantly so your notes are always clean, complete, and formatted perfectly.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Background watchers automatically monitor folder queues for new documents.</li>
              <li> Diagnostic critics and regex engines repair broken brackets or tags.</li>
              <li> Updates the parent Study Hub connections list dynamically on completion.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 04: THE 11 SOVEREIGN STUDY AGENTS */}
      <section className="z-[40] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-6 text-center items-center justify-center flex-1">
          <h2 className="text-section-heading w-full uppercase">THE 11 SPECIALIZED HELPERS</h2>
          <p className="text-body max-w-2xl leading-relaxed opacity-85 text-center">
            A cooperative network of eleven specialized helpers, each in charge of a single step in writing, double-checking, and organizing your notes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-6 text-left text-[10px]">
            {[
              { name: "MetaScanner", role: "Reads the book and highlights major topics." },
              { name: "Architect", role: "Splits textbook chunks and maps out the study roadmap." },
              { name: "EpistemicClassifier", role: "Figures out if a topic is math, science, or reading." },
              { name: "TheoryAgent", role: "Creates clear, simple analogies and core explanations." },
              { name: "Practitioner", role: "Adds clean code blocks, math curves, and visual charts." },
              { name: "QuestionAgent", role: "Writes active recall practice tests linked to actual book pages." },
              { name: "VerifierAgent", role: "Double-checks syntax, brackets, and note structures." },
              { name: "CriticAgent", role: "Instructs helpers to rewrite a section if a verifier check fails." },
              { name: "QuizAuditor", role: "Validates practice quizzes before they reach your feed." },
              { name: "HubAgent", role: "Compiles single outline notes for entire study units." },
              { name: "TaxonomyExtender", role: "Creates new subjects and study paths dynamically." }
            ].map(agent => (
              <div key={agent.name} className="p-3.5 border border-outline-variant bg-surface flex flex-col gap-1">
                <span className="text-primary font-bold">{agent.name}</span>
                <span className="opacity-70 leading-normal">{agent.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 05: THE 85+ DOMAIN PERSONA MATRIX */}
      <section className="z-[50] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">EXPERT SUBJECT TEACHERS</h2>
            <p className="text-body opacity-85">
              Subject matters are explained using their true professional rules. Ater adapts its writing styles, dynamic headers, artifacts, and test logic across over 85 domains.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> <strong>CS-SOFTWARE</strong>: Programmer. Includes clean, runnable code.</li>
              <li> <strong>MED-PHYSIO</strong>: Doctor. Clear cell maps and body system loops.</li>
              <li> <strong>MATH-PURE</strong>: Mathematician. Neat LaTeX formulas and proofs.</li>
              <li> <strong>LAW-CASE</strong>: Lawyer. Strict IRAC argument flows and legal scenarios.</li>
              <li> <strong>ECON-MICRO</strong>: Economist. Math supply/demand tables and grids.</li>
            </ul>
          </div>
          
          {/* Domain Persona Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">ECON-MICRO // QUANTITATIVE</span>
              <span className="text-[10px] opacity-40">AXIOMS ACTIVE</span>
            </div>
            <div className="space-y-3">
              <div className="border border-outline-variant/30 p-3 bg-background/50 flex flex-col gap-2">
                <span className="text-[8px] opacity-40 uppercase">Axiom Enforcement checks</span>
                <div className="space-y-1 text-[9px] text-emerald-500 font-bold">
                  <div>[X] Marginal Cost Shift (Fixed cost shift blocked)</div>
                  <div>[X] Shift vs Movement (Horizontal shift equation loaded)</div>
                  <div>[X] Elasticity check (Demand shift constraint verification)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: FEYNMAN HAMBURGER NOTE GEOMETRY */}
      <section className="z-[60] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          {/* Note Geometry Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">Feynman Note Structure</span>
            </div>
            
            <div className="border border-outline-variant/30 bg-background/50 p-4 space-y-3 text-[10px]">
              <div>
                <span className="text-primary font-bold">1. FILE INFO</span>
                <p className="opacity-60 text-[9px]">Course links, study status, and book page numbers.</p>
              </div>
              <div className="border-t border-outline-variant/10 pt-2">
                <span className="text-primary font-bold">2. CLEAR ANALOGY</span>
                <p className="opacity-60 text-[9px]">Vivid analogy comparing the concept to daily objects without clichés.</p>
              </div>
              <div className="border-t border-outline-variant/10 pt-2">
                <span className="text-primary font-bold">3. TECHNICAL CANVASES</span>
                <p className="opacity-60 text-[9px]">Prose logic with 3-5 links, followed by visual graphs or code blocks.</p>
              </div>
              <div className="border-t border-outline-variant/10 pt-2">
                <span className="text-primary font-bold">4. THE PROVING GROUNDS</span>
                <p className="opacity-60 text-[9px]">Three practice quiz questions mapped directly to actual book pages.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">PERFECT NOTES EVERY TIME</h2>
            <p className="text-body opacity-85">
              Every study note is organized exactly the same way. It maps out the concept using a friendly analogy, gives a detailed explanation with charts, and finishes with a quick 3-question quiz.
            </p>
            <ul className="space-y-3 text-[11px] leading-relaxed opacity-75">
              <li> Frontmatter quotes all internal link dependencies.</li>
              <li> Core technical H1 prose embeds exactly 3–5 concept links.</li>
              <li> Proving Grounds quiz questions maps solutions to textbook page counts.</li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}
