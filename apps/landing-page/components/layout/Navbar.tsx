"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Product", href: "/product" },
    { label: "Pricing", href: "/pricing" },
    { label: "Waitlist", href: "/waitlist" },
    { label: "Contact", href: "/contact" },
  ];

  const isAuthPage = pathname === "/auth";
  const showCenteredHeader = isAuthPage && !session;

  return (
    <header className="bg-background/80 backdrop-blur-md text-on-background border-b border-outline-variant sticky top-0 z-50 rounded-none">
      <div className={cn(
        "flex items-center w-full px-8 h-16 max-w-(--spacing-container) mx-auto",
        showCenteredHeader ? "justify-center" : "justify-between"
      )}>
        <Link href="/" className="text-2xl font-black tracking-tighter text-on-background uppercase font-inter flex items-center gap-2">
          ATER <span className="text-on-surface-variant font-bold normal-case opacity-40">አጠር</span>
        </Link>
        
        {!showCenteredHeader && (
          <>
            <nav className="hidden md:flex items-center gap-4 font-mono text-[12px] uppercase tracking-widest">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`py-2 px-4 transition-all duration-150 rounded-none border-b-2 ${
                      isActive 
                        ? "border-on-background text-on-background" 
                        : "border-transparent text-on-background/60 hover:text-on-background hover:border-outline-variant"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-surface-container transition-colors duration-150 rounded-none border border-outline-variant"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              
              <Link 
                href="/waitlist"
                className="hidden md:block bg-primary text-on-primary font-mono text-[11px] uppercase tracking-widest px-6 py-2 hover:opacity-90 transition-all duration-150 rounded-none"
              >
                JOIN WAITLIST
              </Link>

              <button className="md:hidden text-on-background rounded-none">
                <Menu className="size-6" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
