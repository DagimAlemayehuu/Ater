import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://api.github.com/repos/DagimAlemayehuu/Ater/commits?per_page=5', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Ater-Admin-Dashboard',
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ commits: [] });
    }

    const data = await res.json();
    const commits = (data || []).map((c: any) => ({
      sha: c.sha?.substring(0, 7),
      message: c.commit?.message?.split('\n')[0],
      author: c.commit?.author?.name,
      date: c.commit?.author?.date,
      url: c.html_url,
    }));

    return NextResponse.json({ commits });
  } catch (_err) {
    return NextResponse.json({ commits: [] });
  }
}
