import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/app';

  if (code) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.auth.exchangeCodeForSession(code);
      } catch (err) {
        console.warn('OAuth exchangeCodeForSession failed:', err);
      }
    }
  }

  // Redirect to requested next page or /app
  return NextResponse.redirect(new URL(next, request.url));
}
