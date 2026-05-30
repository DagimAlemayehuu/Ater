"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingProvider, useLoading } from '@/context/LoadingContext';
import { RouteLoader } from '@/components/layout/RouteLoader';
import { cn } from '@/lib/utils';

function LandingContent({ 
  children, 
  hideFooter 
}: { 
  children: React.ReactNode; 
  hideFooter: boolean;
}) {
  const { isLoading } = useLoading();
  
  return (
    <div className="bg-background transition-colors duration-300 relative isolation-isolate z-0">
      <Navbar />
      <main 
        className={cn(
          "transition-opacity duration-500 ease-in-out",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthPage = pathname === "/auth";
  const hideFooter = isAuthPage && !session;

  return (
    <LoadingProvider>
      <RouteLoader />
      <LandingContent hideFooter={hideFooter}>
        {children}
      </LandingContent>
    </LoadingProvider>
  );
}

