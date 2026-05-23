"use client";

import React from 'react';
import { IndustrialButton } from '@/components/IndustrialButton';

export default function PricingPage() {
  return (
    <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 px-4 md:px-8">
      <div className="industrial-container w-full max-w-3xl mx-auto flex flex-col gap-6 text-center items-center justify-center flex-1">
        <h1 className="text-display-hero uppercase">
          BETA PRICING
        </h1>
        <p className="text-body max-w-xl leading-relaxed opacity-85 text-center">
          Ater is currently in private beta, which means all features are fully unlocked and 100% free. No credit cards, no monthly fees, and no surprise charges.
        </p>

        <div className="border border-outline-variant bg-surface p-4 sm:p-6 md:p-8 w-full max-w-md text-[11px] text-left flex flex-col gap-6 shadow-xl relative overflow-hidden mx-auto">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
            <span className="text-primary font-bold">CURRENT_TIER</span>
          </div>
          
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-on-surface">BETA ACCESS</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">0</span>
              <span className="text-[9px] opacity-40 font-sans font-bold">FREE</span>
            </div>
          </div>
          
          <ul className="space-y-3 opacity-85 font-sans font-bold text-[10px] uppercase">
            <li className="flex items-center gap-2">
              <span className="size-1 bg-primary"></span>
              <span>100% Private local files</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 bg-primary"></span>
              <span>11 Specialized helper agents</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 bg-primary"></span>
              <span>Unlimited local school folders</span>
            </li>
          </ul>

          <IndustrialButton 
            href="/auth?mode=signup" 
            className="h-12 w-full mt-2"
          >
            JOIN WAITLIST
          </IndustrialButton>
        </div>
      </div>
    </section>
  );
}
