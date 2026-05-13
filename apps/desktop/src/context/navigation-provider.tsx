import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation, NavigationType, useNavigationType } from 'react-router-dom';
import { NavigationContext, NavigationState, NavEntry } from './navigation-context';

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavigationState>({ history: [], currentIndex: -1 });
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const isInternalNav = useRef(false);

  const push = useCallback((entry: NavEntry, replace: boolean = false) => {
    setState(prev => {
      // Clear internal flag on manual push
      isInternalNav.current = false;

      const last = prev.history[prev.currentIndex];
      // Don't push duplicate consecutive entries unless replacing
      if (!replace && last && last.type === entry.type && last.path === entry.path) {
        return prev;
      }

      let newHistory;
      let newIndex;

      if (replace && prev.currentIndex >= 0) {
        newHistory = [...prev.history];
        newHistory[prev.currentIndex] = entry;
        newIndex = prev.currentIndex;
      } else {
        // Standard push: discard future and append
        newHistory = prev.history.slice(0, prev.currentIndex + 1);
        newHistory.push(entry);
        newIndex = newHistory.length - 1;
      }
      
      return {
        history: newHistory,
        currentIndex: newIndex
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex <= 0) return prev;
      
      const newIndex = prev.currentIndex - 1;
      const prevEntry = prev.history[newIndex];
      isInternalNav.current = true;
      
      if (prevEntry.type === 'route') {
        navigate(prevEntry.path);
      } else {
        // Build Obsidian URL for file entries
        const searchParams = new URLSearchParams();
        searchParams.set('path', prevEntry.path);
        if (prevEntry.metadata?.page) {
          searchParams.set('page', prevEntry.metadata.page.toString());
        }
        if (prevEntry.metadata?.filterPages?.length > 0) {
          searchParams.set('filterPages', prevEntry.metadata.filterPages.join(','));
        }
        navigate(`/obsidian?${searchParams.toString()}`);
      }
      
      return { ...prev, currentIndex: newIndex };
    });
  }, [navigate]);

  const goForward = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex >= prev.history.length - 1) return prev;
      
      const newIndex = prev.currentIndex + 1;
      const nextEntry = prev.history[newIndex];
      isInternalNav.current = true;
      
      if (nextEntry.type === 'route') {
        navigate(nextEntry.path);
      } else {
        // Build Obsidian URL for file entries
        const searchParams = new URLSearchParams();
        searchParams.set('path', nextEntry.path);
        if (nextEntry.metadata?.page) {
          searchParams.set('page', nextEntry.metadata.page.toString());
        }
        if (nextEntry.metadata?.filterPages?.length > 0) {
          searchParams.set('filterPages', nextEntry.metadata.filterPages.join(','));
        }
        navigate(`/obsidian?${searchParams.toString()}`);
      }
      
      return { ...prev, currentIndex: newIndex };
    });
  }, [navigate]);

  // Handle Browser Back/Forward (POP)
  useEffect(() => {
    if (navType === NavigationType.Pop) {
      const currentPath = location.pathname + location.search;
      
      setState(prev => {
        // 1. Check if we just moved to a neighbor in history (most likely)
        if (prev.currentIndex > 0 && prev.history[prev.currentIndex - 1].path === currentPath) {
          return { ...prev, currentIndex: prev.currentIndex - 1 };
        }
        if (prev.currentIndex < prev.history.length - 1 && prev.history[prev.currentIndex + 1].path === currentPath) {
          return { ...prev, currentIndex: prev.currentIndex + 1 };
        }
        
        // 2. Otherwise search entire history for the last occurrence of this path
        const foundIndex = [...prev.history].reverse().findIndex(e => e.path === currentPath);
        if (foundIndex !== -1) {
          return { ...prev, currentIndex: prev.history.length - 1 - foundIndex };
        }
        
        return prev;
      });
    }
  }, [location.pathname, location.search, navType]);

  // Track global route changes
  useEffect(() => {
    // Only auto-push for non-note routes
    if (!location.pathname.startsWith('/note/')) {
       // We mark as internal so the push function knows to potentially skip if it came from goBack/goForward
       // However, we only want to skip the AUTO-PUSH from this effect, not manual selectFile calls.
       if (isInternalNav.current) {
         isInternalNav.current = false;
         return;
       }
       push({ type: 'route', path: location.pathname + location.search });
    }
  }, [location.pathname, location.search, push]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + [ (Back) or Cmd + ArrowLeft
      if (e.metaKey && (e.key === '[' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        goBack();
      }
      // Cmd + ] (Forward) or Cmd + ArrowRight
      if (e.metaKey && (e.key === ']' || e.key === 'ArrowRight')) {
        e.preventDefault();
        goForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward]);

  const canGoBack = state.currentIndex > 0;
  const canGoForward = state.currentIndex < state.history.length - 1;

  return (
    <NavigationContext.Provider value={{ 
      ...state,
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
