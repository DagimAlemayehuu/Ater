"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  Loader2, 
  Copy, 
  Check, 
  Laptop,
  LogOut,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { DownloadAterButton } from "@/components/DownloadAterButton";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"loading" | "register" | "dashboard">("loading");
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setView("dashboard");
      } else {
        setView("register");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setView("dashboard");
      } else {
        setUser(null);
        setView("register");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    const key = user?.id?.substring(0, 8).toUpperCase() || "M5C7HU7";
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center bg-black min-h-[60vh]">
        <div className="font-mono text-[10px] text-primary/40 animate-pulse uppercase tracking-[0.3em]">LOADING...</div>
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-[80px] pt-[80px] pb-[80px] flex-1 flex flex-col items-center justify-center">
        <main className="w-full max-w-[500px] flex flex-col gap-12 items-center">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <h1 className="text-[64px] font-black uppercase text-primary leading-[0.9] tracking-tighter">
              HELLO, {user?.user_metadata?.full_name?.split(' ')[0] || 'USER'}
            </h1>
            <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.3em] font-medium">
              ACCOUNT STATUS: ACTIVE
            </p>
          </div>

          {/* Activation Card */}
          <div className="w-full space-y-12">
            {/* Status Header */}
            <div className="space-y-4 border-b border-outline-variant pb-6">
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] font-bold opacity-60 tracking-widest">STATUS</span>
              <div className="flex items-center gap-3">
                <div className="size-3 bg-primary" />
                <h2 className="text-[32px] font-black text-primary uppercase leading-none tracking-tighter">APPROVED</h2>
              </div>
              <p className="font-mono text-[12px] text-on-surface-variant uppercase tracking-wide leading-relaxed">
                YOU'RE APPROVED. USE THIS KEY TO START USING ATER ON YOUR COMPUTER.
              </p>
            </div>

            {/* Activation Key Section */}
            <div className="border border-outline-variant p-8 space-y-4 relative bg-transparent">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] font-bold opacity-60 tracking-widest">ACTIVATION KEY</span>
                <button 
                  onClick={copyKey}
                  className="text-on-surface-variant hover:text-primary transition-all duration-200"
                >
                  {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                </button>
              </div>
              <div className="text-[48px] font-black text-primary font-mono text-center py-4 tracking-[0.2em] whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.id?.substring(0, 8).toUpperCase() || "M5C7HU7"}
              </div>
              <p className="font-mono text-[10px] text-on-surface-variant text-center opacity-60 uppercase tracking-widest leading-relaxed">
                KEEP THIS KEY PRIVATE. IT CAN ONLY BE USED ONCE TO UNLOCK YOUR DEVICE.
              </p>
            </div>

            {/* Download Action */}
            <DownloadAterButton />

            {/* Card Footer */}
            <div className="text-center font-mono text-[9px] text-on-surface-variant opacity-30 uppercase tracking-[0.3em] font-bold">
              ATER v0.1.0-BETA
            </div>
          </div>

          {/* Sign Out Link */}
          <button 
            onClick={() => supabase.auth.signOut()}
            className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.3em] hover:text-primary transition-all duration-200 border-b border-transparent hover:border-primary pb-1 font-bold tracking-widest"
          >
            SIGN OUT
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 md:px-[80px] pt-[80px] pb-[80px] flex-1 flex flex-col items-center">
      <main className="w-full max-w-[440px] flex flex-col gap-8 relative items-center">
        {/* Back Action */}
        <Link 
          href="/waitlist"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all duration-200 group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.2em]">BACK</span>
        </Link>

        {/* Header */}
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-[32px] font-black uppercase text-primary leading-none tracking-tighter">JOIN WAITLIST</h1>
          <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-medium">
            GET EARLY ACCESS.
          </p>
        </header>

        {/* Registration Form */}
        <form onSubmit={handleSignUp} className="flex flex-col gap-6 w-full">
          {error && (
            <div className={cn(
              "p-4 border text-[11px] font-mono uppercase tracking-wider text-center",
              error.includes("Success") 
                ? "bg-primary/5 border-primary/20 text-primary" 
                : "bg-error-container/20 border-error/20 text-error"
            )}>
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] opacity-80" htmlFor="email">
              EMAIL ADDRESS
            </label>
            <input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR@EMAIL.COM"
              required
              className="w-full bg-black border border-outline-variant text-primary font-mono text-[11px] p-4 placeholder-on-surface-variant/30 focus:outline-none focus:border-primary transition-all rounded-none appearance-none"
            />
          </div>

          {/* Full Name Field */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] opacity-80" htmlFor="fullName">
              FULL NAME
            </label>
            <input 
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="YOUR NAME"
              required
              className="w-full bg-black border border-outline-variant text-primary font-mono text-[11px] p-4 placeholder-on-surface-variant/30 focus:outline-none focus:border-primary transition-all rounded-none appearance-none"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] opacity-80" htmlFor="password">
              PASSWORD
            </label>
            <input 
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-black border border-outline-variant text-primary font-mono text-[11px] p-4 placeholder-on-surface-variant/30 focus:outline-none focus:border-primary transition-all rounded-none appearance-none"
            />
          </div>

          {/* Submit CTA */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-background border border-outline-variant font-mono text-[11px] font-bold uppercase p-5 hover:bg-on-surface transition-all rounded-none flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "JOIN WAITLIST"}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full border-t border-outline-variant my-2" />

        {/* Footer Link */}
        <div className="text-center font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em]">
          ALREADY SIGNED UP? 
          <Link href="/auth?mode=signin" className="text-primary hover:underline transition-none ml-2">
            SIGN IN
          </Link>
        </div>
      </main>
    </div>
  );
}
