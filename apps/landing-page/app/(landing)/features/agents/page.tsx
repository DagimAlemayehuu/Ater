"use client";

import React from 'react';

export default function AgentsPage() {
  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col">
      
      {/* SECTION 01: HERO / SYSTEM COMMAND */}
      <section className="z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 sm:py-12 md:py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-6 text-center items-center justify-center">
          <h1 className="text-display-hero text-center w-full uppercase">
            REASONING AGENTS
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85 text-center">
            A cooperative network of local study assistants. Build dependency maps from your books, classify notes by learning styles, and test yourself with custom quizzes.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
            {[
              { label: "Topological Sort", desc: "Kahn's Algorithm sorts study topics from basic to advanced." },
              { label: "Local Execution", desc: "All processes run locally on your device with 100% data safety." },
              { label: "Rate-Limit Governor", desc: "Monitors and balances system loads during generation." }
            ].map(item => (
              <div key={item.label} className="p-4 border border-outline-variant bg-surface flex flex-col gap-1 text-left">
                <span className="text-[10px] opacity-50 font-mono uppercase">{item.label}</span>
                <span className="text-sm font-bold tracking-tight text-primary uppercase">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 02: DYNAMIC TWO-STATE UI LIFECYCLE */}
      <section className="z-20 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 sm:py-12 md:py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center justify-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">LIFECYCLE</h2>
            <p className="text-body opacity-85">
              The workspace dashboard automatically adapts its layout depending on whether you are preparing documents or active generation is running in the background.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; <strong>State A (Pre-Planning)</strong>: Inbox discovery reads new PDFs, matching topics with Course, Unit, and Hub pills automatically.</li>
              <li>&gt; <strong>State B (Active Generation)</strong>: Plan trees highlight current note generation, pushing finished notes up and tracking API rate limits.</li>
              <li>&gt; Telemetry gauges show active sliding windows and throttle alerts in real time.</li>
            </ul>
          </div>
          
          {/* UI Lifecycle Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">SOVEREIGN_PLAN_ENGINE</span>
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
      <section className="z-30 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 sm:py-12 md:py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center justify-center">
          
          {/* Pipeline Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">SELF_HEALING_DAEMON</span>
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
            <h2 className="text-section-heading">PIPELINE</h2>
            <p className="text-body opacity-85">
              Turn raw books into linked note networks. Files enter a SQLite database queue, split into concept blocks, pass through verifiers, and heal formatting errors automatically.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Background watchers automatically monitor folder queues for new documents.</li>
              <li>&gt; Diagnostic critics and regex engines repair broken brackets or tags.</li>
              <li>&gt; Updates the parent Study Hub connections list dynamically on completion.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 04: THE 11 SOVEREIGN STUDY AGENTS */}
      <section className="z-[40] bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 sm:py-12 md:py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-6 text-center items-center justify-center">
          <h2 className="text-section-heading w-full uppercase">THE 11 STUDY AGENTS</h2>
          <p className="text-body max-w-2xl leading-relaxed opacity-85 text-center">
            A cooperative network of eleven specialized local agents, each responsible for an isolated step in the note processing and validation pipeline.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-6 text-left font-mono text-[10px]">
            {[
              { name: "MetaScanner", role: "Extracts summary keywords and snapping data." },
              { name: "Architect", role: "Segments textbook chunks and sorts dependencies." },
              { name: "EpistemicClassifier", role: "Maps note topics to quantitative or qualitative styles." },
              { name: "TheoryAgent", role: "Drafts analogies and core conceptual foundations." },
              { name: "Practitioner", role: "Creates code blocks, math curves, and visual diagrams." },
              { name: "QuestionAgent", role: "Writes active recall tests locked to textbook page numbers." },
              { name: "VerifierAgent", role: "Checks syntax, brackets, and structural alignments." },
              { name: "CriticAgent", role: "Writes targeted instructions if structural checks fail." },
              { name: "QuizAuditor", role: "Validates practice quizzes before they reach your feed." },
              { name: "HubAgent", role: "Compiles single outline notes for entire study units." },
              { name: "TaxonomyExtender", role: "Cartographer Prime. Dynamically constructs new study domains." }
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
      <section className="z-[50] bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 sm:py-12 md:py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center justify-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">PERSONAS</h2>
            <p className="text-body opacity-85">
              Subject matters are explained using their true professional rules. Ater adapts its writing styles, dynamic headers, artifacts, and test logic across over 85 domains.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; <strong>CS-SOFTWARE</strong>: Software Engineer. Includes runnable code and debugging tests.</li>
              <li>&gt; <strong>MED-PHYSIO</strong>: Surgeon. Cellular maps and pathway perturbation tracing.</li>
              <li>&gt; <strong>MATH-PURE</strong>: Mathematician. LaTeX proofs, checks division by zero.</li>
              <li>&gt; <strong>LAW-CASE</strong>: Lawyer. Strict IRAC method applying fact scenarios.</li>
              <li>&gt; <strong>ECON-MICRO</strong>: Microeconomist. Math supply/demand schedule tables.</li>
            </ul>
          </div>
          
          {/* Domain Persona Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
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
      <section className="z-[60] bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 sm:py-12 md:py-20 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center justify-center">
          {/* Note Geometry Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">FEYNMAN_HAMBURGER_CONTRACT</span>
            </div>
            
            <div className="border border-outline-variant/30 bg-background/50 p-4 space-y-3 text-[10px]">
              <div>
                <span className="text-primary font-bold">1. YAML FRONTMATTER</span>
                <p className="opacity-60 text-[9px]">Quoted wikilinks, target courses, and page boundaries.</p>
              </div>
              <div className="border-t border-outline-variant/10 pt-2">
                <span className="text-primary font-bold">2. MENTAL MODEL ANALOGY</span>
                <p className="opacity-60 text-[9px]">Vivid analogy mapping structural components without clichés.</p>
              </div>
              <div className="border-t border-outline-variant/10 pt-2">
                <span className="text-primary font-bold">3. CORE TECHNICAL PROSE (H1 & H2)</span>
                <p className="opacity-60 text-[9px]">Prose logic with 3-5 links, followed by dynamic visual artifacts.</p>
              </div>
              <div className="border-t border-outline-variant/10 pt-2">
                <span className="text-primary font-bold">4. THE PROVING GROUNDS</span>
                <p className="opacity-60 text-[9px]">Three-tiered JSON quizzes mapped directly to book pages.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">NOTE STRUCTURE</h2>
            <p className="text-body opacity-85">
              Every note adheres to a strict 4-section layout contract, balancing high conceptual density with verifiable question formats.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Frontmatter quotes all internal link dependencies.</li>
              <li>&gt; Core technical H1 prose embeds exactly 3–5 concept links.</li>
              <li>&gt; Proving Grounds quiz questions maps solutions to textbook page counts.</li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}
