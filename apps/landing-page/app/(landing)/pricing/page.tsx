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
        <div className="industrial-container w-full flex flex-col items-start gap-8 py-20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary"></div>
            <span className="technical-label text-primary">PRICING</span>
          </div>
          <h1 className="text-display-hero">
            FAIR PRICE.<br />FOREVER.
          </h1>
          <p className="text-body max-w-2xl text-left">
            SIMPLE PRICING FOR A POWERFUL TOOL. NO SUBSCRIPTIONS, NO HIDDEN FEES.
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-outline-variant">
            {/* Basic Tier */}
            <div className="bg-background p-12 flex flex-col gap-12 border-r border-outline-variant last:border-r-0 hover:bg-surface transition-colors">
              <div className="space-y-6">
                <h2 className="text-section-heading !text-[1.5rem]">BASIC</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-hero !text-6xl">$0</span>
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
                    <span className="technical-label text-[12px]">{feature}</span>
                  </li>
                ))}
              </ul>

              <IndustrialButton 
                className="h-16 w-full mt-auto cursor-not-allowed opacity-50"
              >
                WAITLIST_ONLY
              </IndustrialButton>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface p-12 flex flex-col gap-12 border-r border-outline-variant last:border-r-0 relative overflow-hidden group">
              <div className="space-y-6">
                <h2 className="text-section-heading !text-[1.5rem] text-primary">PRO</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-hero !text-7xl">$19</span>
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
                    <span className="technical-label text-[12px]">{feature}</span>
                  </li>
                ))}
              </ul>

              <IndustrialButton 
                href="/auth" 
                className="h-16 w-full mt-auto"
              >
                SIGN IN
              </IndustrialButton>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <div className="flex flex-col gap-16 w-full">
            <h2 className="text-display-hero">FAQ</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {[
                { q: 'PRIVACY', a: 'EVERYTHING HAPPENS ON YOUR DEVICE. WE NEVER SEE YOUR DATA.' },
                { q: 'OFFLINE', a: 'THE AI ENGINE RUNS FULLY OFFLINE ON YOUR COMPUTER.' },
                { q: 'FILES', a: 'PDF, TXT, AND DOCX SUPPORTED. MORE FORMATS COMING SOON.' },
                { q: 'PLATFORM', a: 'OPTIMIZED FOR MACOS, WINDOWS, AND LINUX.' }
              ].map((item) => (
                <div key={item.q} className="flex flex-col gap-6 p-10 border border-outline-variant bg-surface">
                  <h3 className="technical-label text-primary text-lg font-black">{item.q}</h3>
                  <p className="text-body leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
