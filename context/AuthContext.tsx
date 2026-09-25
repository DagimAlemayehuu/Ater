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
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
  signInWithDevPass: (email?: string) => Promise<void>;
}

function createDevUser(email: string): User {
  const cleanEmail = email.trim().toLowerCase();
  const id = 'dev-user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-');
  return {
    id,
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: {
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      name: cleanEmail.split('@')[0],
      avatar_url: '',
    },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email: cleanEmail,
    email_confirmed_at: new Date().toISOString(),
    is_anonymous: false,
    last_sign_in_at: new Date().toISOString(),
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };
}

function createDevSession(user: User): Session {
  return {
    access_token: 'dev-token-' + user.id,
    token_type: 'bearer',
    expires_in: 3600 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    refresh_token: 'dev-refresh-' + user.id,
    user,
  };
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
      const accessPromise = checkUserAppAccess(activeEmail);
      const timeoutPromise = new Promise<{ allowed: boolean; isAdmin: boolean; isOwner: boolean; status: string }>(
        (_, reject) => setTimeout(() => reject(new Error('Permission check timeout')), 1500)
      );

      const access = await Promise.race([accessPromise, timeoutPromise]);
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
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>(
        (_, reject) => setTimeout(() => reject(new Error('Session timeout')), 1500)
      );
      const { data: { session: currentSession } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

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

    // Safety timeout: never leave the app stuck in loading state for more than 1.5 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1500);

    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user || null);
        if (initialSession.user?.email) {
          await resolvePermissions(initialSession.user.email);
        } else {
          await resolvePermissions(null);
        }
      } else if (typeof window !== 'undefined') {
        try {
          const storedDev = localStorage.getItem('ater_dev_user');
          if (storedDev) {
            const parsedUser = JSON.parse(storedDev) as User;
            const parsedSession = createDevSession(parsedUser);
            setUser(parsedUser);
            setSession(parsedSession);
            await resolvePermissions(parsedUser.email);
          }
        } catch (_e) {}
      }
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) {
        clearTimeout(safetyTimeout);
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
      clearTimeout(safetyTimeout);
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

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ater_dev_user');
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

  const signInWithDevPass = useCallback(async (targetEmail = 'dagimalemayehuu@gmail.com') => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const devUser = createDevUser(cleanEmail);
    const devSession = createDevSession(devUser);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ater_dev_user', JSON.stringify(devUser));
      } catch (_e) {}
    }

    setUser(devUser);
    setSession(devSession);
    await resolvePermissions(cleanEmail);
    setIsLoading(false);
  }, [resolvePermissions]);

  const signInWithGoogle = useCallback(async (redirectTo?: string): Promise<{ error: Error | null }> => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: new Error('Supabase client unavailable') };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo || window.location.pathname)}`
        : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error: error as Error };
      }

      if (!data?.url) {
        return { error: new Error('Failed to generate Google OAuth URL') };
      }

      // Pre-check if Google provider is enabled in Supabase to avoid crashing the browser into raw JSON 400 error
      const checkRes = await fetch('/api/auth/google/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url }),
      });

      const checkData = await checkRes.json().catch(() => ({}));
      if (!checkRes.ok || checkData.enabled === false) {
        return {
          error: new Error(
            checkData.error || 'Unsupported provider: provider is not enabled'
          ),
        };
      }

      if (typeof window !== 'undefined') {
        window.location.assign(data.url);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  }, []);

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
      signInWithGoogle,
      signInWithDevPass,
    }),
    [user, session, isLoading, isAdmin, isUserOwner, accessAllowed, status, signOut, refreshAuth, signInWithGoogle, signInWithDevPass]
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
