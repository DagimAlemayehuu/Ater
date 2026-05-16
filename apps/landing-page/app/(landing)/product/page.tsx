"use client";

import React from 'react';
import Link from 'next/link';
import { Cpu, Database, Shield, Zap, Search, Layout, Terminal, Box, Activity, ChevronRight, Lock } from 'lucide-react';
import { IndustrialButton } from '@/components/IndustrialButton';


export default function ProductPage() {
  return (
    <>
      {/* Header Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-b border-outline-variant pt-16">
        <div className="industrial-container w-full flex flex-col items-start gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary active-status-pulse"></div>
            <span className="technical-label text-primary uppercase tracking-widest">PRODUCT OVERVIEW</span>
          </div>
          <h1 className="text-display-hero">
            BUILT FOR<br />STUDENTS.
          </h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest leading-relaxed max-w-2xl text-left">
            ATER IS A POWERFUL STUDY TOOL DESIGNED TO HELP YOU UNDERSTAND COMPLEX TOPICS AND REMEMBER THEM LONGER.
          </p>
        </div>
      </section>

      {/* Section 01: AI Engine */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Cpu className="size-8 text-primary" />
                  <h2 className="text-section-heading">01 // AI ENGINE</h2>
                </div>
                <p className="text-body font-bold text-on-surface-variant leading-relaxed">
                  Smart reasoning for complex topics. Ater analyzes your documents to find key insights and connections automatically.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-8 industrial-border bg-surface flex flex-col gap-4">
                  <span className="technical-label text-primary uppercase tracking-widest">[ANALYZE]</span>
                  <p className="text-body font-bold text-on-surface-variant text-[14px]">Find connections between different notes and textbooks.</p>
                </div>
                <div className="p-8 industrial-border bg-surface flex flex-col gap-4">
                  <span className="technical-label text-primary uppercase tracking-widest">[PREDICT]</span>
                  <p className="text-body font-bold text-on-surface-variant text-[14px]">Identify likely exam topics based on your study material.</p>
                </div>
              </div>
            </div>
            
            <div className="p-12 industrial-border bg-surface-container-low flex flex-col gap-8 w-full">
              <div className="flex justify-between items-center border-b border-outline-variant pb-4">
                <span className="technical-label opacity-40 uppercase tracking-widest">SYSTEM_LOAD</span>
                <Activity className="size-4 text-primary active-status-pulse" />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between technical-label opacity-40 uppercase tracking-widest">
                    <span>PROCESSING</span>
                    <span>ACTIVE</span>
                  </div>
                  <div className="h-1 w-full bg-outline-variant/20">
                    <div className="h-full w-[84%] bg-primary"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Secure Vault */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="order-2 lg:order-1 relative aspect-video industrial-border bg-background flex items-center justify-center overflow-hidden w-full">
              <Database className="absolute size-16 text-primary" />
            </div>
            
            <div className="order-1 lg:order-2 flex flex-col gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Shield className="size-8 text-primary" />
                  <h2 className="text-section-heading">02 // SECURE VAULT</h2>
                </div>
                <p className="text-body font-bold text-on-surface-variant leading-relaxed">
                  Your data stays on your computer. We don't store your notes in the cloud or use them to train AI. Your privacy is our priority.
                </p>
              </div>
              
              <ul className="space-y-6">
                {[
                  { label: 'PRIVATE STORAGE', icon: Lock },
                  { label: 'BANK-LEVEL ENCRYPTION', icon: Shield },
                  { label: 'LOCAL-ONLY PROCESSING', icon: Zap }
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-4 p-4 border border-outline-variant bg-surface">
                    <item.icon className="size-4 text-primary" />
                    <span className="technical-label uppercase tracking-widest">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Fast Search */}
      <section className="sticky top-0 z-[35] bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Box className="size-8 text-primary" />
                  <h2 className="text-section-heading">03 // FAST SEARCH</h2>
                </div>
                <p className="text-body font-bold text-on-surface-variant leading-relaxed">
                  Find any detail in seconds. Search across all your documents instantly, even with thousands of pages.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'SPEED', value: 'INSTANT' },
                  { label: 'ACCURACY', value: '100%' },
                  { label: 'CAPACITY', value: 'UNLIMITED' }
                ].map((stat) => (
                  <div key={stat.label} className="p-8 industrial-border bg-surface text-center space-y-2">
                    <span className="technical-label opacity-40 uppercase tracking-widest">{stat.label}</span>
                    <p className="text-2xl font-black text-primary">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative aspect-video industrial-border bg-background overflow-hidden flex items-center justify-center w-full">
              <Search className="size-16 text-primary opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="sticky top-0 z-40 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant text-center gap-12">
        <div className="industrial-container flex flex-col items-center gap-12">
          <Terminal className="size-12 text-primary" />
          <div className="space-y-6">
            <h2 className="text-display-hero !text-6xl">GET STARTED.</h2>
            <p className="text-body font-bold text-on-surface-variant max-w-2xl mx-auto uppercase tracking-widest text-center">
              JOIN THE WAITLIST TO GET EARLY ACCESS TO THE ATER ENGINE.
            </p>
          </div>
          <IndustrialButton 
            href="/waitlist" 
            className="h-20 px-16"
          >
            JOIN WAITLIST
          </IndustrialButton>
        </div>
      </section>
    </>
  );
}
