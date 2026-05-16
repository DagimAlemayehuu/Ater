"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Terminal, Cpu, Database, Activity, Layers, BarChart3, Group, Settings, ChevronRight } from "lucide-react";

export default function Pricing() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow industrial-container py-20 lg:py-32 space-y-32">
        {/* Header Section */}
        <section className="flex flex-col items-start gap-8 w-full border-b border-outline-variant pb-12">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-primary" />
            <span className="technical-label text-primary uppercase tracking-widest">PRICING PLANS</span>
          </div>
          <h1 className="text-display-hero">
            CHOOSE YOUR<br />PLAN.
          </h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest leading-relaxed max-w-2xl">
            SIMPLE PRICING FOR POWERFUL STUDY TOOLS. SELECT THE LEVEL THAT FITS YOUR NEEDS.
          </p>
        </section>

        {/* Access Tiers */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline-variant overflow-hidden">
          {/* BASIC */}
          <div className="p-12 border-r border-outline-variant flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
            <div className="space-y-12">
              <span className="technical-label opacity-40 uppercase tracking-widest">FOR STUDENTS</span>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-primary uppercase">BASIC</h2>
                <div className="h-1 w-12 bg-primary"></div>
              </div>
              <ul className="space-y-6">
                <TierFeature icon={Terminal} label="PRIVATE STORAGE" />
                <TierFeature icon={Cpu} label="BASIC AI SEARCH" />
                <TierFeature icon={Database} label="15GB VAULT" />
              </ul>
            </div>
            <Link href="/waitlist" className="mt-16 industrial-btn w-full text-center">JOIN WAITLIST</Link>
          </div>

          {/* PRO */}
          <div className="p-12 border-r border-outline-variant flex flex-col justify-between bg-surface-container-lowest relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary active-status-pulse"></div>
            <div className="space-y-12">
              <span className="technical-label text-primary uppercase tracking-widest">MOST POPULAR</span>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-primary uppercase">PRO</h2>
                <div className="h-1 w-24 bg-primary"></div>
              </div>
              <ul className="space-y-6">
                <TierFeature icon={Activity} label="ADVANCED AI ENGINE" />
                <TierFeature icon={Layers} label="FULL STUDY PLANNER" />
                <TierFeature icon={BarChart3} label="PROGRESS TRACKING" />
              </ul>
            </div>
            <Link href="/waitlist" className="mt-16 industrial-btn industrial-btn-primary w-full text-center">JOIN WAITLIST</Link>
          </div>

          {/* TEAM */}
          <div className="p-12 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
            <div className="space-y-12">
              <span className="technical-label opacity-40 uppercase tracking-widest">FOR GROUPS</span>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-primary uppercase">TEAM</h2>
                <div className="h-1 w-12 bg-primary"></div>
              </div>
              <ul className="space-y-6">
                <TierFeature icon={Terminal} label="SHARED LIBRARIES" />
                <TierFeature icon={Group} label="MULTI-USER SYNC" />
                <TierFeature icon={Settings} label="ADMIN CONTROLS" />
              </ul>
            </div>
            <Link href="/contact" className="mt-16 industrial-btn w-full text-center">CONTACT US</Link>
          </div>
        </section>

        {/* System Benefits */}
        <section className="pt-32 border-t border-outline-variant grid grid-cols-1 md:grid-cols-3 gap-16">
          <Invariant 
            title="TOTAL PRIVACY" 
            desc="YOUR DATA NEVER LEAVES YOUR DEVICE. WE DON'T USE YOUR WORK TO TRAIN AI."
          />
          <Invariant 
            title="FAST INTERFACE" 
            desc="DESIGNED FOR SPEED. NO UNNECESSARY ANIMATIONS OR SLOW LOADING TIMES."
          />
          <Invariant 
            title="OFFLINE READY" 
            desc="WORKS WITHOUT INTERNET. YOUR NOTES ARE ALWAYS ACCESSIBLE."
          />
        </section>

        {/* Final CTA */}
        <section className="w-full py-20 border-y border-outline-variant flex flex-col items-center text-center gap-12">
          <div className="space-y-6">
            <h2 className="text-display-hero !text-6xl">START LEARNING.</h2>
            <p className="text-body font-bold text-on-surface-variant max-w-2xl mx-auto uppercase tracking-widest">
              SECURE YOUR SPOT ON THE WAITLIST TO GET EARLY ACCESS TO THE ATER PLATFORM.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/waitlist" className="industrial-btn industrial-btn-primary h-20 px-16">
              JOIN WAITLIST
            </Link>
            <Link href="/contact" className="industrial-btn h-20 px-16">
              CONTACT SALES
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function TierFeature({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <li className="flex items-center gap-4">
      <div className="p-2 border border-outline-variant bg-background">
        <Icon className="size-4 text-primary" />
      </div>
      <span className="technical-label uppercase tracking-widest">{label}</span>
    </li>
  );
}

function Invariant({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black text-primary uppercase">{title}</h3>
      <p className="text-xs font-mono text-on-surface-variant leading-relaxed uppercase tracking-widest">{desc}</p>
    </div>
  );
}
