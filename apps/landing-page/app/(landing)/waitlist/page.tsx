"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IndustrialButton } from '@/components/IndustrialButton';


export default function WaitlistLandingPage() {
  return (
    <section className="bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full pt-16 overflow-x-hidden">
      <main className="flex-1 w-full flex items-center relative z-20">
        <div className="industrial-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full py-12 md:py-20 relative">
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
          <div className="relative w-full min-h-[300px] sm:min-h-[400px] flex items-center lg:h-full overflow-visible">
             <MockupSection />
          </div>
        </div>
      </main>
    </section>
  );
}

function MockupSection() {
  return (
    <div className="absolute left-0 w-[140%] lg:w-[160%] aspect-[2560/1664] pointer-events-none z-10 origin-left scale-110 lg:scale-[1.25] translate-y-[15%] lg:translate-y-[35%]">
      {/* MacBook Air M2 Chassis */}
      <div className="w-full h-full bg-[#1A1A1A] rounded-[2.5rem] p-[1px] shadow-[0_80px_160px_-30px_rgba(0,0,0,0.4),0_40px_80px_-20px_rgba(0,0,0,0.3)] relative flex flex-col border border-white/10 overflow-hidden">
        
        {/* Subtle Brushed Metal Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 pointer-events-none" />
        
        {/* Display Panel */}
        <div className="flex-1 bg-[#000] rounded-[2.3rem] overflow-hidden p-[10px] relative flex flex-col m-[1px]">
          
          {/* M2 Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] h-[34px] bg-[#000] z-30 flex items-center justify-center rounded-b-[0.8rem]">
            {/* Camera & Sensors Cluster */}
            <div className="flex items-center gap-4 mt-0.5 opacity-60">
              <div className="size-1.5 rounded-full bg-[#111]" />
              <div className="size-2 rounded-full bg-[#111] border border-white/5 flex items-center justify-center">
                <div className="size-0.5 rounded-full bg-blue-500/30" />
              </div>
              <div className="size-1.5 rounded-full bg-[#111]" />
            </div>
          </div>
          
          {/* Liquid Retina Display */}
          <div className="flex-1 bg-[#FFFFFF] rounded-[1.4rem] overflow-hidden relative shadow-inner">
             <Image 
                src="/dashboard.png" 
                alt="Ater Dashboard" 
                fill 
                className="object-cover object-top" 
                priority 
             />
             
             {/* Screen Glare / Reflection */}
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-20" />
          </div>
        </div>

        {/* Bottom Lip Indentation */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-1.5 bg-black/40 rounded-t-full shadow-inner" />
      </div>
    </div>
  );
}
