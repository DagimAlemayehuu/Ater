"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
  Clipboard, 
  ClipboardCheck, 
  Download,
  Github,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

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
    const { data } = await supabase
      .from('waiting_list')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();
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
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (authError) throw authError;
        const { data: existing } = await supabase.from('waiting_list').select('id').eq('email', email).maybeSingle();
        if (!existing) {
          await supabase.from('waiting_list').insert([{ email, full_name: fullName, status: 'pending' }]);
        }
        if (authData.user) fetchUserStatus(authData.user.email!);
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
    <div className="h-screen bg-background text-foreground overflow-hidden flex flex-col relative selection:bg-primary selection:text-primary-foreground font-sans">
      <nav className="flex items-center justify-between px-6 lg:px-12 py-6 w-full relative z-50 shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setView("hero")}>
          <span className="font-black text-xl tracking-tighter uppercase">Ater <span className="text-muted-foreground ml-1 font-bold">አጠር</span></span>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <button onClick={toggleTheme} className="p-2 hover:bg-accent border border-border">
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
          <button 
            onClick={() => { setView("auth"); setAuthMode("login"); }}
            className="px-6 py-2 bg-primary text-primary-foreground font-black h-10 uppercase text-[11px] tracking-widest hover:opacity-90"
          >
            Sign In
          </button>
        </div>
      </nav>

      {view === "hero" ? (
        <main className="flex-1 w-full px-6 lg:px-12 flex flex-col justify-center relative z-20">
          <div className="max-w-[1400px] w-full mx-auto relative h-full flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-[2.75rem] sm:text-[4rem] lg:text-[5rem] leading-[0.95] font-black tracking-tighter text-foreground max-w-[720px] mb-8 uppercase">
                Learn faster. <br className="hidden sm:block" /> Score better.
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-[440px] leading-relaxed font-bold mb-12 uppercase tracking-tight">
                Ater turns your PDFs into simple notes. It organizes your work in one clean place. Study less, get better grades.
              </p>
            </div>
            <div className="pb-12 flex flex-col gap-6">
              <button 
                onClick={() => setView("auth")}
                className="flex items-center justify-center border border-border bg-accent/30 gap-3 px-10 py-5 w-full max-w-[320px] text-foreground font-black text-[12px] uppercase tracking-[0.2em] hover:bg-accent transition-none shadow-sm"
              >
                <span>Join Waitlist</span>
              </button>
            </div>
            <MockupSection />
          </div>
        </main>
      ) : view === "dashboard" ? (
        <main className="flex-1 w-full flex flex-col items-center justify-center bg-background relative z-20">
          <div className="max-w-[500px] w-full px-6 text-center">
            <div className="mb-10">
              <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground">Hey, {userStatus?.full_name?.split(' ')[0] || 'User'}</h2>
              <p className="text-muted-foreground font-bold uppercase tracking-widest mt-2 text-[12px]">Check your status below.</p>
            </div>
            <div className="p-10 border border-border bg-card relative overflow-hidden shadow-sm">
               <div className="relative z-10 text-left">
                 <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Status</div>
                 <div className="flex items-center justify-start gap-3">
                    <div className={cn("size-3", userStatus?.status === 'approved' ? "bg-primary" : userStatus?.status === 'rejected' ? "bg-destructive" : "bg-muted")} />
                    <span className="text-2xl font-black uppercase tracking-tighter text-foreground">
                      {userStatus?.status === 'approved' ? "Approved" : userStatus?.status === 'rejected' ? "Rejected" : "Pending"}
                    </span>
                 </div>
                 <p className="text-muted-foreground text-[13px] font-bold mt-6 leading-relaxed uppercase tracking-tight">
                    {userStatus?.status === 'approved' ? "Your account is approved. Use the code to activate Ater Desktop." : userStatus?.status === 'rejected' ? "Your account was not approved." : "Your account is pending. We will give you a code once approved."}
                 </p>
                 {userStatus?.status === 'approved' && userStatus?.activation_code && (
                    <div className="mt-8 p-6 bg-background border border-border relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-3">
                        <button onClick={() => copyToClipboard(userStatus.activation_code)} className="p-2 hover:bg-accent">
                          {copied ? <ClipboardCheck className="size-4 text-foreground" /> : <Clipboard className="size-4 text-muted-foreground" />}
                        </button>
                      </div>
                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Activation Code</div>
                      <div className="text-3xl font-mono font-black text-foreground tracking-[0.3em]">{userStatus.activation_code}</div>
                      {copied && (
                        <div className="absolute inset-0 bg-background/95 flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Copied</span>
                        </div>
                      )}
                    </div>
                 )}
                 {userStatus?.status === 'approved' && (
                    <div className="mt-6">
                       <a href="/download" className="w-full py-4 bg-primary text-primary-foreground flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] hover:opacity-90">
                        Download <Download className="size-4" />
                       </a>
                    </div>
                 )}
               </div>
               <div className="absolute -bottom-4 -right-4 text-[120px] font-black text-foreground/5 select-none pointer-events-none tracking-tighter">
                 {userStatus?.status === 'approved' ? "GO" : userStatus?.status === 'rejected' ? "NO" : "WAIT"}
               </div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); setUserStatus(null); setView("hero"); }} className="mt-12 text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-[0.3em]">Sign Out</button>
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full flex flex-col items-center justify-center bg-background relative z-20">
          <div className="max-w-[400px] w-full px-6">
            <button onClick={() => setView("hero")} className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-10 text-[10px] font-black uppercase tracking-widest">← Back</button>
            <div className="w-full">
              <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase text-foreground">{authMode === "signup" ? "Join Waitlist" : "Sign In"}</h2>
              <p className="text-muted-foreground font-bold mb-10 text-[12px] uppercase tracking-widest">{authMode === "signup" ? "Get early access." : "Check your status."}</p>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                  <input type="email" placeholder="user@ater.ai" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-card border border-border focus:border-primary focus:bg-background font-bold text-[14px] outline-none transition-none text-foreground uppercase tracking-tight" />
                </div>
                {authMode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                    <input type="text" placeholder="Your Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-5 py-4 bg-card border border-border focus:border-primary focus:bg-background font-bold text-[14px] outline-none transition-none text-foreground uppercase tracking-tight" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                  <input type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-card border border-border focus:border-primary focus:bg-background font-bold text-[14px] outline-none transition-none text-foreground" />
                </div>
                {error && <p className="text-[10px] font-black text-destructive uppercase tracking-widest text-center py-2">{error}</p>}
                <button disabled={loading} className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-[0.25em] text-[11px] mt-6 disabled:opacity-50 flex items-center justify-center gap-3 transition-none">
                  {loading ? "Processing..." : (authMode === "signup" ? "Join Waitlist" : "Sign In")}
                </button>
              </form>
              <div className="mt-10 pt-10 border-t border-border text-center">
                <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                  {authMode === "signup" ? "Registered?" : "New?"}{" "}
                  <button onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} className="text-foreground hover:underline underline-offset-8 ml-2 uppercase font-black">{authMode === "signup" ? "Sign In" : "Create Account"}</button>
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
    <div className="absolute right-0 bottom-0 w-[75%] h-[95%] pointer-events-none z-10 hidden md:flex items-end justify-end translate-x-[30%] translate-y-[12%]">
      <div className="w-full aspect-[16/10.4] bg-[#1A1A1A] rounded-t-[24px] xl:rounded-t-[32px] p-[1px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative flex flex-col border-t border-x border-white/5">
        {/* Device Frame / Bezel - Dark Gray, not Pure Black */}
        <div className="flex-1 bg-[#121212] rounded-t-[20px] xl:rounded-t-[26px] overflow-hidden border-t-[10px] border-x-[10px] lg:border-t-[12px] lg:border-x-[12px] xl:border-t-[14px] xl:border-x-[14px] border-[#121212] relative flex flex-col">
          
          {/* Perfect Mac Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20%] h-[26px] bg-[#121212] rounded-b-[14px] z-20 flex items-center justify-center">
            <div className="size-1.5 rounded-full bg-[#1A1A1A] border border-white/5 shadow-inner" />
          </div>
          
          <div className="flex-1 bg-background rounded-t-[8px] xl:rounded-t-[12px] overflow-hidden relative shadow-inner border-t border-white/5">
             <Image src="/dashboard.png" alt="Ater Dashboard" fill className="object-cover" priority />
          </div>
        </div>
      </div>
    </div>
  );
}
