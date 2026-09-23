'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { checkUserAppAccess, isOwner } from '@/lib/auth/admins';
import { clearUserSessionCache } from '@/lib/sync/store';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  accessAllowed: boolean;
  status: string;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isUserOwner, setIsUserOwner] = useState<boolean>(false);
  const [accessAllowed, setAccessAllowed] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('loading');

  const resolvePermissions = useCallback(async (activeEmail: string | null | undefined) => {
    if (!activeEmail) {
      setIsAdmin(false);
      setIsUserOwner(false);
      setAccessAllowed(false);
      setStatus('unauthenticated');
      return;
    }

    try {
      const access = await checkUserAppAccess(activeEmail);
      setIsAdmin(access.isAdmin);
      setIsUserOwner(access.isOwner);
      setAccessAllowed(access.allowed);
      setStatus(access.status);
    } catch (_err) {
      const ownerCheck = isOwner(activeEmail);
      setIsAdmin(ownerCheck);
      setIsUserOwner(ownerCheck);
      setAccessAllowed(ownerCheck);
      setStatus(ownerCheck ? 'approved' : 'pending');
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user?.email) {
        await resolvePermissions(currentSession.user.email);
      } else {
        await resolvePermissions(null);
      }
    } catch (_err) {
      setUser(null);
      setSession(null);
      await resolvePermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, [resolvePermissions]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user || null);
      if (initialSession?.user?.email) {
        await resolvePermissions(initialSession.user.email);
      } else {
        await resolvePermissions(null);
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    // 2. Continuous auth state listener (auto token refresh, sign-in, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user || null);

        if (event === 'SIGNED_OUT' || !newSession) {
          await resolvePermissions(null);
          setIsLoading(false);
          return;
        }

        if (newSession?.user?.email) {
          await resolvePermissions(newSession.user.email);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [resolvePermissions]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const activeUid = user?.id;

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (_e) {}
    }

    // Clean up only the active user's local caches without touching system tokens
    clearUserSessionCache(activeUid);

    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsUserOwner(false);
    setAccessAllowed(false);
    setStatus('unauthenticated');
    setIsLoading(false);
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAdmin,
      isOwner: isUserOwner,
      accessAllowed,
      status,
      signOut,
      refreshAuth,
    }),
    [user, session, isLoading, isAdmin, isUserOwner, accessAllowed, status, signOut, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
