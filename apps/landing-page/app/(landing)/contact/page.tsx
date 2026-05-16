"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { IndustrialButton } from '@/components/IndustrialButton';


export default function ContactPage() {
  return (
    <>
      {/* Header Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[60vh] md:h-screen w-full border-b border-outline-variant pt-16">
        <div className="industrial-container w-full flex flex-col items-start gap-8 py-20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary"></div>
            <span className="technical-label text-primary">CONTACT</span>
          </div>
          <h1 className="text-display-hero">
            WE ARE<br />LISTENING.
          </h1>
          <p className="text-body max-w-2xl text-left">
            HAVE QUESTIONS? FEEDBACK? WE WANT TO HEAR FROM YOU. OUR TEAM IS STANDING BY.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-t border-outline-variant py-20 lg:py-0">
        <div className="industrial-container w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-outline-variant">
            {/* Contact Form */}
            <div className="p-6 md:p-12 bg-background flex flex-col gap-8 md:gap-12 border-b lg:border-b-0 lg:border-r border-outline-variant last:border-r-0">
              <div className="space-y-6">
                <h2 className="text-section-heading !text-[1.5rem]">MESSAGE</h2>
              </div>
              
              <form className="space-y-6 md:space-y-8">
                  <div className="space-y-2">
                    <label htmlFor="email" className="technical-label opacity-40">EMAIL ADDRESS</label>
                    <input 
                      id="email"
                      type="email" 
                      className="industrial-input" 
                      placeholder="user@ater.io"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="technical-label opacity-40">YOUR MESSAGE</label>
                    <textarea 
                      id="message"
                      rows={6}
                      className="w-full bg-surface border-2 border-outline-variant p-5 md:p-6 font-mono text-[12px] md:text-[13px] uppercase text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary transition-colors resize-none rounded-none" 
                      placeholder="ENTER MESSAGE..."
                      required
                    />
                  </div>

                <IndustrialButton 
                  className="h-14 md:h-16 w-full"
                >
                  SEND
                </IndustrialButton>
              </form>
            </div>

            {/* Direct Channels */}
            <div className="p-6 md:p-12 bg-surface flex flex-col gap-8 md:gap-12">
              <div className="space-y-6">
                <h2 className="text-section-heading !text-[1.5rem]">CHANNELS</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'EMAIL', value: 'HELLO@ATER.IO' },
                  { label: 'TWITTER', value: '@ATER_APP' },
                  { label: 'GITHUB', value: 'ATER-LABS' },
                  { label: 'DISCORD', value: 'ATER_COMMUNITY' }
                ].map((channel) => (
                  <div key={channel.label} className="p-6 md:p-8 border border-outline-variant bg-background flex items-center justify-between group hover:border-primary transition-colors">
                    <div className="flex flex-col">
                      <span className="technical-label opacity-40 text-[8px] md:text-[10px]">{channel.label}</span>
                      <span className="font-mono font-black text-on-surface tracking-tighter text-base md:text-lg">{channel.value}</span>
                    </div>
                    <ChevronRight className="size-4 opacity-20" />
                  </div>
                ))}
              </div>

              <div className="mt-auto p-6 md:p-8 border border-outline-variant bg-surface flex items-center gap-4">
                <div className="size-2 bg-primary"></div>
                <span className="technical-label">SUPPORT ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
