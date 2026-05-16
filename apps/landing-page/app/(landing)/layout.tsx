"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const isAuthPage = pathname === "/auth";
  const hideFooter = isAuthPage && !session;

  return (
    <div className="flex flex-col min-h-screen relative bg-background transition-colors duration-300">
      {/* Global Squared Background Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, var(--grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)', 
          backgroundSize: '40px 40px'
        }}
      ></div>

      <Navbar />
      <main className="flex-1 relative z-10">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
