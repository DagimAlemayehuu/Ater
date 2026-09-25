import { NextResponse } from 'next/server';
import { compileDynamicLessonNote } from '@/lib/curriculum/notes';
import { compilePedagogicalNote } from '@/lib/ai/gemini';
import { warmTtsInBackground } from '@/lib/voice/ttsCache';
import type { GroundedSource, PlannedSection } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is a DynamicLessonNote compilation request
    const lessonId = body?.lessonId;
    const title = body?.title || body?.paper?.title;
    const summary = body?.summary || body?.sourceText || body?.paper?.abstract;
    const courseId = body?.courseId;
    const sources: GroundedSource[] | undefined = body?.sources;
    const plannedSections: PlannedSection[] | undefined = body?.plannedSections;
    const useMock = body?.useMock || false;
    const language = body?.language === 'am' ? 'am' : 'en';

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required for lesson note compilation' },
        { status: 400 }
      );
    }

    if (lessonId) {
      const dynamicNote = await compileDynamicLessonNote({
        lessonId,
        title: title.trim(),
        summary: summary?.trim(),
        courseId,
        sources,
        plannedSections,
        useMock: !!useMock,
        throwOnError: false,
        language,
      });

      // Background pre-warm Section 1 teacher voice so speech plays instantly
      const sec1Speech = dynamicNote.teacherExplanations?.section1;
      if (sec1Speech) {
        warmTtsInBackground(sec1Speech, language === 'am' ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural');
      }

      return NextResponse.json(dynamicNote);
    }

    // Legacy fallback for ScholarPaper compilation
    const note = await compilePedagogicalNote(
      body?.paper ? { paper: body.paper, domain: body?.domain, useMock } : title,
      summary,
      body?.domain
    );

    return NextResponse.json(note);
  } catch (error: any) {
    console.error('Compile note route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to compile note' },
      { status: 500 }
    );
  }
}
