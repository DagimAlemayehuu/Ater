"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingProvider } from '@/context/LoadingContext';
import { RouteLoader } from '@/components/layout/RouteLoader';

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
    <LoadingProvider>
      <RouteLoader />
      <div className="bg-background transition-colors duration-300 relative isolation-isolate z-0">
        <Navbar />
        {children}
        {!hideFooter && <Footer />}
      </div>
    </LoadingProvider>
  );
}

