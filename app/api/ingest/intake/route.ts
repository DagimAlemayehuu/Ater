import { NextRequest, NextResponse } from 'next/server';
import { analyzeIntakeMaterial, generateFallbackIntake } from '@/lib/curriculum/intake';
import type { IntakeRequest, IntakeResponse } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_PDF_BASE64_LENGTH = 20 * 1024 * 1024; // 20MB limit

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

  const { type, prompt, pdfBase64, fileName, filename, useMock, language } = body;
  const resolvedFileName = typeof fileName === 'string' ? fileName.trim() : typeof filename === 'string' ? filename.trim() : '';
  const appLang = language === 'am' ? 'am' : 'en';

  if (type !== undefined && type !== 'prompt' && type !== 'pdf') {
    return NextResponse.json(
      { error: "Invalid intake type: must be 'prompt' or 'pdf'" },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const trimmedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  const trimmedPdf = typeof pdfBase64 === 'string' ? pdfBase64.trim() : '';

  // Explicit type checks
  if (type === 'prompt' && !trimmedPrompt && !resolvedFileName) {
    return NextResponse.json(
      { error: 'Prompt text is required for prompt intake' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (type === 'pdf' && !trimmedPdf && !trimmedPrompt && !resolvedFileName) {
    return NextResponse.json(
      { error: 'PDF base64 data is required for PDF intake' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // General presence check when type is omitted or implicit
  if (!trimmedPrompt && !trimmedPdf && !resolvedFileName) {
    return NextResponse.json(
      { error: 'Either prompt or pdfBase64 must be provided' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (trimmedPdf && trimmedPdf.length > MAX_PDF_BASE64_LENGTH) {
    return NextResponse.json(
      { error: 'PDF payload exceeds maximum allowable size (20MB)' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resolvedType: 'prompt' | 'pdf' = type || (trimmedPdf ? 'pdf' : 'prompt');

  try {
    const intakeResult: IntakeResponse = await analyzeIntakeMaterial({
      type: resolvedType,
      prompt: trimmedPrompt,
      pdfBase64: trimmedPdf,
      fileName: resolvedFileName,
      useMock: !!useMock,
      language: appLang,
      throwOnError: true,
    });

    if (!intakeResult || !intakeResult.topic || !Array.isArray(intakeResult.questions)) {
      throw new Error('Service returned malformed intake payload');
    }

    return NextResponse.json(intakeResult, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('API /api/ingest/intake route error:', error);

    const fallbackTopic = trimmedPrompt.slice(0, 60) || resolvedFileName || 'Foundational Computing';
    const fallbackData = generateFallbackIntake(fallbackTopic, appLang);

    return NextResponse.json(
      {
        error: error?.message || 'Failed to analyze intake material',
        fallback: fallbackData,
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
