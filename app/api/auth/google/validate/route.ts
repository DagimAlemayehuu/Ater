import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const testUrl =
      typeof body?.url === 'string' && body.url.startsWith('http')
        ? body.url
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=google`;

    const res = await fetch(testUrl, {
      method: 'GET',
      redirect: 'manual',
    });

    if (res.status === 400) {
      const errorJson = await res.json().catch(() => ({}));
      const message =
        errorJson.msg ||
        errorJson.message ||
        errorJson.error_description ||
        'Unsupported provider: provider is not enabled';

      return NextResponse.json({
        enabled: false,
        code: 400,
        error: message,
      });
    }

    // Status 302, 303, 307, or 200 indicates provider is enabled and redirects to Google
    return NextResponse.json({
      enabled: true,
      status: res.status,
    });
  } catch (err: any) {
    return NextResponse.json({
      enabled: false,
      error: err?.message || 'Failed to verify Google provider status',
    });
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  return POST(req);
}

