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
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronous route change detection to prevent flashing
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsLoading(true);
  }

  useEffect(() => {
    // On mount or when isLoading becomes true, set a timer to stop loading
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700); // Aesthetic duration
      return () => clearTimeout(timer);
    }
  }, [isLoading, pathname]);

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
