import { NextRequest, NextResponse } from 'next/server';
import { generateCourseCurriculum, generateFallbackCurriculum } from '@/lib/curriculum/generator';
import type { CurriculumGenerateRequest, CourseCurriculum } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest | Request): Promise<NextResponse> {
  let body: any;

  try {
    body = await req.json();
  } catch (_jsonErr) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Request body must be a JSON object' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { topic, sourceType, answers, useMock, language } = body;
  const appLang = language === 'am' ? 'am' : 'en';

  const trimmedTopic = typeof topic === 'string' ? topic.trim() : '';
  if (!trimmedTopic) {
    return NextResponse.json(
      { error: 'Topic is required to generate a curriculum' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resolvedAnswers = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {};

  try {
    const curriculum: CourseCurriculum = await generateCourseCurriculum({
      topic: trimmedTopic,
      sourceType: sourceType || 'prompt',
      answers: resolvedAnswers,
      useMock: !!useMock,
      language: appLang,
      throwOnError: true,
    });

    return NextResponse.json(curriculum, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('API /api/curriculum/generate route error:', error);

    const fallback = generateFallbackCurriculum(trimmedTopic, resolvedAnswers.q1, resolvedAnswers.q2, appLang);

    return NextResponse.json(fallback, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
