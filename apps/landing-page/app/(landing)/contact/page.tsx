"use client";

import React from 'react';
import Link from 'next/link';
import { Mail, MessageSquare, Twitter, Github, ChevronRight, Activity, Terminal, Send } from 'lucide-react';
import { IndustrialButton } from '@/components/IndustrialButton';


export default function ContactPage() {
  return (
    <>
      {/* Header Section */}
      <section className="sticky top-0 z-10 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-b border-outline-variant pt-16">
        <div className="industrial-container w-full flex flex-col items-start gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary active-status-pulse"></div>
            <span className="technical-label text-primary uppercase tracking-widest">GET_IN_TOUCH</span>
          </div>
          <h1 className="text-display-hero">
            WE ARE<br />LISTENING.
          </h1>
          <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest leading-relaxed max-w-2xl text-left">
            HAVE QUESTIONS? FEEDBACK? WE WANT TO HEAR FROM YOU. OUR TEAM IS STANDING BY.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="sticky top-0 z-20 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-outline-variant">
            {/* Contact Form */}
            <div className="p-12 bg-background flex flex-col gap-12 border-r border-outline-variant last:border-r-0">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Terminal className="size-6 text-primary" />
                  <h2 className="text-section-heading">01 // COMPOSE_MESSAGE</h2>
                </div>
              </div>
              
              <form className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="technical-label opacity-40 uppercase tracking-widest">USER_EMAIL</label>
                    <input 
                      type="email" 
                      className="w-full bg-surface-container-low border border-outline-variant p-6 font-mono text-on-surface placeholder:opacity-20 focus:outline-none focus:border-primary transition-colors" 
                      placeholder="ENTER_EMAIL_ADDRESS..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="technical-label opacity-40 uppercase tracking-widest">MESSAGE_BODY</label>
                    <textarea 
                      rows={6}
                      className="w-full bg-surface-container-low border border-outline-variant p-6 font-mono text-on-surface placeholder:opacity-20 focus:outline-none focus:border-primary transition-colors resize-none" 
                      placeholder="TYPE_YOUR_MESSAGE..."
                    />
                  </div>
                </div>

                <IndustrialButton 
                  className="h-16 w-full"
                >
                  <span>SEND_MESSAGE</span>
                  <Send className="ml-4 size-4" />
                </IndustrialButton>
              </form>
            </div>

            {/* Direct Channels */}
            <div className="p-12 bg-surface flex flex-col gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Activity className="size-6 text-primary" />
                  <h2 className="text-section-heading">02 // DIRECT_CHANNELS</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'EMAIL', value: 'HELLO@ATER.IO', icon: Mail },
                  { label: 'TWITTER', value: '@ATER_APP', icon: Twitter },
                  { label: 'GITHUB', value: 'ATER-LABS', icon: Github },
                  { label: 'DISCORD', value: 'ATER_COMMUNITY', icon: MessageSquare }
                ].map((channel) => (
                  <div key={channel.label} className="p-8 border border-outline-variant bg-background flex items-center justify-between group hover:border-primary transition-colors">
                    <div className="flex items-center gap-6">
                      <channel.icon className="size-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                      <div className="flex flex-col">
                        <span className="technical-label opacity-40 uppercase tracking-widest text-[10px]">{channel.label}</span>
                        <span className="font-mono font-black text-on-surface tracking-tighter text-lg">{channel.value}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>

              <div className="mt-auto p-8 industrial-border bg-surface-container-low flex flex-col gap-4">
                <span className="technical-label opacity-40 uppercase tracking-widest text-[10px]">SYSTEM_STATUS</span>
                <div className="flex items-center gap-4">
                  <div className="size-2 bg-primary active-status-pulse"></div>
                  <span className="technical-label uppercase tracking-widest">SUPPORT_ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location / Final Card */}
      <section className="sticky top-0 z-30 bg-background grid-background flex flex-col items-center justify-center h-screen w-full border-t border-outline-variant">
        <div className="industrial-container flex flex-col items-center gap-12 text-center">
          <Terminal className="size-12 text-primary" />
          <h2 className="text-display-hero">ATER_LABS</h2>
          <div className="space-y-4">
            <p className="technical-label uppercase tracking-[0.4em] opacity-40">CALIFORNIA_USA</p>
            <p className="text-body font-bold text-on-surface-variant max-w-xl mx-auto uppercase tracking-widest">
              WE ARE A REMOTE-FIRST TEAM BUILDING THE FUTURE OF COGNITIVE TOOLS.
            </p>
          </div>
          <IndustrialButton 
            href="/" 
            size="lg"
          >
            BACK_TO_HOME
          </IndustrialButton>
        </div>
      </section>
    </>
  );
}
