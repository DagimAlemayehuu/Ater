"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (pathname !== "/login") {
          router.push("/login");
        }
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || !profile || !["Admin", "Developer", "admin", "developer"].includes(profile.role)) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
      setLoading(false);
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAuthorized(false);
        router.push("/login");
      } else if (event === "SIGNED_IN") {
        checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Allow the login page to render its own content without layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Verifying Credentials
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-bento-card border border-border/40 rounded-[12px] p-8 text-center space-y-6">
          <div className="size-16 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="size-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
              Access Restricted
            </h2>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2 leading-relaxed">
              Your account does not have the required permissions to access the management console.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full py-3 bg-bento-item border border-border/40 text-[9px] font-black uppercase tracking-[0.2em] text-foreground hover:bg-bento-panel transition-all flex items-center justify-center gap-2 rounded-[8px]"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="size-3.5" />
              Return to Base
            </button>
          </div>
        </div>
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
