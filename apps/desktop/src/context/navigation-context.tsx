import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type NavEntry = {
  type: 'route' | 'file';
  path: string;
  metadata?: any;
};

interface NavigationContextType {
  history: NavEntry[];
  currentIndex: number;
  push: (entry: NavEntry) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<NavEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const isInternalNav = useRef(false);

  // Sync internal navigation to avoid loops
  const push = useCallback((entry: NavEntry) => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    setHistory(prev => {
      // Don't push duplicate consecutive entries
      const last = prev[currentIndex];
      if (last && last.type === entry.type && last.path === entry.path) {
        return prev;
      }

      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(entry);
      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      const prevEntry = history[currentIndex - 1];
      isInternalNav.current = true;
      setCurrentIndex(currentIndex - 1);
      
      if (prevEntry.type === 'route') {
        navigate(prevEntry.path);
      } else {
        // If it's a file, we might already be on /obsidian, 
        // but we need to trigger the file selection in obsidian.tsx
        if (location.pathname !== '/obsidian' && !location.pathname.startsWith('/note/')) {
          navigate('/obsidian');
        }
      }
    }
  }, [currentIndex, history, navigate, location.pathname]);

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextEntry = history[currentIndex + 1];
      isInternalNav.current = true;
      setCurrentIndex(currentIndex + 1);
      
      if (nextEntry.type === 'route') {
        navigate(nextEntry.path);
      } else {
        if (location.pathname !== '/obsidian' && !location.pathname.startsWith('/note/')) {
          navigate('/obsidian');
        }
      }
    }
  }, [currentIndex, history, navigate, location.pathname]);

  // Track global route changes (excluding obsidian internal file changes which are pushed manually)
  useEffect(() => {
    // We only push routes if they aren't /obsidian (which handles its own file history)
    // or if they are basic route transitions
    if (!location.pathname.startsWith('/obsidian') && !location.pathname.startsWith('/note/')) {
       push({ type: 'route', path: location.pathname + location.search });
    }
  }, [location.pathname, location.search, push]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  return (
    <NavigationContext.Provider value={{ 
      history, 
      currentIndex, 
      push, 
      goBack, 
      goForward, 
      canGoBack, 
      canGoForward 
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
