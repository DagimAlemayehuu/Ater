'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  RefreshCw,
  GitCommit,
  UserCheck,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface WaitlistEntry {
  id: string;
  email: string;
  full_name?: string | null;
  status: string;
  created_at: string;
}

interface GitCommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

const DEFAULT_ADMINS = [
  'dagimalemayehuu@gmail.com',
];

export default function AdminDashboardPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [commits, setCommits] = useState<GitCommitItem[]>([]);
  const [adminEmails, setAdminEmails] = useState<string[]>(DEFAULT_ADMINS);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load team admins from localStorage to persist teammates
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ater_team_admins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAdminEmails(Array.from(new Set([...DEFAULT_ADMINS, ...parsed])));
        }
      }
    } catch (_err) {}
  }, []);

  const saveAdminEmails = (updated: string[]) => {
    setAdminEmails(updated);
    try {
      localStorage.setItem('ater_team_admins', JSON.stringify(updated));
    } catch (_err) {}
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAdminEmail.trim().toLowerCase();
    if (!clean || adminEmails.includes(clean)) return;
    const updated = [...adminEmails, clean];
    saveAdminEmails(updated);
    setNewAdminEmail('');
  };

  const handleRemoveAdmin = (emailToRemove: string) => {
    if (emailToRemove === DEFAULT_ADMINS[0]) return; // Protect primary owner
    const updated = adminEmails.filter((e) => e !== emailToRemove);
    saveAdminEmails(updated);
  };

  const fetchDeployments = async () => {
    try {
      const res = await fetch('/api/admin/deployments');
      const data = await res.json();
      setCommits(data.commits || []);
    } catch (_err) {}
  };

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
      // First try waiting_list (canonical Supabase table in this project)
      let { data, error: fetchErr } = await supabase
        .from('waiting_list')
        .select('*')
        .order('created_at', { ascending: false });

      // Fallback to waitlist if waiting_list was not found
      if (fetchErr && fetchErr.code === 'PGRST205') {
        const res2 = await supabase
          .from('waitlist')
          .select('*')
          .order('created_at', { ascending: false });
        data = res2.data;
        fetchErr = res2.error;
      }

      if (fetchErr) throw fetchErr;

      const normalized: WaitlistEntry[] = (data || [])
        .map((row: any) => ({
          id: row.id,
          email: row.email || row.contact || 'No contact',
          full_name: row.full_name || null,
          status: row.status || 'queued',
          created_at: row.created_at,
        }))
        .filter((item: WaitlistEntry) => {
          // Exclude team members and admins so they are never counted as customer waitlist users
          const cleanEmail = item.email.toLowerCase().trim();
          return !adminEmails.map((e) => e.toLowerCase().trim()).includes(cleanEmail);
        });

      setEntries(normalized);
    } catch (err: any) {
      setError(err.message || 'Failed to load records.');
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
      const email = data?.user?.email?.toLowerCase() || null;
      setCurrentUserEmail(email);
      setLoading(false);
      if (email) {
        fetchWaitlist();
        fetchDeployments();
      }
    });
  }, []);

  const isAuthorized = currentUserEmail ? adminEmails.map((e) => e.toLowerCase()).includes(currentUserEmail) : false;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Header: Clean matching landing page logo */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              title="Return to site"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Same Logo as Landing Page: ATER · አጠር */}
            <Link
              href="/"
              className="text-xl md:text-2xl font-black tracking-tighter uppercase font-sans text-zinc-900 dark:text-zinc-100 flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span>ATER</span>
              <span className="text-xl md:text-2xl font-black opacity-60">አጠር</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 truncate max-w-[180px]">
              {currentUserEmail || 'Unauthenticated'}
            </span>
            {isAuthorized && (
              <button
                onClick={() => {
                  fetchWaitlist();
                  fetchDeployments();
                }}
                disabled={fetchingData}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Refresh telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingData ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
        {loading ? (
          <div className="py-24 text-center text-xs text-zinc-400 font-mono">
            Verifying team access...
          </div>
        ) : !isAuthorized ? (
          <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-center space-y-3 max-w-md mx-auto my-12">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Access Restricted
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Sign in with an authorized team member account to view telemetry and production updates.
            </p>
            <div className="pt-2">
              <Link
                href="/auth?mode=login&redirect=/admin"
                className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Waitlist Signups</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                  {entries.length}
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Team Admins</span>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                  {adminEmails.length} / 5
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Production Release</span>
                  <GitCommit className="w-4 h-4" />
                </div>
                <div className="text-sm font-mono font-medium text-zinc-900 dark:text-zinc-100 truncate pt-1">
                  {commits[0]?.sha || 'main'} · {commits[0]?.message || 'Live'}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                {error}
              </div>
            )}

            {/* Waitlist Table */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Waitlist Signups ({entries.length})
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Supabase · public.waiting_list
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
                        <th className="px-5 py-3 font-normal">User</th>
                        <th className="px-5 py-3 font-normal">Registered</th>
                        <th className="px-5 py-3 font-normal text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
                      {entries.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-zinc-400">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100 select-all">
                              {item.email}
                            </div>
                            {item.full_name && (
                              <div className="text-[11px] text-zinc-400">
                                {item.full_name}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px]">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${
                              item.status === 'approved'
                                ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Production Commits / What got pushed */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Recent Production Updates
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  GitHub · DagimAlemayehuu/Ater
                </span>
              </div>

              {commits.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 font-mono">
                  Loading commits...
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {commits.map((c) => (
                    <div key={c.sha} className="px-5 py-3 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-zinc-400 text-[11px] shrink-0">
                          {c.sha}
                        </span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {c.message}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {new Date(c.date).toLocaleDateString()}
                        </span>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teammate Access Management */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Team Members
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Add up to 5 teammates to grant them access to this dashboard.
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {adminEmails.length} / 5
                </span>
              </div>

              {/* Add Teammate Input */}
              {adminEmails.length < 5 && (
                <form onSubmit={handleAddAdmin} className="flex gap-2">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newAdminEmail.trim()}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              )}

              {/* Teammate List */}
              <div className="space-y-2 pt-1">
                {adminEmails.map((email, idx) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-zinc-400">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {email}
                      </span>
                      {email === DEFAULT_ADMINS[0] && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-500">
                          Owner
                        </span>
                      )}
                    </div>

                    {email !== DEFAULT_ADMINS[0] && (
                      <button
                        onClick={() => handleRemoveAdmin(email)}
                        className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                        title="Remove teammate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
