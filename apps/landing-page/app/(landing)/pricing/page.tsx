"use client";

import React from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Activity, Zap, Shield, Cpu, Lock } from 'lucide-react';
import { IndustrialButton } from '@/components/IndustrialButton';


export default function PricingPage() {
  return (
    <>
      {/* Header Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-b border-outline-variant pt-16">
        <div className="industrial-container w-full flex flex-col items-start gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary active-status-pulse"></div>
            <span className="technical-label text-primary uppercase tracking-widest">PRICING TIERS</span>
          </div>
          <h1 className="text-display-hero">
            FAIR PRICE.<br />FOREVER.
          </h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest leading-relaxed max-w-2xl text-left">
            SIMPLE PRICING FOR A POWERFUL TOOL. NO SUBSCRIPTIONS, NO HIDDEN FEES.
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-outline-variant">
            {/* Basic Tier */}
            <div className="bg-background p-12 flex flex-col gap-12 border-r border-outline-variant last:border-r-0 hover:bg-surface transition-colors">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Zap className="size-6 text-on-background opacity-40" />
                  <h2 className="text-section-heading">BASIC_TIER</h2>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-hero !text-7xl">$0</span>
                  <span className="technical-label opacity-40">/FOREVER</span>
                </div>
              </div>
              
              <ul className="space-y-6">
                {[
                  'LOCAL PROCESSING',
                  'UP TO 5 DOCUMENTS',
                  'SMART SEARCH',
                  'SECURE VAULT'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-4 group">
                    <div className="size-1 bg-primary group-hover:scale-150 transition-transform"></div>
                    <span className="technical-label text-[12px] uppercase tracking-widest">{feature}</span>
                  </li>
                ))}
              </ul>

              <IndustrialButton 
                className="h-16 w-full mt-auto cursor-not-allowed opacity-50"
                icon={false}
              >
                CURRENTLY_OPEN_FOR_WAITLIST
              </IndustrialButton>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface p-12 flex flex-col gap-12 border-r border-outline-variant last:border-r-0 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 border-l border-b border-outline-variant bg-primary text-background font-mono text-[10px] font-black tracking-widest">
                MOST_POPULAR
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Cpu className="size-6 text-primary" />
                  <h2 className="text-section-heading text-primary">PRO_ENGINE</h2>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-hero !text-7xl">$19</span>
                  <span className="technical-label opacity-40">/ONE-TIME</span>
                </div>
              </div>
              
              <ul className="space-y-6">
                {[
                  'UNLIMITED DOCUMENTS',
                  'PRIORITY AI ENGINE',
                  'EXAM SIMULATOR',
                  'ADVANCED PLANNING',
                  'CUSTOM ANALYTICS'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-4 group">
                    <div className="size-1 bg-primary group-hover:scale-150 transition-transform"></div>
                    <span className="technical-label text-[12px] uppercase tracking-widest">{feature}</span>
                  </li>
                ))}
              </ul>

              <IndustrialButton 
                href="/waitlist" 
                className="h-16 w-full mt-auto"
              >
                GET_PRO_ACCESS
              </IndustrialButton>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="flex flex-col gap-16 w-full">
            <h2 className="text-display-hero">FAQ</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {[
                { q: 'IS IT REALLY PRIVATE?', a: 'YES. EVERYTHING HAPPENS ON YOUR DEVICE. WE NEVER SEE YOUR DATA.' },
                { q: 'DO I NEED THE INTERNET?', a: 'ONLY FOR UPDATES. THE AI ENGINE RUNS FULLY OFFLINE ON YOUR COMPUTER.' },
                { q: 'WHAT FILES ARE SUPPORTED?', a: 'PDF, TXT, AND DOCX. WE ARE ADDING MORE FORMATS SOON.' },
                { q: 'CAN I USE IT ON MOBILE?', a: 'CURRENTLY, ATER IS OPTIMIZED FOR DESKTOP (MACOS, WINDOWS, LINUX).' }
              ].map((item) => (
                <div key={item.q} className="flex flex-col gap-6 p-10 border border-outline-variant bg-surface hover:border-primary transition-colors duration-300">
                  <h3 className="technical-label text-primary uppercase tracking-widest text-lg font-black">{item.q}</h3>
                  <p className="text-body font-bold text-on-surface-variant leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="sticky top-0 z-40 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container flex flex-col items-center gap-12">
          <Activity className="size-12 text-primary" />
          <h2 className="text-display-hero text-center">JOIN THE ENGINE.</h2>
          <IndustrialButton 
            href="/waitlist" 
            className="h-20 px-16"
          >
            RESERVE_YOUR_SLOT
          </IndustrialButton>
        </div>
      </section>
    </>
  );
}
