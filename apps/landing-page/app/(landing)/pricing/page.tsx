"use client";

import React from 'react';
import { IndustrialButton } from '@/components/IndustrialButton';

export default function PricingPage() {
  return (
    <section className="z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 sm:py-12 md:py-20 px-4 md:px-8">
      <div className="industrial-container w-full max-w-3xl mx-auto flex flex-col gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 text-center items-center justify-center">
        <h1 className="text-display-hero uppercase">
          BETA PRICING
        </h1>
        <p className="text-body max-w-xl leading-relaxed opacity-85">
          We are currently in active beta. All features are fully functional and free of charge. Pricing plans will be announced with our public launch.
        </p>

        <div className="border border-outline-variant bg-surface p-4 sm:p-6 md:p-8 w-full max-w-md font-mono text-[11px] text-left flex flex-col gap-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
            <span className="text-primary font-bold">CURRENT_TIER</span>
          </div>
          
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-on-surface">BETA ACCESS</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">0</span>
              <span className="text-[9px] opacity-40">ETB</span>
            </div>
          </div>
          
          <ul className="space-y-3 opacity-85">
            <li className="flex items-center gap-2">
              <span className="size-1 bg-primary"></span>
              <span>100% LOCAL PROCESSING</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 bg-primary"></span>
              <span>11 SOVEREIGN STUDY AGENTS</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 bg-primary"></span>
              <span>UNLIMITED LOCAL NOTE VAULTS</span>
            </li>
          </ul>

          <IndustrialButton 
            href="/waitlist" 
            className="h-12 w-full mt-2"
          >
            JOIN WAITLIST
          </IndustrialButton>
        </div>
      </div>
    </section>
  );
}
