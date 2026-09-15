'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error('Supabase client is not configured.');
      }

      // Create account / Sign up
      const { error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
        },
      });

      if (authError) {
        console.warn('Auth signup notice:', authError.message);
      }

      // Also record in waitlist table
      await supabase.from('waitlist').insert([{ contact: cleanEmail }]);

      setStatus('success');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Unable to join waitlist. Please try again.');
    }
  };

  return (
    <section id="waitlist" className="w-full max-w-xl mx-auto px-4 py-16 text-center scroll-mt-20">
      <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg p-6 sm:p-8 transition-colors">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Join the Waitlist
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-6 font-normal">
          Create an account to reserve your spot. We are rolling out access in batches.
        </p>

        {status === 'success' ? (
          <div className="p-4 bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-300 dark:border-zinc-800 rounded-md flex items-center justify-center space-x-2 text-zinc-800 dark:text-zinc-200 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
            <span>You are on the waitlist. We will notify you when your account is active.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === 'loading'}
                  required
                  className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 rounded-md pl-9 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors font-sans"
                />
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password (min 6 chars)"
                  disabled={status === 'loading'}
                  required
                  minLength={6}
                  className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 rounded-md pl-9 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors font-sans"
                />
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !email.trim() || password.length < 6}
              className="w-full py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 disabled:opacity-40 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition-colors"
            >
              {status === 'loading' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Join the Waitlist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {status === 'error' && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono text-center pt-1">
                {errorMessage}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
