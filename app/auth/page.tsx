'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, LogOut, CheckCircle2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const redirectTo = searchParams.get('redirect') || '';
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

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setView('auth');
      return;
    }

    async function checkUser(userEmail: string) {
      // If a destination was requested (e.g. /admin), navigate there immediately
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      try {
        // Query waiting_list (or waitlist)
        let { data } = await supabase!
          .from('waiting_list')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (!data) {
          const res = await supabase!
            .from('waitlist')
            .select('*')
            .eq('contact', userEmail)
            .maybeSingle();
          data = res.data;
        }

        setUserStatus(data || { email: userEmail, status: 'approved' });
        setView('dashboard');
      } catch {
        setUserStatus({ email: userEmail, status: 'approved' });
        setView('dashboard');
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        checkUser(session.user.email!);
      } else {
        setView('auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        checkUser(session.user.email!);
      } else {
        setUser(null);
        setUserStatus(null);
        setView('auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(isAmharic ? 'የዳታቤዝ ግንኙነት አልተሳካም።' : 'Database connection not available.');
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error(isAmharic ? 'መመዝገብ አልተቻለም።' : 'Sign up failed.');

        // Insert into waiting_list
        try {
          await supabase.from('waiting_list').insert([
            { email: email.trim(), full_name: fullName.trim() || null },
          ]);
        } catch (_ignore) {}

        if (!data.session) {
          const { data: signInData, error: autoSignInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (autoSignInError) {
            setError(autoSignInError.message);
          } else if (signInData.session) {
            setUser(signInData.session.user);
            if (redirectTo) {
              router.push(redirectTo);
            } else {
              setView('dashboard');
            }
          }
        } else {
          setUser(data.session.user);
          if (redirectTo) {
            router.push(redirectTo);
          } else {
            setView('dashboard');
          }
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        if (signInData.session) {
          setUser(signInData.session.user);
          if (redirectTo) {
            router.push(redirectTo);
          } else {
            setView('dashboard');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || (isAmharic ? 'ማረጋገጥ አልተቻለም። መረጃዎን ያረጋግጡ።' : 'Authentication failed. Please verify credentials.'));
    } finally {
      setLoading(false);
    }
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Dashboard View for Logged-In User
  if (view === 'dashboard' && user) {
    const displayName = (user?.user_metadata?.full_name || user?.email || 'Learner').split('@')[0];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
        <div className="w-full max-w-md space-y-6">
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

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-6 sm:p-8 space-y-5 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isAmharic ? `እንኳን ደህና መጡ፣ ${displayName}` : `Welcome, ${displayName}`}
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                {user.email}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-600 dark:text-zinc-400 space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">{isAmharic ? 'ሁኔታ' : 'Access Status'}</span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                  {userStatus?.status || 'Alpha Waitlist'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
                {isAmharic
                  ? 'የቅድመ-መዳረሻ ዝርዝር ውስጥ ተመዝግበዋል። የተሟላው መድረክ ሲለቀቅ መልእክት ይደርስዎታል።'
                  : 'You are enrolled in early access. The core learning runtime is currently in closed alpha.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {user.email === 'dagimalemayehuu@gmail.com' && (
                <Link
                  href="/admin"
                  className="w-full py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-medium transition-colors text-center cursor-pointer"
                >
                  Open Admin Dashboard
                </Link>
              )}
              <Link
                href="/"
                className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 text-xs font-medium transition-colors text-center cursor-pointer"
              >
                {isAmharic ? 'ወደ መነሻ ገጽ ተመለስ' : 'Back to Home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'ወደ ዋናው ገጽ' : 'Return Home'}</span>
          </Link>

          <Link
            href="/"
            className="text-lg font-black tracking-tighter uppercase font-sans text-zinc-900 dark:text-zinc-100 flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span>ATER</span>
            <span className="text-lg font-black opacity-60">አጠር</span>
          </Link>
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {authMode === 'login'
              ? (isAmharic ? 'ይግቡ' : 'Sign in to Ater')
              : (isAmharic ? 'ይመዝገቡ' : 'Join the Alpha Waitlist')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {authMode === 'login'
              ? (isAmharic ? 'የመለያዎን መረጃ ያስገቡ' : 'Enter your email and password')
              : (isAmharic ? 'የመጀመሪያውን ስሪት ቀድመው ይሞክሩ' : 'Reserve your spot for the cognitive studio')}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dagim Alemayehu"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 pl-9 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <User className="w-3.5 h-3.5 absolute left-3 top-3.5 text-zinc-400" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {isAmharic ? 'ኢሜይል' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 pl-9 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3.5 text-zinc-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {isAmharic ? 'የይለፍ ቃል' : 'Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-2.5 pl-9 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <Lock className="w-3.5 h-3.5 absolute left-3 top-3.5 text-zinc-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>
                {authMode === 'login'
                  ? (isAmharic ? 'ግባ' : 'Sign In')
                  : (isAmharic ? 'ይመዝገቡ' : 'Join Waitlist')}
              </span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            {authMode === 'login'
              ? (isAmharic ? 'መለያ የለዎትም? ይመዝገቡ' : "Don't have an account? Sign up")
              : (isAmharic ? 'መለያ አለዎት? ይግቡ' : 'Already have an account? Sign in')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
