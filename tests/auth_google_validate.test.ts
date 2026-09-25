import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as validateGoogleOAuth } from '@/app/api/auth/google/validate/route';
import {
  saveGeminiKeyToStore,
  getGeminiKeyFromStore,
  removeGeminiKeyFromStore,
} from '@/lib/sync/store';

describe('Google OAuth Validation Protocol and Gemini Key Store', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Google OAuth Validation Route (/api/auth/google/validate)', () => {
    it('reports enabled: false when Supabase returns 400 Unsupported provider', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 400,
        json: async () => ({
          code: 400,
          error_code: 'validation_failed',
          msg: 'Unsupported provider: provider is not enabled',
        }),
      });

      const req = new Request('http://localhost:3000/api/auth/google/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://sample.supabase.co/auth/v1/authorize?provider=google' }),
      });

      const res = await validateGoogleOAuth(req);
      const json = await res.json();

      expect(json.enabled).toBe(false);
      expect(json.error).toContain('Unsupported provider: provider is not enabled');
    });

    it('reports enabled: true when Supabase returns 302 redirect', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 302,
        headers: new Headers({ Location: 'https://accounts.google.com/o/oauth2/v2/auth' }),
        json: async () => ({}),
      });

      const req = new Request('http://localhost:3000/api/auth/google/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://sample.supabase.co/auth/v1/authorize?provider=google' }),
      });

      const res = await validateGoogleOAuth(req);
      const json = await res.json();

      expect(json.enabled).toBe(true);
    });
  });

  describe('Store Gemini API Key', () => {
    it('saves and retrieves Gemini API key using ater_gemini_api_key', () => {
      saveGeminiKeyToStore('AIzaSy_test_gemini_key_123');

      expect(localStorage.getItem('ater_gemini_api_key')).toBe('AIzaSy_test_gemini_key_123');

      const retrieved = getGeminiKeyFromStore();
      expect(retrieved).toBe('AIzaSy_test_gemini_key_123');

      removeGeminiKeyFromStore();
      expect(getGeminiKeyFromStore()).toBeNull();
      expect(localStorage.getItem('ater_gemini_api_key')).toBeNull();
    });
  });
});
