"use client";

import React from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Activity, Zap, Shield, Cpu, Lock } from 'lucide-react';
import { IndustrialButton } from '@/components/IndustrialButton';
import { motion } from 'motion/react';


export default function PricingPage() {
  return (
    <>
      {/* Header Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-b border-outline-variant pt-16">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="industrial-container w-full flex flex-col items-start gap-8 py-20"
        >
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
        </motion.div>
      </section>

      {/* Pricing Cards Section */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full py-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-outline-variant"
          >
            {/* Basic Tier */}
            <div className="bg-background p-10 flex flex-col gap-10 border-b lg:border-b-0 lg:border-r border-outline-variant hover:bg-surface transition-colors">
              <div className="space-y-4">
                <h2 className="text-section-heading !text-[1.2rem]">BASIC</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-hero !text-5xl">0</span>
                  <span className="technical-label opacity-40">ETB</span>
                </div>
              </div>
              
              <ul className="space-y-4">
                {[
                  'LOCAL PROCESSING',
                  'UP TO 5 DOCUMENTS',
                  'SMART SEARCH',
                  'SECURE VAULT'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="size-1 bg-primary"></div>
                    <span className="technical-label text-[10px]">{feature}</span>
                  </li>
                ))}
              </ul>

              <IndustrialButton 
                href="/auth?mode=signup" 
                className="h-14 w-full mt-auto"
              >
                JOIN WAITLIST
              </IndustrialButton>
            </div>

            {/* Premium Tier */}
            <div className="bg-surface p-10 flex flex-col gap-10 border-b lg:border-b-0 lg:border-r border-outline-variant relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 bg-primary">
                <span className="technical-label text-background text-[8px] tracking-[0.2em]">POPULAR</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-section-heading !text-[1.2rem] text-primary">PREMIUM</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-hero !text-6xl">499</span>
                  <span className="technical-label opacity-40">ETB</span>
                </div>
              </div>
              
              <ul className="space-y-4">
                {[
                  'UNLIMITED DOCUMENTS',
                  'PRIORITY AI ENGINE',
                  'EXAM SIMULATOR',
                  'ADVANCED PLANNING'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="size-1 bg-primary"></div>
                    <span className="technical-label text-[10px]">{feature}</span>
                  </li>
                ))}
              </ul>

              <IndustrialButton 
                href="/auth?mode=signup" 
                className="h-14 w-full mt-auto"
              >
                JOIN WAITLIST
              </IndustrialButton>
            </div>

            {/* Pro Tier */}
            <div className="bg-background p-10 flex flex-col gap-10 hover:bg-surface transition-colors">
              <div className="space-y-4">
                <h2 className="text-section-heading !text-[1.2rem]">PRO</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-hero !text-6xl">999</span>
                  <span className="technical-label opacity-40">ETB</span>
                </div>
              </div>
              
              <ul className="space-y-4">
                {[
                  'ENTERPRISE SECURITY',
                  'CUSTOM ANALYTICS',
                  'TEAM COLLABORATION',
                  'API ACCESS'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="size-1 bg-primary"></div>
                    <span className="technical-label text-[10px]">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <IndustrialButton 
                href="/auth?mode=signup" 
                className="h-14 w-full mt-auto"
              >
                JOIN WAITLIST
              </IndustrialButton>
            </div>
          </motion.div>
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
