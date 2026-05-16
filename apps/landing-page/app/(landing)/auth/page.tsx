"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Loader2, 
  Copy, 
  Check, 
} from "lucide-react";
import { DownloadAterButton } from "@/components/DownloadAterButton";
import { IndustrialButton } from "@/components/IndustrialButton";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"loading" | "auth" | "dashboard">("loading");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserStatus(session.user.email!);
        setView("dashboard");
      } else {
        setView("auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchUserStatus(session.user.email!);
        setView("dashboard");
      } else {
        setUser(null);
        setUserStatus(null);
        setView("auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserStatus(userEmail: string) {
    const { data } = await supabase
      .from('waiting_list')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (data) {
      setUserStatus(data);
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        // Add to waiting list first
        const { error: waitlistError } = await supabase
          .from('waiting_list')
          .upsert(
            [{ email, full_name: fullName, status: 'pending' }],
            { onConflict: 'email' }
          );
        
        if (waitlistError) throw waitlistError;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!data.session) {
          setError("Success! Please check your email to confirm your account.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
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
      <div className="flex-1 flex items-center justify-center bg-background min-h-[60vh]">
        <div className="technical-label animate-pulse opacity-20">LOADING...</div>
      </div>
    );
  }

  if (view === "dashboard") {
    const firstName = (userStatus?.full_name || user?.user_metadata?.full_name || 'USER').split(' ')[0];
    
    return (
      <section className="bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant pt-16 overflow-hidden">
        <div className="industrial-container w-full flex flex-col items-center justify-center gap-6 py-12 relative z-20">
          <div className="max-w-[440px] w-full text-center">
            <div className="mb-6">
              <h1 className="text-display-hero !text-[3rem] tracking-tighter">HEY, {firstName.toUpperCase()}</h1>
              <p className="text-body !text-[11px] opacity-40">STATUS: {userStatus?.status?.toUpperCase() || 'ACTIVE'}</p>
            </div>
            
            <div className="p-8 industrial-border bg-surface relative overflow-hidden shadow-sm text-left space-y-8">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-6">
                <div className={cn("size-2.5", userStatus?.status === 'approved' ? "bg-primary" : "bg-outline-variant")} />
                <h2 className="text-section-heading !text-[1.5rem]">
                  {userStatus?.status === 'approved' ? 'APPROVED' : 'PENDING'}
                </h2>
              </div>

              {userStatus?.status === 'approved' && (
                <div className="space-y-6">
                  <div className="p-6 bg-background border border-outline-variant relative group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="technical-label opacity-30 !text-[8px]">ACTIVATION_KEY</span>
                      <button onClick={copyKey} className="opacity-40 hover:opacity-100 transition-opacity">
                        {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                    <div className="text-3xl font-mono font-black text-center tracking-[0.4em] text-primary">
                      {userStatus?.activation_code || '---'}
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
              onClick={() => supabase.auth.signOut()} 
              className="mt-8 technical-label opacity-30 hover:opacity-100 transition-opacity"
            >
              NOT {firstName.toUpperCase()}? SIGN OUT
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background grid-background flex flex-col items-center justify-center min-h-screen w-full border-b border-outline-variant pt-16">
      <div className="industrial-container w-full flex flex-col items-center justify-center gap-8 py-12">
        <main className="w-full max-w-[400px] flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-section-heading !text-[2rem]">SIGN IN</h1>
            <p className="text-body !text-[11px] opacity-40">ENTER YOUR CREDENTIALS TO CONTINUE.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-8">
            {error && (
              <div className={cn(
                "p-6 border text-[11px] font-mono uppercase tracking-widest text-center",
                error.includes("Success") ? "bg-primary/5 border-primary/20 text-primary" : "bg-error/10 border-error/20 text-error"
              )}>
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="technical-label opacity-40">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="user@ater.ai" 
                  required 
                  className="industrial-input" 
                />
              </div>

              {authMode === "signup" && (
                <div className="space-y-2">
                  <label className="technical-label opacity-40">FULL NAME</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Your Name" 
                    required 
                    className="industrial-input" 
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="technical-label opacity-40">PASSWORD</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="industrial-input" 
                />
              </div>
            </div>

            <IndustrialButton type="submit" disabled={loading} className="w-full h-14">
              {loading ? <Loader2 className="size-4 animate-spin" /> : (authMode === "signup" ? "CREATE" : "SIGN IN")}
            </IndustrialButton>
          </form>

          <div className="text-center pt-8 border-t border-outline-variant">
            <button 
              onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} 
              className="technical-label opacity-40 hover:opacity-100 hover:text-primary transition-all"
            >
              {authMode === "signup" ? "HAVE ACCOUNT? SIGN IN" : "NO ACCOUNT? CREATE ONE"}
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}
