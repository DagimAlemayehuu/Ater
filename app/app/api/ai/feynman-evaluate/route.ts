import { NextResponse } from 'next/server';
import { evaluateFeynmanExplanation } from '@/lib/ai/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const concept = body?.concept;
    const explanation = body?.explanationText || body?.explanation;
    const useMock = body?.useMock || false;
    const forcePass = body?.forcePass;
    const language = body?.language === 'am' ? 'am' : 'en';

    if (!concept || !concept.trim() || !explanation || !explanation.trim()) {
      return NextResponse.json(
        { error: 'Both concept and explanation are required' },
        { status: 400 }
      );
    }

    const evaluation = await evaluateFeynmanExplanation({
      concept,
      explanation,
      useMock,
      forcePass,
      language,
    });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to evaluate Feynman response' },
      { status: 500 }
    );
  }
}
