'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2, Copy, Check, ArrowLeft, LogOut, CheckCircle2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

function AuthContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const { isAmharic } = useLanguage();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'loading' | 'auth' | 'dashboard'>('loading');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setView('auth');
      return;
    }

    async function fetchUserStatus(userEmail: string) {
      try {
        const { data } = await supabase!
          .from('waitlist')
          .select('*')
          .eq('contact', userEmail)
          .maybeSingle();

        if (!data) {
          const { data: newProfile } = await supabase!
            .from('waitlist')
            .insert([{ contact: userEmail }])
            .select()
            .maybeSingle();

          if (newProfile) {
            setUserStatus(newProfile);
            setView('dashboard');
            return;
          }
        }

        setUserStatus(data || { contact: userEmail, status: 'pending' });
        setView('dashboard');
      } catch {
        setView('dashboard');
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserStatus(session.user.email!);
      } else {
        setView('auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchUserStatus(session.user.email!);
      } else {
        setUser(null);
        setUserStatus(null);
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(isAmharic ? 'የዳታቤዝ ግንኙነት አልተገኘም።' : 'Supabase is not configured.');
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });

        if (signUpError) throw signUpError;

        await supabase.from('waitlist').insert([{ contact: email.trim() }]);

        if (!data.session) {
          // If session wasn't immediately returned, sign in directly since email confirmation is disabled
          const { data: signInData, error: autoSignInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (autoSignInError) {
            setError(autoSignInError.message);
          } else if (signInData.session) {
            setUser(signInData.session.user);
            setView('dashboard');
          }
        } else {
          setUser(data.session.user);
          setView('dashboard');
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        if (signInData.session) {
          setUser(signInData.session.user);
          setView('dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || (isAmharic ? 'ማረጋገጥ አልተቻለም። መረጃዎን ያረጋግጡ።' : 'Authentication failed. Please verify credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    const key = userStatus?.activation_code || user?.id?.substring(0, 8).toUpperCase();
    if (key) {
      navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(isAmharic ? 'የዳታቤዝ ግንኙነት አልተገኘም።' : 'Supabase is not configured.');
      setLoading(false);
      return;
    }

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || (isAmharic ? 'በጉግል መግባት አልተቻለም።' : 'Failed to authenticate with Google.'));
      setLoading(false);
    }
  };

  if (view === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh]">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{isAmharic ? 'በማረጋገጥ ላይ...' : 'Authenticating...'}</span>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    const displayName = (userStatus?.contact || user?.email || 'Student').split('@')[0];
    const isApproved = userStatus?.status === 'approved';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ወደ ዋናው ገጽ' : 'Return Home'}</span>
            </Link>
            <button
              onClick={() => {
                const supabase = getSupabaseBrowserClient();
                supabase?.auth.signOut();
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {isAmharic ? `እንኳን ደህና መጡ፣ ${displayName}።` : `Welcome, ${displayName}.`}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{isAmharic ? 'ሁኔታ፡' : 'Status:'}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  isApproved
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {isApproved
                  ? (isAmharic ? 'ተፈቅዷል' : 'Approved')
                  : (isAmharic ? 'በመጠባበቅ ላይ' : 'Waitlist Pending')}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 md:p-8 shadow-sm space-y-6">
            {isApproved ? (
              <>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {isAmharic
                    ? 'መዳረሻዎ ተፈቅዷል። የትምህርት መድረኩን ለመክፈት የመክፈቻ ቁጥርዎን ይጠቀሙ።'
                    : 'You are approved. Use your unique activation key to launch the cognitive studio.'}
                </p>

                <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>{isAmharic ? 'የመክፈቻ ቁጥር' : 'Activation Key'}</span>
                    <button onClick={copyKey} className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-2xl font-mono font-bold text-center tracking-widest text-zinc-900 dark:text-zinc-100">
                    {userStatus?.activation_code || user?.id?.substring(0, 8).toUpperCase() || '---'}
                  </div>
                </div>

                <Link
                  href="/app"
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-300 text-zinc-100 dark:text-zinc-900 font-medium text-xs flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isAmharic ? 'አተርን ጀምር' : 'Launch Ater Studio'}
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 py-6">
                <CheckCircle2 className="w-10 h-10 text-zinc-400" />
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {isAmharic ? 'በመጠባበቂያ ዝርዝር ውስጥ ተካትተዋል' : 'You are on the list'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                  {isAmharic
                    ? 'አዳዲስ ተማሪዎችን በተከታታይ እየቀበልን ነው። መዳረሻዎ እንደተከፈተ ኢሜይል ይደርስዎታል።'
                    : 'We are inviting new students and learners regularly. You will receive an email as soon as your access is opened.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isAmharic ? 'ወደ ዋናው ገጽ' : 'Return Home'}</span>
        </Link>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {authMode === 'signup'
              ? (isAmharic ? 'ይመዝገቡ' : 'Join the Waitlist')
              : (isAmharic ? 'ግባ' : 'Sign In')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {authMode === 'signup'
              ? (isAmharic ? 'ቦታዎን ለመያዝ መለያ ይፍጠሩ።' : 'Create an account to reserve your spot.')
              : (isAmharic ? 'የመለያ መረጃዎን ያስገቡ።' : 'Enter your account credentials.')}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-6 md:p-8 shadow-sm space-y-5">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-colors disabled:opacity-40 flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current text-zinc-700 dark:text-zinc-300" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isAmharic ? 'በጉግል ቀጥል' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-950 px-3 text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
              {isAmharic ? 'ወይም' : 'or'}
            </span>
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                {error}
              </div>
            )}

            {authMode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">
                  {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAmharic ? 'ዳግም ዓለማየሁ' : 'Dagim Alemayehu'}
                    required
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                  <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                {isAmharic ? 'የኢሜይል አድራሻ' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-600 dark:text-zinc-400">
                {isAmharic ? 'የይለፍ ቃል' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 pl-9 pr-3 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : authMode === 'signup' ? (
                isAmharic ? 'መለያ ፍጠር' : 'Create Account'
              ) : (
                isAmharic ? 'ግባ' : 'Sign In'
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            {authMode === 'signup' ? (
              <p className="text-xs text-zinc-500">
                {isAmharic ? 'ቀድሞውኑ መለያ አለዎት?' : 'Already registered?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                >
                  {isAmharic ? 'ግባ' : 'Sign In'}
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                {isAmharic ? 'መለያ የለዎትም?' : 'Need an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError(null);
                  }}
                  className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                >
                  {isAmharic ? 'ይመዝገቡ' : 'Join the Waitlist'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh]">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
