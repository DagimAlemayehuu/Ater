import { NextRequest, NextResponse } from 'next/server';
import { synthesizeAndCacheAudio } from '@/lib/voice/ttsCache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;
    const voice = body?.voice || 'en-US-JennyNeural';
    const rate = body?.rate || '+10%';

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required for TTS synthesis' }, { status: 400 });
    }

    const buffer = await synthesizeAndCacheAudio(text.trim(), voice, rate);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('EdgeTTS Route Error:', err);
    return NextResponse.json(
      { error: err?.message || 'TTS synthesis encountered an internal error' },
      { status: 500 }
    );
  }
}
