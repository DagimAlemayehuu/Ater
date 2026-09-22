'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  RefreshCw,
  GitCommit,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Lock,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  DEFAULT_ADMINS,
  PRIMARY_OWNER,
  isOwner,
  getTeamMembers,
  addAdminEmail,
  removeAdminEmail,
  updateWaitlistStatus,
  updateTeammatePermissions,
  canPerformAction,
  TeamMember,
} from '@/lib/auth/admins';
import { useTheme } from '@/context/ThemeContext';

interface WaitlistEntry {
  id: string;
  email: string;
  full_name?: string | null;
  status: 'approved' | 'denied' | 'pending' | string;
  created_at: string;
}

interface GitCommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

type AdminTab = 'waitlist' | 'production' | 'team';

export default function AdminDashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('waitlist');

  // Waitlist state
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});

  // Production state
  const [commits, setCommits] = useState<GitCommitItem[]>([]);

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [teamActionLoading, setTeamActionLoading] = useState(false);

  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserOwner = useMemo(() => isOwner(currentUserEmail), [currentUserEmail]);

  const refreshTeam = async () => {
    try {
      const members = await getTeamMembers();
      setTeamMembers(members);
    } catch (_err) {}
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
      let { data, error: fetchErr } = await supabase
        .from('waiting_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr && fetchErr.code === 'PGRST205') {
        const res2 = await supabase
          .from('waitlist')
          .select('*')
          .order('created_at', { ascending: false });
        data = res2.data;
        fetchErr = res2.error;
      }

      if (fetchErr) throw fetchErr;

      const adminEmailList = teamMembers.map((m) => m.email.toLowerCase().trim());
      const normalized: WaitlistEntry[] = (data || [])
        .map((row: any) => ({
          id: row.id,
          email: row.email || row.contact || 'No contact',
          full_name: row.full_name || null,
          status: row.status || 'pending',
          created_at: row.created_at,
        }))
        .filter((item: WaitlistEntry) => {
          const cleanEmail = item.email.toLowerCase().trim();
          return !adminEmailList.includes(cleanEmail) && !DEFAULT_ADMINS.map((e) => e.toLowerCase()).includes(cleanEmail);
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

    supabase.auth.getUser().then(async ({ data }) => {
      const email = data?.user?.email?.toLowerCase() || null;
      setCurrentUserEmail(email);
      setLoading(false);
      if (email) {
        await refreshTeam();
        fetchWaitlist();
        fetchDeployments();
      }
    });
  }, []);

  // Update waitlist status (Approve, Deny, or Reset)
  const handleUpdateStatus = async (targetEmail: string, nextStatus: 'approved' | 'denied' | 'pending') => {
    if (!currentUserEmail) return;
    const canManage = await canPerformAction(currentUserEmail, 'manage_waitlist');
    if (!canManage) {
      setError('You lack permission to modify waitlist statuses.');
      return;
    }

    setStatusUpdating((prev) => ({ ...prev, [targetEmail]: true }));
    // Optimistic UI update
    setEntries((prev) =>
      prev.map((item) => (item.email.toLowerCase() === targetEmail.toLowerCase() ? { ...item, status: nextStatus } : item))
    );

    const success = await updateWaitlistStatus(targetEmail, nextStatus);
    if (!success) {
      setError(`Failed to update status for ${targetEmail}`);
      // Revert from backend
      fetchWaitlist();
    }
    setStatusUpdating((prev) => ({ ...prev, [targetEmail]: false }));
  };

  // Add teammate (Owner only)
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserOwner) {
      setError('Only the workspace owner can add new team members.');
      return;
    }
    const clean = newAdminEmail.trim().toLowerCase();
    if (!clean || teamMembers.some((m) => m.email === clean)) return;

    setTeamActionLoading(true);
    await addAdminEmail(clean);
    await refreshTeam();
    setNewAdminEmail('');
    setTeamActionLoading(false);
  };

  // Remove teammate (Owner only, owner protected)
  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (!isUserOwner) {
      setError('Only the owner can remove teammates.');
      return;
    }
    if (isOwner(emailToRemove)) return; // Owner invariant

    setTeamActionLoading(true);
    await removeAdminEmail(currentUserEmail!, emailToRemove);
    await refreshTeam();
    setTeamActionLoading(false);
  };

  // Toggle teammate permission (Owner only)
  const handleTogglePermission = async (
    targetEmail: string,
    permKey: 'can_manage_waitlist' | 'can_view_production',
    currentVal: boolean
  ) => {
    if (!isUserOwner) return;
    if (isOwner(targetEmail)) return; // Invariant: owner cannot be modified

    const ok = await updateTeammatePermissions(currentUserEmail!, targetEmail, {
      [permKey]: !currentVal,
    });
    if (ok) {
      await refreshTeam();
    }
  };

  // Filtered waitlist
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.full_name && entry.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      return entry.status === statusFilter;
    });
  }, [entries, searchQuery, statusFilter]);

  const isAuthorized = currentUserEmail
    ? teamMembers.some((m) => m.email === currentUserEmail) || DEFAULT_ADMINS.map((e) => e.toLowerCase()).includes(currentUserEmail)
    : false;

  return (
    <div className="min-h-screen bg-[#fbf7f0] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      {/* Top Header - Aligned directly with Ater Studio Theme */}
      <header className="sticky top-0 z-50 w-full bg-[#fbf7f0]/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="p-1.5 -ml-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              title="Return to Learning Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="text-xl md:text-2xl font-black tracking-tighter uppercase font-sans text-zinc-900 dark:text-zinc-100 flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span>ATER</span>
              <span className="text-xl md:text-2xl font-black opacity-60">አጠር</span>
            </Link>

            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Open Learning App (Studio-styled button) */}
            <Link
              href="/app"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Open App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {isAuthorized && (
              <button
                onClick={() => {
                  fetchWaitlist();
                  fetchDeployments();
                  refreshTeam();
                }}
                disabled={fetchingData}
                className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Refresh telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingData ? 'animate-spin' : ''}`} />
              </button>
            )}

            <div className="hidden md:flex flex-col text-right">
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]">
                {currentUserEmail || 'Unauthenticated'}
              </span>
              <span className="text-[9px] font-mono text-zinc-400">
                {isUserOwner ? 'Owner' : 'Team Admin'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-6 space-y-6">
        {loading ? (
          <div className="py-24 text-center text-xs text-zinc-400 font-mono">
            Verifying administrative session...
          </div>
        ) : !isAuthorized ? (
          <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center space-y-3 max-w-md mx-auto my-16 shadow-xs">
            <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Administrative Access Restricted
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              You must sign in with an authorized team account (such as <code className="font-mono text-zinc-700 dark:text-zinc-300">{PRIMARY_OWNER}</code>) to view or manage this dashboard.
            </p>
            <div className="pt-2">
              <Link
                href="/auth?mode=login&redirect=/admin"
                className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer"
              >
                Sign In With Team Account
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setActiveTab('waitlist')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeTab === 'waitlist'
                    ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Waitlist Users</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                  {entries.length}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {entries.filter((e) => e.status === 'approved').length} approved · {entries.filter((e) => e.status === 'pending').length} pending
                </div>
              </div>

              <div
                onClick={() => setActiveTab('production')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeTab === 'production'
                    ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Production Release</span>
                  <GitCommit className="w-4 h-4" />
                </div>
                <div className="text-sm font-mono font-medium text-zinc-900 dark:text-zinc-100 truncate mt-2">
                  {commits[0]?.sha || 'main'} · {commits[0]?.message || 'Live'}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  GitHub auto-deploy active
                </div>
              </div>

              <div
                onClick={() => setActiveTab('team')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeTab === 'team'
                    ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-xs font-medium">Team Admins</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                  {teamMembers.length} / 5
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {isUserOwner ? 'Owner access (manage permissions)' : 'Teammate access'}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">
                  Dismiss
                </button>
              </div>
            )}

            {/* Clean Segmented Tab Switcher */}
            <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <button
                onClick={() => setActiveTab('waitlist')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'waitlist'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Waitlist Management</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                  {entries.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('production')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'production'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Production Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('team')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Team & Access Control</span>
              </button>
            </div>

            {/* TAB 1: WAITLIST */}
            {activeTab === 'waitlist' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search email or name..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                    />
                  </div>

                  <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                    {(['all', 'pending', 'approved', 'denied'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 text-xs rounded-lg uppercase font-mono tracking-wider transition-all cursor-pointer ${
                          statusFilter === st
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
                  <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Registered Applicants ({filteredEntries.length})
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Unapproved users are completely blocked from /app
                    </span>
                  </div>

                  {filteredEntries.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                      {fetchingData ? 'Fetching records...' : 'No matching entries found.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-mono">
                            <th className="px-5 py-3 font-normal">#</th>
                            <th className="px-5 py-3 font-normal">Applicant</th>
                            <th className="px-5 py-3 font-normal">Registered</th>
                            <th className="px-5 py-3 font-normal">Status</th>
                            <th className="px-5 py-3 font-normal text-right">App Access Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
                          {filteredEntries.map((item, idx) => {
                            const isBusy = statusUpdating[item.email];
                            return (
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
                                  {new Date(item.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border ${
                                      item.status === 'approved'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : item.status === 'denied'
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                        : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    {item.status !== 'approved' ? (
                                      <button
                                        onClick={() => handleUpdateStatus(item.email, 'approved')}
                                        disabled={isBusy}
                                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        title="Grant immediate access to /app"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Approve</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUpdateStatus(item.email, 'denied')}
                                        disabled={isBusy}
                                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        title="Revoke /app access immediately"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Revoke Access</span>
                                      </button>
                                    )}

                                    {item.status !== 'pending' && (
                                      <button
                                        onClick={() => handleUpdateStatus(item.email, 'pending')}
                                        disabled={isBusy}
                                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                                        title="Reset status to pending"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTION */}
            {activeTab === 'production' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Production Release Pipeline
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Current runtime deployment build and active production commits on GitHub.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Live
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs">
                  <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Recent Commits · DagimAlemayehuu/Ater
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      GitHub Main Branch
                    </span>
                  </div>

                  {commits.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400 font-mono">
                      Loading commit log...
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
              </div>
            )}

            {/* TAB 3: TEAM & ACCESS CONTROL */}
            {activeTab === 'team' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Team Management & Privileges
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Workspace owner is <code className="font-mono text-zinc-700 dark:text-zinc-300">{PRIMARY_OWNER}</code> (protected & immutable). Teammates have configurable roles.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      {teamMembers.length} / 5 Teammates
                    </span>
                  </div>

                  {/* Add Teammate Input (Only Owner can invite) */}
                  {isUserOwner && teamMembers.length < 5 && (
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
                        disabled={!newAdminEmail.trim() || teamActionLoading}
                        className="px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Invite Teammate</span>
                      </button>
                    </form>
                  )}

                  {/* Teammates List */}
                  <div className="space-y-2 pt-1">
                    {teamMembers.map((member, idx) => {
                      const isTargetOwner = member.is_owner;

                      return (
                        <div
                          key={member.email}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-zinc-400">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 select-all">
                                  {member.email}
                                </span>
                                {isTargetOwner ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                                    Primary Owner
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-500">
                                    Admin Teammate
                                  </span>
                                )}
                              </div>
                              {member.full_name && (
                                <div className="text-[11px] text-zinc-400">{member.full_name}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Permission Toggles */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={!isUserOwner || isTargetOwner}
                                onClick={() =>
                                  handleTogglePermission(
                                    member.email,
                                    'can_manage_waitlist',
                                    member.permissions.can_manage_waitlist
                                  )
                                }
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors ${
                                  member.permissions.can_manage_waitlist
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-400'
                                } ${isUserOwner && !isTargetOwner ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                title={isUserOwner && !isTargetOwner ? 'Toggle waitlist approval capability' : 'Owner invariant'}
                              >
                                Waitlist: {member.permissions.can_manage_waitlist ? 'ON' : 'OFF'}
                              </button>

                              <button
                                type="button"
                                disabled={!isUserOwner || isTargetOwner}
                                onClick={() =>
                                  handleTogglePermission(
                                    member.email,
                                    'can_view_production',
                                    member.permissions.can_view_production
                                  )
                                }
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-colors ${
                                  member.permissions.can_view_production
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-400'
                                } ${isUserOwner && !isTargetOwner ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                title={isUserOwner && !isTargetOwner ? 'Toggle production telemetry visibility' : 'Owner invariant'}
                              >
                                Prod: {member.permissions.can_view_production ? 'ON' : 'OFF'}
                              </button>
                            </div>

                            {/* Remove button (Only owner can remove, and never remove owner) */}
                            {isUserOwner && !isTargetOwner && (
                              <button
                                onClick={() => handleRemoveAdmin(member.email)}
                                disabled={teamActionLoading}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Revoke admin access"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
