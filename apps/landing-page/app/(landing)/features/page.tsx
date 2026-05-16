"use client";

import React from 'react';
import { IndustrialButton } from '@/components/IndustrialButton';

export default function FeaturesPage() {
  return (
    <>
      {/* Header Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-b border-outline-variant pt-16">
        <div className="industrial-container w-full flex flex-col items-start gap-8 py-20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary"></div>
            <span className="technical-label text-primary">FEATURES</span>
          </div>
          <h1 className="text-display-hero">
            THE STUDY<br />COMMAND CENTER.
          </h1>
          <p className="text-body max-w-2xl text-left">
            ATER TRANSFORMS YOUR RAW DATA INTO STRUCTURED KNOWLEDGE. BUILT FOR STUDENTS WHO DEMAND PERFORMANCE AND PRIVACY.
          </p>
        </div>
      </section>

      {/* Section 01: Academic Dashboard */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-12">
              <div className="space-y-6">
                <h2 className="text-section-heading">ACADEMIC DASHBOARD</h2>
                <p className="text-body leading-relaxed">
                  YOUR ENTIRE ACADEMIC LIFE IN A SINGLE VIEW. MANAGE COURSES, SEMESTERS, AND DEADLINES WITH SURGICAL PRECISION.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'TIMELINE', desc: 'DYNAMIC ACADEMIC CALENDAR SYNCHRONIZED WITH YOUR VAULT.' },
                  { label: 'PLANNER', desc: 'STUDY SESSIONS AUTOMATICALLY LINKED TO COURSE CONTENT.' }
                ].map((item) => (
                  <div key={item.label} className="p-10 border border-outline-variant bg-surface flex flex-col gap-4">
                    <span className="technical-label text-primary">{item.label}</span>
                    <p className="text-body !text-[13px]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="aspect-video border border-outline-variant bg-surface flex flex-col p-12 gap-8 w-full relative overflow-hidden">
               <div className="flex justify-between items-center border-b border-outline-variant pb-6">
                 <span className="technical-label opacity-40">ACADEMIC_COMMAND_PULSE</span>
                 <div className="size-2 bg-primary"></div>
               </div>
               <div className="grid grid-cols-4 gap-4 flex-1">
                 {[1,2,3,4,5,6,7,8].map(i => (
                   <div key={i} className="border border-outline-variant/30 bg-background/50 h-full"></div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Obsidian Architecture */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="order-2 lg:order-1 relative aspect-video border border-outline-variant bg-background flex items-center justify-center overflow-hidden w-full">
               <div className="absolute inset-0 opacity-10">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 border border-primary rounded-full"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 border border-primary/50 rounded-full"></div>
               </div>
               <span className="technical-label text-4xl opacity-20">GRAPH_TOPOLOGY</span>
            </div>
            
            <div className="order-1 lg:order-2 flex flex-col gap-12">
              <div className="space-y-6">
                <h2 className="text-section-heading">OBSIDIAN ARCHITECTURE</h2>
                <p className="text-body leading-relaxed">
                  LOCAL-FIRST KNOWLEDGE MANAGEMENT. ATER USES YOUR OBSIDIAN VAULT AS A DATABASE, ENABLING BIDIRECTIONAL LINKING AND GRAPH TOPOLOGIES.
                </p>
              </div>
              
              <ul className="space-y-4">
                {[
                  'LOCAL-FIRST PRIVACY',
                  'BIDIRECTIONAL CONNECTIVITY',
                  'PDF ANNOTATION SYNC',
                  'GRAPH VISUALIZATION'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-6 p-6 border border-outline-variant bg-surface">
                    <div className="size-1.5 bg-primary"></div>
                    <span className="technical-label text-[12px]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Reasoning Agents */}
      <section className="sticky top-0 z-[35] bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-12">
              <div className="space-y-6">
                <h2 className="text-section-heading">REASONING AGENTS</h2>
                <p className="text-body leading-relaxed">
                  CONTEXT-AWARE INTELLIGENCE. AGENTS THAT ANALYZE YOUR ENTIRE VAULT TO ANSWER COMPLEX QUESTIONS AND IDENTIFY HIDDEN CONNECTIONS.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'SEARCH', value: 'SEMANTIC' },
                  { label: 'CONTEXT', value: 'FULL' },
                  { label: 'PRIVACY', value: 'AIR-GAPPED' }
                ].map((stat) => (
                  <div key={stat.label} className="p-10 border border-outline-variant bg-surface text-center space-y-4">
                    <span className="technical-label opacity-40 text-[10px]">{stat.label}</span>
                    <p className="text-xl font-black text-primary">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-video border border-outline-variant bg-surface overflow-hidden flex flex-col p-10 gap-6 w-full">
               <div className="h-2 w-full bg-outline-variant/20 overflow-hidden">
                 <div className="h-full w-2/3 bg-primary animate-pulse"></div>
               </div>
               <div className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-4 bg-background/50 border border-outline-variant/30 w-full"></div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Active Recall */}
      <section className="sticky top-0 z-[40] bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="order-2 lg:order-1 relative aspect-video border border-outline-variant bg-background flex items-center justify-center overflow-hidden w-full">
               <div className="grid grid-cols-6 gap-2 p-12 w-full h-full opacity-20">
                 {Array.from({length: 24}).map((_, i) => (
                   <div key={i} className="border border-primary aspect-square"></div>
                 ))}
               </div>
               <span className="absolute technical-label text-4xl opacity-20">RECALL_ENGINE</span>
            </div>
            
            <div className="order-1 lg:order-2 flex flex-col gap-12">
              <div className="space-y-6">
                <h2 className="text-section-heading">ACTIVE RECALL</h2>
                <p className="text-body leading-relaxed">
                  PERFORMANCE OPTIMIZATION. AUTOMATED PRACTICE SESSIONS AND EXAM SIMULATIONS GENERATED DIRECTLY FROM YOUR NOTES.
                </p>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'SRS', desc: 'SPACED REPETITION SYSTEM INTEGRATED WITH YOUR VAULT.' },
                  { label: 'EXAMS', desc: 'PREDICTIVE TESTING BASED ON DOCUMENT SEMANTICS.' }
                ].map((item) => (
                  <div key={item.label} className="p-8 border border-outline-variant bg-surface flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <span className="technical-label text-primary">{item.label}</span>
                      <p className="text-body !text-[12px] opacity-60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Final CTA */}
      <section className="sticky top-0 z-[50] bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full flex flex-col items-center gap-12 py-20">
          <h2 className="text-display-hero text-center">
            READY FOR<br />THE UPGRADE?
          </h2>
          <IndustrialButton 
            href="/auth" 
            className="h-16 px-16"
          >
            SIGN IN
          </IndustrialButton>
        </div>
      </section>
    </>
  );
}
