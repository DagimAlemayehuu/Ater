"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login") {
      router.replace("/");
    }
  }, [pathname, router]);

  if (pathname === "/login") {
    return null;
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
