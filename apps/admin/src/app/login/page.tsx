"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated and redirect
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "Admin") {
          router.push("/");
        }
      }
    };
    checkUser();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Invalid credentials.");
      }

      // Check role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Unable to verify user profile.");
      }

      if (profile.role !== "Admin") {
        await supabase.auth.signOut();
        throw new Error("Insufficient security clearance. Administrators only.");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070708] relative overflow-hidden font-sans p-6">
      {/* Premium High-Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] border border-border/80 p-12 bg-[#0d0d0f]/90 backdrop-blur-md relative z-10 space-y-8 shadow-2xl">
        <div className="space-y-3 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary bg-primary/10 px-3 py-1 border border-primary/20">
            Ater Core Control
          </span>
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-foreground pt-3">
            Admin Portal
          </h2>
          <div className="h-[2px] w-12 bg-primary mx-auto" />
        </div>

        {error && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive text-[11px] font-bold uppercase tracking-[0.1em] text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground block">
              Console ID / Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#121215] border border-border/85 px-4 py-3 text-[12px] font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
              placeholder="admin@ater.ai"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground block">
              Secure Key / Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#121215] border border-border/85 px-4 py-3 text-[12px] font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground border border-primary text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Establish Connection"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            Authorized node access only.<br />All sessions are monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
