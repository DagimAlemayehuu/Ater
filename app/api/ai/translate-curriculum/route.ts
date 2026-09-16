import { NextRequest, NextResponse } from 'next/server';
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import { generateFallbackCurriculum } from '@/lib/curriculum/generator';
import type { CourseCurriculum } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    const body = await req.json();
    const { curriculum, targetLanguage } = body;

    if (!curriculum) {
      return NextResponse.json({ error: 'Curriculum is required' }, { status: 400 });
    }

    const isTargetAmharic = targetLanguage === 'am';

    if (!apiKey) {
      const fallback = generateFallbackCurriculum(curriculum.topic || '', undefined, undefined, isTargetAmharic ? 'am' : 'en');
      return NextResponse.json({ translatedCurriculum: fallback });
    }

    const systemPrompt = isTargetAmharic
      ? `You are the Ater Curriculum Translation Engine.
Translate the following course curriculum metadata and its lesson titles/summaries faithfully into natural, fluent, and highly articulate Amharic (አማርኛ) using Ge'ez script.

Course Topic: "${curriculum.topic || ''}"
Course Title: "${curriculum.title || curriculum.topic || ''}"
Course Goal/Description: "${curriculum.targetGoal || ''}"
Lessons:
${JSON.stringify(
  (curriculum.lessons || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    summary: l.summary,
  })),
  null,
  2
)}

CRITICAL INVARIANTS:
1. Translate fully into natural Amharic (አማርኛ) with Ge'ez script.
2. ZERO EMOJIS.
3. Keep the exact same lesson IDs and order.
4. Respond with ONLY valid JSON:
{
  "topic": "string (in Amharic)",
  "title": "string (in Amharic)",
  "targetGoal": "string (in Amharic)",
  "lessons": [
    {
      "id": "string (original id)",
      "title": "string (in Amharic)",
      "summary": "string (in Amharic)"
    }
  ]
}`
      : `You are the Ater Curriculum Translation Engine.
Translate the following course curriculum metadata and its lesson titles/summaries faithfully into clear, articulate English.

Course Topic: "${curriculum.topic || ''}"
Course Title: "${curriculum.title || curriculum.topic || ''}"
Course Goal/Description: "${curriculum.targetGoal || ''}"
Lessons:
${JSON.stringify(
  (curriculum.lessons || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    summary: l.summary,
  })),
  null,
  2
)}

CRITICAL INVARIANTS:
1. Translate fully into natural, articulate English.
2. ZERO EMOJIS.
3. Keep the exact same lesson IDs and order.
4. Respond with ONLY valid JSON:
{
  "topic": "string (in English)",
  "title": "string (in English)",
  "targetGoal": "string (in English)",
  "lessons": [
    {
      "id": "string (original id)",
      "title": "string (in English)",
      "summary": "string (in English)"
    }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    const fallback = generateFallbackCurriculum(
      curriculum.topic || '',
      undefined,
      undefined,
      isTargetAmharic ? 'am' : 'en'
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.warn('Gemini translate-curriculum fallback triggered:', errText);
      return NextResponse.json({ translatedCurriculum: fallback });
    }

    const data = await geminiRes.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return NextResponse.json({ translatedCurriculum: fallback });
    }

    const parsed = extractJsonFromResponse(candidateText);
    if (!parsed || !parsed.topic) {
      return NextResponse.json({ translatedCurriculum: fallback });
    }

    const lessonMap = new Map((parsed.lessons || []).map((l: any) => [l.id, l]));

    const translatedLessons = (curriculum.lessons || []).map((origLesson: any) => {
      const trans = lessonMap.get(origLesson.id) as any;
      if (trans) {
        return {
          ...origLesson,
          title: trans.title || origLesson.title,
          summary: trans.summary || origLesson.summary,
          description: trans.summary || origLesson.description,
        };
      }
      return origLesson;
    });

    const translatedCurriculum: CourseCurriculum = {
      ...curriculum,
      topic: parsed.topic || curriculum.topic,
      title: parsed.title || curriculum.title || parsed.topic,
      targetGoal: parsed.targetGoal || curriculum.targetGoal,
      lessons: translatedLessons,
    };

    return NextResponse.json({ translatedCurriculum });
  } catch (err: any) {
    console.error('API /api/ai/translate-curriculum error:', err);
    const fallback = generateFallbackCurriculum('Curriculum', undefined, undefined, 'am');
    return NextResponse.json({ translatedCurriculum: fallback });
  }
}
