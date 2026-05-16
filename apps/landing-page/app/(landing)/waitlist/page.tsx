"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, 
  Clipboard, 
  ClipboardCheck, 
  Download, 
  Sun, 
  Moon,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { DownloadAterButton } from '@/components/DownloadAterButton';
import { IndustrialButton } from '@/components/IndustrialButton';


export default function WaitlistLandingPage() {
  return (
    <section className="bg-background grid-background flex flex-col items-center justify-center h-screen w-full overflow-hidden pt-16">
      <main className="flex-1 w-full flex items-center relative z-20 overflow-hidden">
        <div className="industrial-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full py-12 relative">
          {/* Left Content */}
          <div className="flex flex-col justify-center py-6 z-30 lg:pr-12 h-full">
            <div className="space-y-4">
              <h1 className="text-display-hero !text-[4rem] tracking-tighter">
                <span className="whitespace-nowrap">Learn faster.</span><br />
                <span className="whitespace-nowrap">Score better.</span>
              </h1>
              <p className="text-body max-w-[360px] opacity-60 !text-[12px]">
                Ater turns your PDFs into simple notes. It organizes your work in one clean place. Study less, get better grades.
              </p>
            </div>
            
            <div className="mt-12">
              <Link href="/auth">
                <IndustrialButton className="h-14 px-10">
                  SIGN IN
                </IndustrialButton>
              </Link>
            </div>
          </div>
          
          {/* Right Mockup Area */}
          <div className="relative h-full w-full min-h-[400px] flex items-center">
             <MockupSection />
          </div>
        </div>
      </main>
    </section>
  );
}

function MockupSection() {
  return (
    <div className="absolute left-0 w-[140%] lg:w-[160%] aspect-[2560/1664] pointer-events-none z-10 origin-left scale-110 lg:scale-[1.25] translate-y-[25%] lg:translate-y-[35%]">
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
