"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { IndustrialButton } from "../IndustrialButton";


export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Waitlist", href: "/waitlist" },
    { label: "Contact", href: "/contact" },
  ];

  const isAuthPage = pathname === "/auth";
  const showCenteredHeader = isAuthPage && !session;

  return (
    <header className="bg-background/80 backdrop-blur-md text-on-background border-b border-outline-variant fixed top-0 left-0 right-0 z-[100] rounded-none">
      <div className={cn(
        "flex items-center w-full px-4 md:px-8 h-16 max-w-(--spacing-container) mx-auto",
        showCenteredHeader ? "justify-center" : "justify-between"
      )}>
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-on-background uppercase font-inter flex items-center gap-2">
          ATER <span className="text-on-surface-variant font-bold normal-case opacity-40">አጠር</span>
        </Link>
        
        {!showCenteredHeader && (
          <>
            <nav className="hidden lg:flex items-center gap-4 font-mono text-[12px] uppercase tracking-widest">
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

            <div className="flex items-center gap-2 md:gap-4">
              <IndustrialButton
                onClick={toggleTheme}
                size="icon"
                aria-label="Toggle theme"
                className="size-10 md:size-11"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </IndustrialButton>
              
              <IndustrialButton 
                href="/auth"
                size="sm"
                className="hidden sm:flex h-10 md:h-11 px-6"
              >
                SIGN IN
              </IndustrialButton>

              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-on-background p-2 rounded-none hover:bg-surface transition-colors"
              >
                <Menu className="size-6" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background z-[99] flex flex-col p-8 border-t border-outline-variant animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "p-4 technical-label text-sm border border-outline-variant transition-colors",
                    isActive ? "bg-primary text-background" : "bg-surface hover:bg-outline-variant/10"
                  )}
                >
                  {link.label.toUpperCase()}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto pt-8 border-t border-outline-variant flex flex-col gap-4">
            <IndustrialButton 
              href="/auth"
              className="w-full h-14"
            >
              SIGN IN
            </IndustrialButton>
            <p className="technical-label opacity-30 text-[10px] text-center">
              ATER V0.1.0-BETA
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
