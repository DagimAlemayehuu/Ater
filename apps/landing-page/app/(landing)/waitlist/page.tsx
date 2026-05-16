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
  const [view, setView] = useState<"hero" | "auth" | "dashboard">("hero");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserStatus(session.user.email!);
        const interval = setInterval(() => {
          fetchUserStatus(session.user.email!);
        }, 5000);
        return () => clearInterval(interval);
      }
    });
  }, []);

  async function fetchUserStatus(userEmail: string) {
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (error) {
      console.error("Fetch status error:", error);
      return;
    }

    if (data) {
      setUserStatus(data);
      setView("dashboard");
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (authMode === "signup") {
        // 1. Add to waiting list first to ensure trigger has data (idempotent upsert)
        const { error: waitlistError } = await supabase
          .from('waiting_list')
          .upsert(
            [{ email, full_name: fullName, status: 'pending' }],
            { onConflict: 'email' }
          );
        
        if (waitlistError) {
          console.error("Waitlist error:", waitlistError);
          throw new Error("Failed to register for waitlist. Please try again.");
        }

        // 2. Perform authentication
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: fullName,
              source: 'landing_page_v2'
            } 
          }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
          fetchUserStatus(authData.user.email!);
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        if (authData.user) fetchUserStatus(authData.user.email!);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-background grid-background flex flex-col items-center justify-center h-screen w-full overflow-hidden pt-16">
      <main className="flex-1 w-full flex items-center relative z-20 overflow-hidden">
        {view === "hero" ? (
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
                <IndustrialButton 
                  onClick={() => setView("auth")}
                  className="h-14 px-10"
                >
                  SIGN IN
                </IndustrialButton>
              </div>
            </div>
            
            {/* Right Mockup Area */}
            <div className="relative h-full w-full min-h-[400px] flex items-center">
               <MockupSection />
            </div>
          </div>
        ) : view === "dashboard" ? (
          <div className="industrial-container flex flex-col items-center justify-center h-full py-12 relative z-20 overflow-hidden">
            <div className="max-w-[440px] w-full text-center">
              <div className="mb-6">
                <h2 className="text-display-hero !text-[3rem] tracking-tighter">HEY, {(userStatus?.full_name || 'USER').split(' ')[0].toUpperCase()}</h2>
                <p className="text-body mt-2 !text-[11px] opacity-40">STATUS: {userStatus?.status?.toUpperCase() || 'ACTIVE'}</p>
              </div>
              
              <div className="p-8 industrial-border bg-surface relative overflow-hidden shadow-sm text-left space-y-8">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-6">
                   <div className={cn("size-2.5", userStatus?.status === 'approved' ? "bg-primary" : "bg-outline-variant")} />
                   <h2 className="text-section-heading !text-[1.5rem]">
                     {userStatus?.status === 'approved' ? "APPROVED" : "PENDING"}
                   </h2>
                </div>
                
                {userStatus?.status === 'approved' && (
                   <div className="space-y-6">
                     <div className="p-6 bg-background border border-outline-variant relative group">
                       <div className="flex justify-between items-center mb-4">
                         <span className="technical-label opacity-30 !text-[8px]">ACTIVATION_KEY</span>
                         <button onClick={() => copyToClipboard(userStatus.activation_code)} className="opacity-40 hover:opacity-100 transition-opacity">
                           {copied ? <ClipboardCheck className="size-3.5 text-primary" /> : <Clipboard className="size-3.5" />}
                         </button>
                       </div>
                       <div className="text-3xl font-mono font-black text-center tracking-[0.4em] text-primary select-all">
                         {userStatus.activation_code}
                       </div>
                       {copied && (
                         <div className="absolute inset-0 bg-primary flex items-center justify-center animate-in fade-in duration-200">
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-on-primary">KEY_COPIED</span>
                         </div>
                       )}
                     </div>

                     <DownloadAterButton />
                   </div>
                )}
              </div>
              
              <button 
                onClick={async () => { await supabase.auth.signOut(); setUserStatus(null); setView("hero"); }} 
                className="mt-8 technical-label opacity-30 hover:opacity-100 transition-opacity"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        ) : (
          <div className="industrial-container flex flex-col items-center justify-center h-full py-12 relative z-20">
            <div className="max-w-[400px] w-full flex flex-col gap-8">
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-section-heading !text-[2rem]">SIGN IN</h1>
                <p className="text-body !text-[11px] opacity-40 uppercase">ENTER YOUR EMAIL TO CONTINUE.</p>
              </div>
              
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="technical-label opacity-40 ml-1">EMAIL</label>
                  <input 
                    type="email" 
                    placeholder="user@ater.ai" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="industrial-input" 
                  />
                </div>
                
                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="technical-label opacity-40 ml-1">FULL NAME</label>
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      required 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      className="industrial-input" 
                    />
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="technical-label opacity-40 ml-1">PASSWORD</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="industrial-input" 
                  />
                </div>
                
                {error && <p className="text-[10px] font-black text-destructive uppercase tracking-widest text-center py-2">{error}</p>}
                
                <IndustrialButton 
                  disabled={loading} 
                  className="w-full h-14 mt-4 disabled:opacity-50"
                >
                  {loading ? "PROCESSING..." : (authMode === "signup" ? "CREATE" : "SIGN IN")}
                </IndustrialButton>
              </form>
              
              <div className="mt-8 pt-8 border-t border-outline-variant text-center">
                <button 
                  onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} 
                  className="technical-label opacity-40 hover:opacity-100 hover:text-primary transition-all"
                >
                  {authMode === "signup" ? "HAVE ACCOUNT? SIGN IN" : "NO ACCOUNT? CREATE ONE"}
                </button>
              </div>
            </div>
          </div>
        )}
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
