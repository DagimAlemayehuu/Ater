"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabase";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      // Allow bypass in non-production environments for testing/dev
      const isBypass = typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('bypass') === 'true' ||
         window.location.hash.includes('bypass=true'));

      if (isBypass && process.env.NODE_ENV !== 'production') {
        setIsAuthorized(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthorized(false);
        return;
      }

      // Verify Admin role in the database
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || profile?.role !== "Admin") {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }

    checkAuth();
  }, []);

  // Allow the login page to render its own content without layout if it's still accessed
  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (isAuthorized === false) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground font-sans p-6 text-center">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Access Restricted</h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-xs">
          This console is restricted to authorized administrators only.
        </p>
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 border border-border bg-card hover:bg-accent text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Return to Login
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="px-6 py-2 border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="size-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden p-3 gap-3 font-mono selection:bg-foreground selection:text-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative gap-3">
        <Header />
        <div className="flex-1 overflow-hidden relative bg-bento-panel border border-border/40 rounded-[12px] shadow-sm flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
