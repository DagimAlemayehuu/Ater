import { NextRequest, NextResponse } from 'next/server';
import { createStudioArtifact } from '@/lib/notebooklm/client';
import type { StudioArtifactType } from '@/lib/notebooklm/client';

export const dynamic = 'force-dynamic';

const VALID_ARTIFACT_TYPES = [
  'audio',
  'video',
  'slide_deck',
  'slides',
  'report',
  'flashcards',
  'mind_map',
] as const;

function normalizeArtifactType(raw: string): StudioArtifactType {
  if (raw === 'slides') return 'slide_deck';
  return raw as StudioArtifactType;
}

function getEstimatedSeconds(type: string): number {
  switch (type) {
    case 'audio':
      return 180;
    case 'video':
      return 300;
    case 'slide_deck':
      return 60;
    case 'report':
      return 30;
    case 'flashcards':
      return 20;
    case 'mind_map':
      return 20;
    default:
      return 60;
  }
}

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

  const rawType = typeof body.artifactType === 'string' ? body.artifactType.trim() : '';
  if (!rawType) {
    return NextResponse.json(
      { error: 'artifactType is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!VALID_ARTIFACT_TYPES.includes(rawType as any)) {
    return NextResponse.json(
      {
        error:
          'Invalid artifactType. Allowed types: audio, video, slide_deck, slides, report, flashcards, mind_map',
      },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const normalizedType = normalizeArtifactType(rawType);
  const estimatedSeconds = getEstimatedSeconds(normalizedType);

  if (
    body.options !== undefined &&
    (typeof body.options !== 'object' || Array.isArray(body.options) || body.options === null)
  ) {
    return NextResponse.json(
      { error: 'options must be an object' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const notebookId =
    typeof body.notebookId === 'string' && body.notebookId.trim()
      ? body.notebookId.trim()
      : `nb-${body.courseId || 'phase6'}-${Date.now()}`;

  try {
    const dispatchResult = await createStudioArtifact({
      notebookId,
      artifactType: normalizedType,
      format: body.format || body.options?.format,
      visualStyle: body.visualStyle || body.options?.visualStyle,
      language: body.language || body.options?.language || 'en',
      sourceContext: body.sourceContent || body.sourceContext,
      title: body.title,
      difficulty: body.difficulty || body.options?.difficulty,
      focusPrompt: body.focusPrompt || body.options?.focusPrompt,
      useMock: Boolean(body.useMock),
    });

    const createResponse = {
      status: (dispatchResult.status || 'in_progress') as
        | 'pending'
        | 'in_progress'
        | 'completed'
        | 'failed',
      artifactId: dispatchResult.artifactId,
      notebookId: dispatchResult.notebookId || notebookId,
      artifactType: normalizedType,
      estimatedSeconds,
      message: `${normalizedType} generation initiated.`,
    };

    return NextResponse.json(
      {
        status: 'success',
        data: createResponse,
        artifactId: createResponse.artifactId,
        notebookId: createResponse.notebookId,
        artifactType: createResponse.artifactType,
        estimatedSeconds: createResponse.estimatedSeconds,
        isFallback: Boolean(dispatchResult.isFallback),
      },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const fallbackArtifactId = `art-${normalizedType}-${Date.now()}`;
    const fallbackResponse = {
      status: 'in_progress' as const,
      artifactId: fallbackArtifactId,
      notebookId,
      artifactType: normalizedType,
      estimatedSeconds,
      message: `${normalizedType} generation dispatched in offline mode.`,
    };

    return NextResponse.json(
      {
        status: 'success',
        data: fallbackResponse,
        artifactId: fallbackArtifactId,
        notebookId,
        artifactType: normalizedType,
        estimatedSeconds,
        isFallback: true,
      },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
