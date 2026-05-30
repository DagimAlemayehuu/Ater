"use client";

import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Copy, Check, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DownloadAterButton } from "@/components/DownloadAterButton";
import { IndustrialButton } from "@/components/IndustrialButton";
import { cn } from "@/lib/utils";

function AuthContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"loading" | "auth" | "dashboard">("loading");
  const [authMode, setAuthMode] = useState<"login" | "signup">(initialMode);
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchUserStatus(userEmail: string, currentUser: any) {
      try {
        const { data, error } = await supabase
          .from('waiting_list')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (error || !data) {
          if (!data) {
             const { data: newProfile, error: insertError } = await supabase.from('waiting_list').insert([
               { email: userEmail, full_name: currentUser?.user_metadata?.full_name || 'User', status: 'pending' }
             ]).select().single();
             
             if (!insertError && newProfile) {
               setUserStatus(newProfile);
               setView("dashboard");
               return;
             }
          }
          await supabase.auth.signOut();
          setView("auth");
          return;
        }

        setUserStatus(data);
        setView("dashboard");
      } catch (err) {
        await supabase.auth.signOut();
        setView("auth");
      }
    }

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        setUser(session.user);
        fetchUserStatus(session.user.email!, session.user);
      } else {
        setView("auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setUser(session.user);
        fetchUserStatus(session.user.email!, session.user);
      } else {
        setUser(null);
        setUserStatus(null);
        setView("auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        // 1. Create the user in Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (signUpError) throw signUpError;
        
        // 2. Ensure waitlist record exists (this might fail due to RLS if email confirmation is required, which is fine as it will be created on first login)
        const { error: waitlistError } = await supabase
          .from('waiting_list')
          .upsert(
            [{ email, full_name: fullName, status: 'pending' }],
            { onConflict: 'email' }
          );
        
        if (waitlistError) {
          console.warn('Waitlist upsert failed (likely RLS), will be created on first login:', waitlistError.message);
        }

        if (!data.session) {
          setError("SUCCESS! CHECK YOUR EMAIL TO VERIFY ACCOUNT.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message.toUpperCase() || "AUTHENTICATION FAILED.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    const key = userStatus?.activation_code || user?.id?.substring(0, 8).toUpperCase();
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[100dvh]">
        <div className="flex gap-2 items-center text-primary text-[10px] tracking-widest uppercase">
          <Loader2 className="size-3 animate-spin" />
          <span>Authenticating</span>
        </div>
      </div>
    );
  }

  if (view === "dashboard") {
    const firstName = (userStatus?.full_name || user?.user_metadata?.full_name || 'USER').split(' ')[0];
    const isApproved = userStatus?.status === 'approved';
    
    return (
      <section className="z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full pt-16 border-b border-outline-variant">
        <div className="industrial-container w-full max-w-2xl flex flex-col gap-4 sm:gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 md:gap-12 py-12">
          
          <div className="w-full flex justify-between items-center border-b border-outline-variant pb-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 technical-label opacity-40 hover:opacity-100 hover:text-primary transition-all -ml-1"
            >
              <ArrowLeft className="size-3" />
              <span>Return</span>
            </Link>
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="flex items-center gap-2 technical-label opacity-40 hover:opacity-100 transition-all"
            >
              <span>Logout</span>
              <LogOut className="size-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1 sm:gap-2">
            <h1 className="text-display-hero !text-[1.8rem] sm:!text-[2.5rem] md:!text-[3.5rem] tracking-tighter uppercase break-words">
              Welcome, {firstName}.
            </h1>
            <div className="flex items-center gap-3">
              <span className="technical-label opacity-40">Status:</span>
              <span className={cn(
                "technical-label px-2 py-1 border",
                isApproved ? "border-primary text-primary bg-primary/10" : "border-outline-variant text-on-surface-variant bg-surface"
              )}>
                {isApproved ? 'Approved' : 'Pending'}
              </span>
            </div>
            </div>

            <div className="border border-outline-variant bg-surface flex flex-col relative overflow-hidden shadow-2xl">
            {/* Top Bar of the Card */}
            <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4 bg-surface-container-low">
              <span className="font-bold text-[11px] text-on-surface uppercase tracking-widest">
                {isApproved ? 'Activation' : 'Waitlist'}
              </span>
              <div className="flex gap-1.5">
                <div className="size-1.5 rounded-full bg-outline-variant" />
                <div className="size-1.5 rounded-full bg-outline-variant" />
              </div>
            </div>

            {/* Inner Content */}
            <div className="p-4 sm:p-6 md:p-10 flex flex-col gap-4 sm:gap-6 md:gap-8 bg-background">
              {isApproved ? (
                <>
                  <p className="text-body !text-[12px] opacity-75">
                    You are approved. Use this key to unlock Ater on your machine. Keep it secret.
                  </p>
                  
                  <div className="p-6 border border-primary bg-primary/5 flex flex-col gap-4 relative group">
                    <div className="flex justify-between items-center border-b border-primary/20 pb-3">
                      <span className="technical-label text-primary">Activation Key</span>
                      <button onClick={copyKey} className="text-primary hover:opacity-70 transition-opacity">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                    <div className="text-2xl sm:text-4xl font-black text-center tracking-[0.2em] sm:tracking-[0.4em] text-primary break-all">
                      {userStatus?.activation_code || '---'}
                    </div>
                    {copied && (
                      <div className="absolute inset-0 bg-primary flex items-center justify-center animate-in fade-in duration-200">
                        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-on-primary">Key copied to clipboard</span>
                      </div>
                    )}
                  </div>


                  <DownloadAterButton />
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center gap-6 py-8">
                    <div className="size-16 border-2 border-outline-variant rounded-full flex items-center justify-center mb-2">
                      <div className="size-6 bg-outline-variant animate-pulse rounded-full" />
                    </div>
                    <h2 className="text-section-heading !text-[1.8rem]">THANK YOU.</h2>
                    <p className="text-body !text-[13px] opacity-60 max-w-md mx-auto">
                      You are on the list. We invite new users every day. We will email you when your account is ready.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full pt-16 border-b border-outline-variant">
      <div className="industrial-container w-full flex flex-col items-center justify-center gap-3 sm:gap-6 md:gap-4 sm:p-6 md:p-8 py-12 relative z-20">
        <main className="w-full max-w-[440px] flex flex-col gap-10">
          {/* Back Button */}
          <Link 
            href="/" 
            className="flex items-center gap-2 technical-label opacity-40 hover:opacity-100 hover:text-primary transition-all -ml-1 w-fit"
          >
            <ArrowLeft className="size-3" />
            <span>Return</span>
          </Link>

          {/* Header */}
          <div className="flex flex-col gap-3">
            <h1 className="text-display-hero !text-[2.5rem] tracking-tighter">
              {authMode === 'signup' ? 'JOIN WAITLIST' : 'SIGN IN'}
            </h1>
            <p className="text-body !text-[11px] opacity-40 uppercase">
              ENTER YOUR DETAILS.
            </p>
          </div>

          {/* Form Card */}
          <div className="border border-outline-variant bg-surface p-4 sm:p-6 md:p-8 shadow-2xl relative">
            <form onSubmit={handleAuth} className="flex flex-col gap-6 relative z-10">
              {error && (
                <div className={cn(
                  "p-4 border text-[10px] font-bold uppercase tracking-widest text-left",
                  error.includes("SUCCESS") ? "bg-primary text-background border-primary" : "bg-error/10 border-error/30 text-error"
                )}>
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {authMode === "signup" && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="full-name" className="technical-label opacity-60">FULL NAME</label>
                    <input 
                      id="full-name"
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="JOHN DOE" 
                      required 
                      className="industrial-input bg-background" 
                    />
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="technical-label opacity-60">EMAIL ADDRESS</label>
                  <input 
                    id="email"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="USER@SYSTEM.IO" 
                    required 
                    className="industrial-input bg-background" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="technical-label opacity-60">PASSWORD</label>
                  <input 
                    id="password"
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    className="industrial-input bg-background" 
                    minLength={6}
                  />
                </div>
              </div>

              <IndustrialButton type="submit" disabled={loading} className="w-full mt-2 h-14 bg-background">
                {loading ? <Loader2 className="size-4 animate-spin" /> : (authMode === "signup" ? "JOIN WAITLIST" : "SIGN IN")}
              </IndustrialButton>
            </form>
          </div>

          <div className="text-center pt-2">
            <button 
              onClick={() => {
                setAuthMode(authMode === "signup" ? "login" : "signup");
                setError(null);
              }} 
              className="technical-label opacity-40 hover:opacity-100 transition-all border-b border-transparent hover:border-on-surface pb-1"
            >
              {authMode === "signup" ? "ALREADY ON THE LIST? SIGN IN" : "NOT ON THE LIST? JOIN WAITLIST"}
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[100dvh]">
        <div className="flex gap-2 items-center text-primary text-[10px] tracking-widest uppercase">
          <Loader2 className="size-3 animate-spin" />
          <span>Starting</span>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
