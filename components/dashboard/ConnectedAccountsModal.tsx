'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface ConnectedAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'am';
}

export function ConnectedAccountsModal({
  isOpen,
  onClose,
  language = 'en',
}: ConnectedAccountsModalProps) {
  const isAm = language === 'am';
  const { user, signOut, signInWithGoogle, signInWithDevPass } = useAuth();

  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [googleOAuthGuideVisible, setGoogleOAuthGuideVisible] = useState(false);
  const [devEmailInput, setDevEmailInput] = useState('dagimalemayehuu@gmail.com');
  const [showDevEmailInput, setShowDevEmailInput] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValidationError(null);
    setSuccessMessage(null);
    setGoogleOAuthGuideVisible(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleConnect = async () => {
    setIsSigningInGoogle(true);
    setValidationError(null);
    setSuccessMessage(null);

    try {
      const { error } = await signInWithGoogle('/app');
      if (error) {
        setIsSigningInGoogle(false);
        const errMsg = error.message || '';
        const isNotEnabled =
          errMsg.toLowerCase().includes('not enabled') ||
          errMsg.toLowerCase().includes('unsupported provider') ||
          errMsg.toLowerCase().includes('validation_failed') ||
          errMsg.includes('400');

        if (isNotEnabled) {
          setGoogleOAuthGuideVisible(true);
        } else {
          setValidationError(errMsg);
        }
      }
    } catch (err: any) {
      setIsSigningInGoogle(false);
      const errMsg = err?.message || 'Failed to sign in with Google';
      if (
        errMsg.toLowerCase().includes('not enabled') ||
        errMsg.toLowerCase().includes('unsupported provider')
      ) {
        setGoogleOAuthGuideVisible(true);
      } else {
        setValidationError(errMsg);
      }
    }
  };

  const handleDevPassSignIn = async () => {
    try {
      const emailToUse = devEmailInput.trim() || 'dagimalemayehuu@gmail.com';
      await signInWithDevPass(emailToUse);
      setGoogleOAuthGuideVisible(false);
      setSuccessMessage(
        isAm
          ? `በGoogle Dev Pass በተሳካ ሁኔታ ገብተዋል (${emailToUse})`
          : `Signed in with Google (Dev Pass): ${emailToUse}`
      );
    } catch (_err) {
      setValidationError('Failed to sign in with Dev Pass.');
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await signOut();
      setSuccessMessage(
        isAm ? 'ከGoogle መለያ ወጥተዋል' : 'Signed out from Google account'
      );
    } catch (_e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-zinc-950 border border-parchment-300 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="p-4 px-6 border-b border-parchment-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              {isAm ? 'የተገናኙ አካውንቶች' : 'Connected Accounts & Authentication'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-parchment-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div>{validationError}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Google Account Section */}
          <div className="p-4 rounded-xl border border-parchment-300 dark:border-zinc-800 bg-parchment-50/50 dark:bg-zinc-900/30 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-parchment-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    Google Account
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isAm
                      ? 'የክላውድ ማመሳሰያ እና የመለያ አስተዳደር'
                      : 'Cloud sync and personal progress tracking'}
                  </p>
                </div>
              </div>

              {user ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  {isAm ? 'ተገናኝቷል' : 'Connected'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-parchment-300 dark:border-zinc-700 text-[10px] font-mono text-zinc-500 bg-parchment-100 dark:bg-zinc-800">
                  {isAm ? 'አልተገናኘም' : 'Not Connected'}
                </span>
              )}
            </div>

            {/* Supabase Google Provider Not Enabled Inline Guide */}
            {googleOAuthGuideVisible && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-zinc-800 dark:text-zinc-200 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Supabase Google Provider is not enabled yet in project ckqjwsmdbspmquxbdrgb.
                  </span>
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-6">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    To enable Google OAuth in Supabase:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>
                      Visit{' '}
                      <a
                        href="https://supabase.com/dashboard/project/ckqjwsmdbspmquxbdrgb/auth/providers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-0.5"
                      >
                        <span>Supabase Auth Providers Dashboard</span>
                        <ExternalLink className="w-2.5 h-2.5 inline" />
                      </a>
                      {' '}and enable the Google provider.
                    </li>
                    <li>Add Google Client ID &amp; Secret from Google Cloud Console.</li>
                    <li>
                      Set Redirect URI:{' '}
                      <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px] break-all">
                        https://ckqjwsmdbspmquxbdrgb.supabase.co/auth/v1/callback
                      </code>
                    </li>
                  </ol>
                </div>

                <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 pl-6 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDevPassSignIn}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sign in with Google (Dev Pass)</span>
                  </button>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Immediate local testing as dagimalemayehuu@gmail.com
                  </span>
                </div>
              </div>
            )}

            {/* Google Sign-in / User Card */}
            {user ? (
              <div className="p-3 rounded-lg bg-parchment-100/70 dark:bg-zinc-950/60 border border-parchment-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    {isAm ? 'የተገናኘ መለያ' : 'Active Account'}
                  </div>
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 truncate max-w-xs">
                    {user.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="px-3 py-1.5 rounded-lg border border-parchment-300 dark:border-zinc-700 hover:bg-parchment-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{isAm ? 'ውጣ' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isSigningInGoogle}
                  className="w-full py-2.5 px-4 rounded-xl border border-parchment-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-parchment-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSigningInGoogle ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>
                    {isSigningInGoogle
                      ? isAm
                        ? 'ወደ Google በመገናኘት ላይ...'
                        : 'Connecting to Google...'
                      : isAm
                        ? 'በGoogle ይግቡ (Sign in with Google)'
                        : 'Sign in with Google'}
                  </span>
                </button>

                {/* Dev Pass Quick Access Button */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={handleDevPassSignIn}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                  >
                    Sign in with Google (Dev Pass)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDevEmailInput(!showDevEmailInput)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    {showDevEmailInput ? 'Cancel custom email' : 'Custom dev email'}
                  </button>
                </div>

                {showDevEmailInput && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="email"
                      value={devEmailInput}
                      onChange={(e) => setDevEmailInput(e.target.value)}
                      placeholder="dagimalemayehuu@gmail.com"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-parchment-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleDevPassSignIn}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium cursor-pointer"
                    >
                      Use Email
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-parchment-200 dark:border-zinc-800/80 bg-parchment-100/50 dark:bg-zinc-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-parchment-300 dark:border-zinc-800 hover:bg-parchment-200 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            {isAm ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
