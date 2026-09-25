import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    let base64Audio = '';
    let mimeType = 'audio/webm';

    let languageHint = '';
    const contentType = req.headers.get('content-type') || '';
    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      const formData = await req.formData();
      const file = formData.get('audio') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No audio file uploaded' }, { status: 400 });
      }
      let buffer: Buffer;
      if (typeof file === 'string') {
        buffer = Buffer.from(file);
      } else if (typeof (file as any).arrayBuffer === 'function') {
        buffer = Buffer.from(await (file as any).arrayBuffer());
      } else if (typeof (file as any).text === 'function') {
        buffer = Buffer.from(await (file as any).text());
      } else {
        buffer = Buffer.from(String(file));
      }
      base64Audio = buffer.toString('base64');
      mimeType = (file as any)?.type || 'audio/webm';
      languageHint = (formData.get('language') as string) || '';
    } else {
      const body = await req.json();
      base64Audio = body?.audio;
      mimeType = body?.mimeType || 'audio/webm';
      languageHint = body?.language || '';
    }

    if (!base64Audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    // Clean MIME type for Gemini (strip codecs parameter like audio/webm;codecs=opus)
    const cleanMime = mimeType.split(';')[0].trim();

    const systemPrompt = `You are a speech-to-text transcriber specializing in Amharic (አማርኛ) and English.
Transcribe the spoken audio with exact fidelity.
If Amharic: Output in proper Amharic Ge'ez script (ፊደል). Never translate Amharic into English. Never use Latin letters for Amharic.
If English: Output in clear English.
Return ONLY the raw transcribed text. No preambles, no quotes, no explanations.${languageHint ? ` Language hint: ${languageHint === 'am' ? 'Amharic' : 'English'}` : ''}`;

    const candidateModels = ['gemini-flash-lite-latest', 'gemini-3.5-transcribe', 'gemini-3.5-flash-lite', model];
    let lastError = '';
    let transcript = '';

    for (const targetModel of Array.from(new Set(candidateModels))) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: cleanMime,
                        data: base64Audio,
                      },
                    },
                    {
                      text: 'Transcribe the audio.',
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: 256,
                temperature: 0.0,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          lastError = errText;
          console.warn(`Gemini model ${targetModel} transcription failed (${response.status}):`, errText);
          continue;
        }

        const data = await response.json();
        transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        // If successful, stop trying fallbacks
        break;
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`Gemini model ${targetModel} request threw error:`, err);
      }
    }

    if (!transcript && lastError) {
      console.error('All transcription models failed. Last error:', lastError);
      return NextResponse.json({ error: 'Transcription service error' }, { status: 500 });
    }

    // Detect if transcript contains Ge'ez characters (Unicode range U+1200 to U+137F)
    const hasGeez = /[\u1200-\u137F]/.test(transcript);
    const detectedLanguage = hasGeez ? 'am' : 'en';

    return NextResponse.json({ transcript, detectedLanguage });
  } catch (err: any) {
    console.error('Transcription Route Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process audio' }, { status: 500 });
  }
}
