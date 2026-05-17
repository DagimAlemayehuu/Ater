"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <section className="z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 sm:py-12 md:py-20 px-4 md:px-8">
      <div className="industrial-container w-full max-w-2xl mx-auto flex flex-col gap-10 text-center items-center justify-center">
        
        <div className="space-y-4">
          <h1 className="text-display-hero uppercase">
            CONTACT US
          </h1>
          <p className="text-body max-w-md mx-auto leading-relaxed opacity-85">
            Connect with us directly through our official channels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4 text-left">
          {[
            { label: 'EMAIL', value: 'hello@ater.io' },
            { label: 'TWITTER', value: '@ater_app' },
            { label: 'GITHUB', value: 'ater-labs' },
            { label: 'DISCORD', value: 'ater_community' }
          ].map((channel) => (
            <div 
              key={channel.label} 
              className="p-6 border border-outline-variant bg-surface flex items-center justify-between group hover:border-primary transition-colors font-mono text-[11px]"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] opacity-40 uppercase">{channel.label}</span>
                <span className="font-bold text-on-surface uppercase tracking-tight text-sm">
                  {channel.value}
                </span>
              </div>
              <ChevronRight className="size-4 opacity-20 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
