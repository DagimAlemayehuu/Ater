"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && pathname !== "/login") {
        router.replace("/login");
      } else if (user && pathname === "/login") {
        router.replace("/");
      }
      
      setAuthenticated(!!user);
      setLoading(false);
    };

    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthenticated(!!session?.user);
        if (!session?.user && pathname !== "/login") {
          router.replace("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Allow the login page to render its own content without layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show nothing while checking initial auth to prevent layout flash
  if (loading && !authenticated) {
    return <div className="h-screen w-screen bg-background" />;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      <Header />
      <div className="flex-1 flex overflow-hidden min-w-0">
        <Sidebar />
        <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
