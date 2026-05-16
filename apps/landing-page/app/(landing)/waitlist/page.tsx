"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function WaitlistLandingPage() {
  return (
    <div className="flex flex-col text-on-background min-h-screen relative selection:bg-primary selection:text-background">
      <main className="flex-1 w-full flex items-center relative z-20 overflow-hidden">

        <div className="max-w-[1400px] w-full mx-auto px-8 md:px-12 lg:px-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full py-20 relative">
          
          {/* Left Content */}
          <div className="flex flex-col justify-center py-12 z-30 lg:pr-12 h-full">
            <div className="space-y-4">
              <h1 className="text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.1] font-black tracking-tighter text-on-background uppercase">
                <span className="whitespace-nowrap">Learn faster.</span><br />
                <span className="whitespace-nowrap">Score better.</span>
              </h1>
              <p className="text-on-surface-variant text-[13px] lg:text-[14px] max-w-[400px] leading-relaxed font-bold uppercase tracking-tight">
                Ater turns your PDFs into simple notes. It organizes your work in one clean place. Study less, get better grades.
              </p>
            </div>
            
            <div className="mt-24">
              <Link 
                href="/auth"
                className="industrial-btn h-14 px-10 group inline-flex items-center justify-center w-full md:w-auto hover:bg-surface-container transition-all text-[11px]"
              >
                <span>Join Waitlist</span>
              </Link>
            </div>
          </div>
          
          {/* Right Mockup Area */}
          <div className="relative h-full w-full min-h-[500px] lg:min-h-[700px] flex items-center">
             <MockupSection />
          </div>
        </div>
      </main>
    </div>
  );
}

function MockupSection() {
  return (
    <div className="absolute left-0 w-[140%] lg:w-[160%] aspect-[2560/1664] pointer-events-none z-10 origin-left scale-110 lg:scale-[1.25] translate-y-[25%] lg:translate-y-[35%]">
      {/* MacBook Air M2 Chassis (Uniform Thickness, Thin Profile) */}
      <div className="w-full h-full bg-[#1A1A1A] rounded-[2.5rem] p-[1px] shadow-[0_80px_160px_-30px_rgba(0,0,0,0.4),0_40px_80px_-20px_rgba(0,0,0,0.3)] relative flex flex-col border border-white/10 overflow-hidden">
        
        {/* Subtle Brushed Metal Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 pointer-events-none" />
        
        {/* Display Panel (Uniform 6mm-style bezels) */}
        <div className="flex-1 bg-[#000] rounded-[2.3rem] overflow-hidden p-[10px] relative flex flex-col m-[1px]">
          
          {/* M2 Notch (Proportional width, smooth transition) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180px] h-[34px] bg-[#000] z-30 flex items-center justify-center rounded-b-[0.8rem]">
            {/* Camera & Sensors Cluster (Miniaturized for M2) */}
            <div className="flex items-center gap-4 mt-0.5 opacity-60">
              <div className="size-1.5 rounded-full bg-[#111]" />
              <div className="size-2 rounded-full bg-[#111] border border-white/5 flex items-center justify-center">
                <div className="size-0.5 rounded-full bg-blue-500/30" />
              </div>
              <div className="size-1.5 rounded-full bg-[#111]" />
            </div>
          </div>
          
          {/* Liquid Retina Display (With rounded corners that match the bezel) */}
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
