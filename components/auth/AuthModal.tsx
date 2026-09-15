'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, KeyRound, Mail } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'magic_link' | 'password'>('magic_link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase client is unconfigured.' });
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'magic_link') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
          },
        });

        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Magic link sent. Check your inbox to sign in directly.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        router.push('/app');
        onClose();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Authentication failed. Please verify credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-300">
              Alpha Access Sign In
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border border-zinc-800 rounded p-0.5 bg-zinc-900/40 text-[11px] font-mono mb-4">
          <button
            type="button"
            onClick={() => {
              setAuthMode('magic_link');
              setMessage(null);
            }}
            className={`flex-1 py-1 rounded transition-colors ${
              authMode === 'magic_link' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setMessage(null);
            }}
            className={`flex-1 py-1 rounded transition-colors ${
              authMode === 'password' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Password
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@university.edu"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-sans"
              />
              <Mail className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {authMode === 'password' && (
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-sans"
                />
                <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5" />
              </div>
            </div>
          )}

          {message && (
            <p
              className={`text-[11px] font-mono p-2 border rounded ${
                message.type === 'success'
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full mt-2 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded disabled:opacity-30 disabled:hover:bg-zinc-100 flex items-center justify-center space-x-1.5 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>{authMode === 'magic_link' ? 'Send Magic Link' : 'Sign In to App'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
