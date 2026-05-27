"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Allow the login page to render its own content without layout if it's still accessed
  if (pathname === "/login") {
    return <>{children}</>;
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
