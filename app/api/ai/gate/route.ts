import { NextRequest, NextResponse } from 'next/server';
import {
  generateInitialGateQuestions,
  evaluateGateTurn,
  finalizeGateSession,
} from '@/lib/ai/gate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || 'start';
    const language = body?.language === 'am' ? 'am' : 'en';
    const useMock = !!body?.useMock;

    if (action === 'start') {
      const lessonTitle = body?.lessonTitle || 'Foundational Principles';
      const note = body?.note || null;
      const questions = await generateInitialGateQuestions({
        lessonTitle,
        note,
        language,
        useMock,
      });

      return NextResponse.json({ questions });
    }

    if (action === 'evaluate_turn') {
      const lessonTitle = body?.lessonTitle || 'Lesson';
      const currentTurn = body?.currentTurn;
      const studentAnswer = body?.studentAnswer || '';
      const attemptNumber = Number(body?.attemptNumber) || 1;

      if (!currentTurn) {
        return NextResponse.json({ error: 'currentTurn is required' }, { status: 400 });
      }

      const result = await evaluateGateTurn({
        lessonTitle,
        currentTurn,
        studentAnswer,
        attemptNumber,
        language,
        useMock,
      });

      return NextResponse.json(result);
    }

    if (action === 'finalize') {
      const lessonTitle = body?.lessonTitle || 'Lesson';
      const turns = Array.isArray(body?.turns) ? body.turns : [];

      const result = finalizeGateSession(turns, lessonTitle, language);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Socratic Gate Route Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process Socratic Gate request' },
      { status: 500 }
    );
  }
}
