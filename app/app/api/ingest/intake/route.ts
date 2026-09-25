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

  const { type, prompt, pdfBase64, fileName, filename, files, useMock, language } = body;
  const resolvedFileName = typeof fileName === 'string' ? fileName.trim() : typeof filename === 'string' ? filename.trim() : '';
  const appLang = language === 'am' ? 'am' : 'en';

  const trimmedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  const trimmedPdf = typeof pdfBase64 === 'string' ? pdfBase64.trim() : '';
  const resolvedFiles = Array.isArray(files) ? files : [];

  if (resolvedFiles.length === 0 && !trimmedPrompt && !trimmedPdf && !resolvedFileName) {
    return NextResponse.json(
      { error: 'Either prompt, pdfBase64, or uploaded files must be provided' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resolvedType: 'prompt' | 'pdf' | 'document' =
    type || (resolvedFiles.length > 0 || trimmedPdf ? 'document' : 'prompt');

  try {
    const intakeResult: IntakeResponse = await analyzeIntakeMaterial({
      type: resolvedType,
      prompt: trimmedPrompt,
      pdfBase64: trimmedPdf,
      fileName: resolvedFileName,
      files: resolvedFiles,
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
