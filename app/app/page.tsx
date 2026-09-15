'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Mic, Brain } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AppStudioPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="font-mono text-base font-bold text-zinc-100">
            Ater
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-400 rounded">
            Cognitive Studio
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-mono text-zinc-400">
            {loading ? 'Authenticating...' : userEmail || 'Alpha Tester'}
          </span>
          <button
            onClick={handleSignOut}
            className="p-1.5 border border-zinc-800 hover:border-zinc-600 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="border border-zinc-800 bg-zinc-950/60 rounded-lg p-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 border border-zinc-800 bg-zinc-900/40 rounded-full">
            <Brain className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-mono text-zinc-400">Knowledge Runtime Environment</span>
          </div>

          <h2 className="text-xl font-semibold text-zinc-100 mb-2">
            Active Recall & Socratic Defense Studio
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl mb-8">
            Your personal learning runtime is active. Select a course module or start a voice defense checkpoint below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-zinc-800/80 bg-zinc-900/30 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-zinc-200">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium">Native Vault Courses</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Bi-directional sync with your Obsidian second brain vault notes.
              </p>
            </div>

            <div className="p-4 border border-zinc-800/80 bg-zinc-900/30 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-zinc-200">
                <Mic className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium">Voice Socratic Checkpoints</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Sub-second audio dialogue testing real causal understanding.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
