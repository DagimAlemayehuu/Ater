"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IndustrialButton } from '@/components/IndustrialButton';


export default function WaitlistLandingPage() {
  return (
    <section className="z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full pt-16 overflow-hidden border-b border-outline-variant">
      <main className="flex-1 w-full flex items-center relative z-20">
        <div className="industrial-container grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 items-center w-full py-6 sm:py-12 md:py-8 sm:py-12 md:py-20">
          {/* Left Content */}
          <div className="flex flex-col justify-center py-6 z-30 lg:pr-12">
            <div className="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
              <h1 className="text-display-hero !leading-[0.9]">
                Learn faster.<br />
                Score better.
              </h1>
              <p className="text-body max-w-[360px] opacity-60">
                Ater turns your PDFs into simple notes. It organizes your work in one clean place. Study less, get better grades.
              </p>
            </div>
            
            <div className="mt-10 md:mt-12 flex justify-center lg:justify-start">
              <Link href="/auth">
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
      {/* MacBook Air M2 Lid strictly proportional */}
      <div 
        className="w-full h-full bg-[#1A1A1A] border-x border-t border-white/10 relative flex flex-col shadow-[0_80px_160px_-30px_rgba(0,0,0,0.4),0_40px_80px_-20px_rgba(0,0,0,0.3)]"
        style={{ borderTopLeftRadius: '3%', borderTopRightRadius: '3%', padding: '0.4%' }}
      >
        <div 
          className="flex-1 bg-[#000] overflow-hidden relative flex flex-col"
          style={{ borderTopLeftRadius: '2.6%', borderTopRightRadius: '2.6%', padding: '1.2%' }}
        >
          {/* M2 Notch */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[4%] bg-[#000] z-30 flex items-center justify-center"
            style={{ borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' }}
          >
            <div className="w-[4%] aspect-square rounded-full bg-[#111] border border-white/10 flex items-center justify-center mt-0.5">
              <div className="w-[40%] aspect-square rounded-full bg-blue-500/40" />
            </div>
          </div>
          
          <div 
            className="flex-1 bg-[#131313] overflow-hidden relative shadow-inner"
            style={{ borderTopLeftRadius: '1.5%', borderTopRightRadius: '1.5%' }}
          >
            <Image 
              src="/dashboard.png" 
              alt="Ater Dashboard" 
              fill 
              className="object-cover object-top" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority 
            />
            {/* Subtle Screen Glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
