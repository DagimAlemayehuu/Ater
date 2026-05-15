"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { 
  Clipboard, 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Loader2,
  Download
} from "lucide-react";

export default function Home() {
  const [view, setView] = useState<"hero" | "auth" | "dashboard">("hero");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Check for session on mount and poll for status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserStatus(session.user.email!);
        
        // Poll for status changes every 5 seconds
        const interval = setInterval(() => {
          fetchUserStatus(session.user.email!);
        }, 5000);
        
        return () => clearInterval(interval);
      }
    });
  }, []);

  async function fetchUserStatus(userEmail: string) {
    const { data } = await supabase
      .from('waiting_list')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (data) {
      setUserStatus(data);
      setView("dashboard");
    } else if (view === "dashboard") {
      setView("hero");
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (authError) throw authError;

        const { data: existing } = await supabase
          .from('waiting_list')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('waiting_list')
            .insert([{ email, full_name: fullName, status: 'pending' }]);
        }

        if (authData.user) fetchUserStatus(authData.user.email!);
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
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
    <div className="h-screen bg-[#FAFAFA] text-black overflow-hidden flex flex-col relative selection:bg-black selection:text-white font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-6 w-full relative z-30 shrink-0">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setView("hero"); }}>
          <span className="font-semibold text-xl tracking-tight uppercase">Ater <span className="text-gray-300 ml-1 font-medium">አጠር</span></span>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="#" className="text-gray-400 hover:text-black transition-colors">
             <GithubIcon />
          </a>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors text-gray-600 shadow-sm font-medium h-10">
            <XIcon />
            <span className="hidden sm:block">Follow for updates</span>
          </button>
          <button 
            onClick={() => { setView("auth"); setAuthMode("login"); }}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors shadow-lg font-medium h-10"
          >
            Get in
          </button>
        </div>
      </nav>

      {/* Content Area */}
      {view === "hero" ? (
        <main className="flex-1 w-full px-6 lg:px-12 flex flex-col justify-center relative z-20">
          <div className="max-w-[1400px] w-full mx-auto relative h-full flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-[2.75rem] sm:text-[4rem] lg:text-[4.5rem] leading-[1.05] font-bold tracking-tight text-black max-w-[700px] mb-8" style={{ letterSpacing: "-0.04em" }}>
                Learn faster. <br className="hidden sm:block" /> Score better.
              </h1>
              <p className="text-gray-500 text-lg sm:text-xl max-w-[480px] leading-relaxed font-medium mb-12">
                Ater is the easiest way to master any subject. It takes your messy PDFs and turns them into simple notes that actually make sense. It organizes all your school work in one clean place. With smart tools that build your notes and quick quizzes to test what you know, Ater helps you get better grades by studying less.
              </p>
            </div>

            <div className="pb-12 flex flex-col gap-6">
              <div>
                <div className="text-[10px] font-bold tracking-[0.25em] text-gray-400 mb-2 uppercase">
                  Early Access
                </div>
                <div className="text-gray-500 font-medium text-[15px]">
                  We're currently letting in a small group of early users.
                </div>
              </div>
              
              <button 
                onClick={() => setView("auth")}
                className="flex items-center justify-center border border-gray-200 hover:border-gray-300 shadow-sm gap-3 px-10 py-3.5 w-full max-w-[320px] rounded-xl text-black font-semibold text-base transition-all bg-white hover:bg-gray-50 group"
              >
                <span className="text-[16px] group-hover:translate-x-0.5 transition-transform">Join the waitlist</span>
              </button>
            </div>
            <MockupSection />
          </div>
        </main>
      ) : view === "dashboard" ? (
        <main className="flex-1 w-full flex flex-col items-center justify-center bg-white relative z-20">
          <div className="max-w-[500px] w-full px-6 text-center">
            <div className="mb-12">
              <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">Account Status</span>
              <h2 className="text-4xl font-bold mt-6 tracking-tight uppercase italic">Hey, {userStatus?.full_name?.split(' ')[0] || 'Scholar'}</h2>
              <p className="text-gray-500 font-medium mt-2">Welcome to the inner circle.</p>
            </div>

            <div className="p-10 border border-black/5 rounded-[2.5rem] bg-[#FAFAFA] relative overflow-hidden shadow-sm">
               <div className="relative z-10">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 text-left">Current Position</div>
                 <div className="flex items-center justify-start gap-3">
                    <div className={cn(
                      "size-3 rounded-full",
                      userStatus?.status === 'approved' ? "bg-black" : 
                      userStatus?.status === 'rejected' ? "bg-red-400" : "bg-gray-300"
                    )} />
                    <span className="text-2xl font-black uppercase tracking-tighter">
                      {userStatus?.status === 'approved' ? "Access Granted" : 
                       userStatus?.status === 'rejected' ? "Access Revoked" : "Pending Approval"}
                    </span>
                 </div>
                 
                 <p className="text-gray-500 text-[14px] font-medium mt-6 leading-relaxed text-left">
                   {userStatus?.status === 'approved' 
                     ? "Your clearance is active. Use the activation code below to actuate your Ater Desktop engine." 
                     : userStatus?.status === 'rejected'
                     ? "Your identity has been restricted from the Oracle network. Access is currently denied."
                     : "Your application is being verified. We'll broadcast your activation code as soon as a node becomes available."}
                 </p>

                 {userStatus?.status === 'approved' && userStatus?.activation_code && (
                    <div className="mt-8 p-6 bg-white border border-black/5 rounded-2xl relative group overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 p-3">
                        <button 
                          onClick={() => copyToClipboard(userStatus.activation_code)}
                          className="p-2 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-black/5"
                        >
                          {copied ? <ClipboardCheck className="size-4 text-black" /> : <Clipboard className="size-4 text-gray-300" />}
                        </button>
                      </div>
                      <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 text-left">Activation Code</div>
                      <div className="text-3xl font-mono font-black text-black tracking-[0.3em] text-left">
                        {userStatus.activation_code}
                      </div>
                      {copied && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Copied to Clipboard</span>
                        </div>
                      )}
                    </div>
                 )}

                 {userStatus?.status === 'approved' && (
                    <div className="mt-6">
                       <a 
                        href="https://ater.ai/download" 
                        target="_blank"
                        className="w-full py-4 bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Download Ater <Download className="size-4" />
                      </a>
                    </div>
                 )}
               </div>
               
               <div className="absolute -bottom-4 -right-4 text-[120px] font-black text-gray-200/10 select-none pointer-events-none tracking-tighter">
                 {userStatus?.status === 'approved' ? "GO" : 
                  userStatus?.status === 'rejected' ? "NO" : "WAIT"}
               </div>
            </div>

            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                setUserStatus(null);
                setView("hero");
              }}
              className="mt-12 text-[10px] font-black text-gray-300 hover:text-black transition-colors uppercase tracking-[0.3em]"
            >
              Sign out
            </button>
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full flex flex-col items-center justify-center bg-white relative z-20">
          <div className="max-w-[400px] w-full px-6">
            <button 
              onClick={() => setView("hero")}
              className="text-gray-300 hover:text-black transition-colors flex items-center gap-2 mb-10 text-[10px] font-black uppercase tracking-widest"
            >
              ← Back
            </button>
            
            <div className="w-full">
              <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase">
                {authMode === "signup" ? "Request Clearance" : "Check Registry"}
              </h2>
              <p className="text-gray-400 font-medium mb-10 text-[15px]">
                {authMode === "signup" 
                  ? "Join the next generation of sovereigns." 
                  : "Sign in to retrieve your activation code."}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="scholar@ater.ai"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-black/5 focus:border-black focus:bg-white rounded-xl transition-all font-bold text-[14px] outline-none"
                  />
                </div>
                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Sovereign Identity"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-black/5 focus:border-black focus:bg-white rounded-xl transition-all font-bold text-[14px] outline-none"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-black/5 focus:border-black focus:bg-white rounded-xl transition-all font-bold text-[14px] outline-none"
                  />
                </div>
                {error && (
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center py-2">{error}</p>
                )}
                <button 
                  disabled={loading}
                  className="w-full py-5 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all font-black uppercase tracking-[0.25em] text-[11px] shadow-lg shadow-black/10 active:scale-[0.98] mt-6 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="size-4" /> : (authMode === "signup" ? "Join Waitlist" : "Verify Status")}
                </button>
              </form>

              <div className="mt-10 pt-10 border-t border-black/5 text-center">
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
                  {authMode === "signup" ? "Already registered?" : "New candidate?"}{" "}
                  <button 
                    onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                    className="text-black hover:underline underline-offset-8 ml-2"
                  >
                    {authMode === "signup" ? "Sign in" : "Create Account"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

function MockupSection() {
  return (
    <div className="absolute right-0 bottom-0 w-[75%] h-[95%] pointer-events-none z-10 hidden md:flex items-end justify-end translate-x-[20%] translate-y-[12%]">
      <div className="w-full aspect-[16/10.4] bg-[#1B222E] rounded-t-[20px] xl:rounded-t-[28px] p-[1px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] relative flex flex-col border-t border-x border-white/10">
        <div className="absolute inset-0 rounded-t-[20px] xl:rounded-t-[28px] border-t border-white/5 pointer-events-none"></div>
        <div className="flex-1 bg-[#0A0A0A] rounded-t-[16px] xl:rounded-t-[22px] overflow-hidden border-t-[8px] border-x-[8px] lg:border-t-[10px] lg:border-x-[10px] xl:border-t-[12px] xl:border-x-[12px] border-[#0A0A0A] relative flex flex-col">
          <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-[160px] h-[30px] bg-[#0A0A0A] rounded-b-[12px] z-[60] flex items-center justify-center border-b border-black/20">
            <div className="w-2 h-2 rounded-full bg-[#1A1A1A] mr-2 flex items-center justify-center">
               <div className="w-1.5 h-1.5 rounded-full bg-[#0F172A] shadow-inner"></div>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#1A1A1A] opacity-40"></div>
          </div>
          <div className="flex-1 bg-white rounded-t-[10px] xl:rounded-t-[14px] overflow-hidden relative shadow-inner">
             <Image 
               src="/dashboard.png" 
               alt="Ater Dashboard" 
               fill 
               className="object-cover"
             />
          </div>
        </div>
        <div className="h-8 bg-[#1B222E] w-full shrink-0 relative flex items-start justify-center">
           <div className="w-24 h-4 bg-[#0A0A0A]/40 rounded-b-2xl blur-[1px]"></div>
           <div className="absolute top-0 w-24 h-3 bg-[#111621] rounded-b-2xl shadow-inner"></div>
        </div>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
  );
}
