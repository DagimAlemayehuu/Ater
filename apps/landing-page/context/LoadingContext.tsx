"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const prevPathname = React.useRef(pathname);

  // Route transition detection
  useEffect(() => {
    // Prevent flickering: only trigger loading when path actually changes
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700); // 700ms represents the perfect aesthetic duration for the minimal loader
      return () => clearTimeout(timer);
    } else {
      // If it's the initial hydration mount, clear loading after the same period
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
