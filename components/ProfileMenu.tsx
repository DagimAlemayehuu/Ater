'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, ArrowLeft, LogOut } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AppLanguage } from '@/lib/i18n/translations';

interface ProfileMenuProps {
  appLanguage: AppLanguage;
}

export function ProfileMenu({ appLanguage }: ProfileMenuProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
        }
      });
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={profileMenuRef}>
      <button
        onClick={() => setIsProfileMenuOpen((prev) => !prev)}
        className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
        title="Account & Settings"
        aria-label="Account & Settings"
      >
        <User className="w-4 h-4" />
      </button>

      {isProfileMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl p-2 z-50 space-y-1 text-xs font-sans animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
              {appLanguage === 'am' ? 'መለያ' : 'Account'}
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">
              {currentUserEmail || 'Learner'}
            </span>
          </div>

          <Link
            href="/auth"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            onClick={() => setIsProfileMenuOpen(false)}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{appLanguage === 'am' ? 'ቅንብሮች እና ሁኔታ' : 'Settings & Status'}</span>
          </Link>

          {currentUserEmail?.toLowerCase() === 'dagimalemayehuu@gmail.com' && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              <User className="w-3.5 h-3.5" />
              <span>{appLanguage === 'am' ? 'የአድሚን ዳሽቦርድ' : 'Admin Dashboard'}</span>
            </Link>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            onClick={() => setIsProfileMenuOpen(false)}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{appLanguage === 'am' ? 'ወደ መነሻ ገጽ' : 'Return to Home'}</span>
          </Link>

          <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              onClick={() => {
                const supabase = getSupabaseBrowserClient();
                supabase?.auth.signOut();
                window.location.href = '/';
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{appLanguage === 'am' ? 'ውጣ' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
