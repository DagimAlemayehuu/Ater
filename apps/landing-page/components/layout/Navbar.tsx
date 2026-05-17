"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Menu, X, ChevronRight } from "lucide-react";
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
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
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
    <>
      <header className="bg-background text-on-background border-b border-outline-variant fixed top-0 left-0 right-0 z-[100] rounded-none">
        <div className={cn(
          "flex items-center w-full px-4 md:px-8 h-16 max-w-(--spacing-container) mx-auto",
          showCenteredHeader ? "justify-center" : "justify-between"
        )}>
          <Link 
            href="/" 
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="text-xl md:text-2xl font-black tracking-tighter text-on-background uppercase font-inter flex items-center gap-2"
          >
            ATER <span className="text-on-surface-variant font-bold normal-case opacity-40">አጠር</span>
          </Link>
          
          {!showCenteredHeader && (
            <>
              <nav className="hidden lg:flex items-center gap-4 font-mono text-[12px] uppercase tracking-widest">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.label === "Features" && pathname.startsWith("/features"));
                  return (
                     <Link
                       key={link.label}
                       href={link.href}
                       onClick={(e) => {
                         if (link.href === '/' && pathname === '/') {
                           e.preventDefault();
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                         }
                       }}
                       className={`py-2 px-4 transition-all duration-150 rounded-none border-b-2 ${
                         isActive 
                           ? "border-on-background text-on-background" 
                           : "border-transparent text-on-surface-variant hover:text-on-background hover:border-outline-variant"
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
                  className="size-10 md:size-11 border-none hover:bg-surface-container"
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
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                  className="lg:hidden text-on-background p-3 rounded-none hover:bg-surface transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Menu className="size-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="lg:hidden fixed inset-0 bg-background grid-background z-[200] flex flex-col animate-in fade-in duration-300">
          {/* Mobile Header Inside Menu */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-outline-variant bg-background">
            <Link 
              href="/" 
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                setMobileMenuOpen(false);
              }} 
              className="text-xl font-black tracking-tighter uppercase font-inter text-on-background"
            >
              ATER
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="p-3 rounded-none hover:bg-surface transition-colors text-on-background min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="size-6" />
            </button>
          </div>
          <div className="flex-1 flex flex-col p-6 gap-2 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.label === "Features" && pathname.startsWith("/features"));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if (link.href === '/' && pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "p-5 font-mono text-sm uppercase tracking-widest border transition-all flex items-center justify-between group",
                    isActive 
                      ? "bg-surface-container text-on-background font-bold border-on-background" 
                      : "bg-surface text-on-surface hover:bg-surface-container border-outline-variant"
                  )}
                >
                  <span>{link.label}</span>
                  <ChevronRight className={cn(
                    "size-5 transition-all",
                    isActive ? "text-on-background opacity-100" : "text-on-surface opacity-20 group-hover:opacity-100 group-hover:translate-x-1"
                  )} />
                </Link>
              );
            })}
          </div>
          
          <div className="p-6 border-t border-outline-variant flex flex-col gap-4 bg-surface">
            <IndustrialButton 
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-14"
            >
              SIGN IN
            </IndustrialButton>
            <div className="flex justify-between items-center px-2">
              <p className="font-mono uppercase text-[10px] tracking-widest opacity-40 text-on-surface">
                BETA
              </p>
              <p className="font-mono uppercase text-[10px] tracking-widest opacity-40 text-on-surface">
                EST. 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}