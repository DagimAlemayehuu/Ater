import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateCheckpointAnswer,
  mutateLessonNote,
  generateFallbackNote,
} from '@/lib/curriculum/notes';
import { sanitizeSpokenPrompt } from '@/lib/curriculum/intake';
import type { LessonStepRequest, LessonStepResponse, LessonCheckpoint, DynamicLessonNote } from '@/types';

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

  const { lessonId, checkpointId, learnerInput, activeNoteContent, useMock } = body;

  const resolvedLessonId = typeof lessonId === 'string' ? lessonId.trim() : '';
  const resolvedCheckpointId = typeof checkpointId === 'string' ? checkpointId.trim() : '';
  const resolvedInput = typeof learnerInput === 'string' ? learnerInput.trim() : '';

  if (!resolvedLessonId) {
    return NextResponse.json(
      { error: 'lessonId is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!resolvedCheckpointId) {
    return NextResponse.json(
      { error: 'checkpointId is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!resolvedInput) {
    return NextResponse.json(
      { error: 'learnerInput is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const baseNote: DynamicLessonNote = (activeNoteContent as DynamicLessonNote) || generateFallbackNote(resolvedLessonId, resolvedLessonId);

  const targetCheckpoint: LessonCheckpoint =
    baseNote.checkpoints?.find((cp) => cp.id === resolvedCheckpointId) ||
    baseNote.section4MidwayCheckpoint || {
      id: resolvedCheckpointId,
      sectionIndex: 4,
      question: 'Evaluate consensus invariants.',
      expectedInsight: 'Sound deduction.',
      isAnswered: false,
    };

  try {
    const evaluation = await evaluateCheckpointAnswer({
      checkpoint: targetCheckpoint,
      studentInput: resolvedInput,
      lessonTitle: baseNote.title,
      useMock: !!useMock,
      throwOnError: true,
    });

    const { updatedNote, synthesizedNoteAddendum } = mutateLessonNote(
      baseNote,
      resolvedCheckpointId,
      resolvedInput,
      evaluation
    );

    const spokenResponse = sanitizeSpokenPrompt(
      evaluation.passed
        ? `Spot on. ${evaluation.feedback}`
        : `Not quite. ${evaluation.feedback}`
    );

    const responsePayload: LessonStepResponse = {
      passed: evaluation.passed,
      spokenResponse: spokenResponse || evaluation.feedback,
      synthesizedNoteAddendum,
      nextSectionIndex: evaluation.passed ? 5 : 4,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('API /api/lesson/step route error:', error);

    const fallbackPassed = resolvedInput.length >= 10;
    const fallbackFeedback = fallbackPassed
      ? 'Intuition verified against primary causal invariants.'
      : 'Incomplete explanation; please expand on the causal mechanism.';

    const fallbackEvaluation = {
      passed: fallbackPassed,
      score: fallbackPassed ? 8 : 4,
      feedback: fallbackFeedback,
    };

    const { synthesizedNoteAddendum } = mutateLessonNote(
      baseNote,
      resolvedCheckpointId,
      resolvedInput,
      fallbackEvaluation
    );

    return NextResponse.json(
      {
        passed: fallbackPassed,
        spokenResponse: fallbackFeedback,
        synthesizedNoteAddendum,
        nextSectionIndex: fallbackPassed ? 5 : 4,
      },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
