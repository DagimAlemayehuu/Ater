'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface WaitlistEntry {
  id: string;
  contact: string;
  created_at: string;
}

const ADMIN_EMAIL = 'dagimalemayehuu@gmail.com';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitlist = async () => {
    setFetchingData(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError('Supabase client unavailable');
      setFetchingData(false);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setEntries(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load waitlist entries.');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email || null;
      setCurrentUserEmail(email);
      setLoading(false);
      if (email) {
        fetchWaitlist();
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-sans">
        <div className="text-xs text-zinc-500 font-mono">Verifying authorization...</div>
      </div>
    );
  }

  const isAuthorized = currentUserEmail === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Return to site"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tighter uppercase font-sans text-zinc-900 dark:text-zinc-100">
                ATER
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-250 dark:border-zinc-750 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500 truncate max-w-[200px]">
              {currentUserEmail || 'Unauthenticated'}
            </span>
            {isAuthorized && (
              <button
                onClick={fetchWaitlist}
                disabled={fetchingData}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingData ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-6">
        {!isAuthorized ? (
          <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-center space-y-3 max-w-md mx-auto my-12">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Admin Access Required
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This dashboard is restricted to authorized operators. Sign in with your administrator account to inspect waitlist records.
            </p>
            <div className="pt-2">
              <Link
                href="/auth?mode=login"
                className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer"
              >
                Sign In as Admin
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Total Waitlist</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                  {entries.length}
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Target Alpha Batch</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                  50
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Status</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                  Closed Alpha
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Registered Contacts ({entries.length})
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Supabase · public.waitlist
                </span>
              </div>

              {entries.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                  {fetchingData ? 'Fetching records...' : 'No waitlist submissions recorded yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-zinc-400 font-mono">
                        <th className="px-5 py-3 font-normal">#</th>
                        <th className="px-5 py-3 font-normal">Contact</th>
                        <th className="px-5 py-3 font-normal">Registered</th>
                        <th className="px-5 py-3 font-normal text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
                      {entries.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-zinc-400">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 select-all">
                            {item.contact}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px]">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-block px-2.5 py-1 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                              Queued
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
