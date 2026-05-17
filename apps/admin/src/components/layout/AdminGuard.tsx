"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !profile || profile.role !== "Admin") {
          console.warn("[AdminGuard] Access Denied: User role is not Admin.");
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error("[AdminGuard] Exception during authorization:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#070708] text-foreground relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        <div className="relative z-10 text-center space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary bg-primary/10 px-3 py-1 border border-primary/20 animate-pulse">
            Security Scan
          </span>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground pt-2">
            Verifying Clearance Level...
          </p>
        </div>
      </div>
    );
  }

  // Login page bypasses administrative layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!authorized) {
    return null; // Prevents flashing protected content before redirect completes
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
