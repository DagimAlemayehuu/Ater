"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IndustrialButton } from '@/components/IndustrialButton';

import { MacbookLidMockup } from '@/components/MacbookMockup';

export default function WaitlistLandingPage() {
  return (
    <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full pt-16 overflow-hidden border-b border-outline-variant">
      <main className="flex-1 w-full flex items-center relative z-20">
        <div className="industrial-container grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center w-full py-8 md:py-20 flex-1">
          {/* Left Content */}
          <div className="flex flex-col justify-center py-6 z-30 lg:pr-12">
            <div className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
              <h1 className="text-display-hero !leading-[0.9]">
                Learn faster.<br />
                Score better.
              </h1>
              <p className="text-body max-w-[360px] opacity-60">
                Ater turns your textbook PDFs and slides into simple, organized notes. Study less and get better grades in one clean place.
              </p>
            </div>
            
            <div className="mt-10 md:mt-12 flex justify-center lg:justify-start">
              <Link href="/auth?mode=signup">
                <IndustrialButton className="h-14 md:h-16 px-10 md:px-12 w-full md:w-auto">
                  JOIN WAITLIST
                </IndustrialButton>
              </Link>
            </div>
          </div>
          
          {/* Right Mockup Area */}
          <div className="w-full min-h-[300px] sm:min-h-[400px] flex items-center lg:h-full overflow-visible">
             <MockupSection />
          </div>
        </div>
      </main>
    </section>
  );
}

function MockupSection() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-[15%] w-[125%] sm:w-[115%] lg:w-[53%] xl:w-[57%] aspect-[2560/1664] pointer-events-none z-10 bottom-0 translate-y-[5%] lg:translate-y-[22%]">
      <MacbookLidMockup 
        lightSrc="/dashboard-light.png" 
        darkSrc="/dashboard-dark.png" 
        alt="Ater Dashboard"
        priority
      />
    </div>
  );
}

