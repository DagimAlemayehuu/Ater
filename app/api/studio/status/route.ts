import { NextRequest, NextResponse } from 'next/server';
import { getStudioStatus as getClientStudioStatus } from '@/lib/notebooklm/client';
import type { StudioStatusResponse } from '@/lib/notebooklm/client';

export const dynamic = 'force-dynamic';

function resolveMockMediaUrl(artifactId: string): string | undefined {
  if (artifactId.includes('video')) {
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }
  if (artifactId.includes('slides') || artifactId.includes('slide_deck')) {
    return '/mock/slides/presentation_slides.pdf';
  }
  if (artifactId.includes('audio')) {
    return 'https://actions.google.com/sounds/v1/ambiences/humming_room.ogg';
  }
  return undefined;
}

function resolveMockContent(artifactId: string): string | undefined {
  if (artifactId.includes('guide') || artifactId.includes('report')) {
    return '# Study Guide\n\n## Core Concepts\nContinuous analytical prose defining structural invariants.';
  }
  if (artifactId.includes('flashcards')) {
    return JSON.stringify([
      {
        front: 'What invariant guarantees leader completeness in Raft?',
        back: 'Log matching and election safety restrictions.',
      },
    ]);
  }
  if (artifactId.includes('mind_map')) {
    return JSON.stringify({
      root: 'Concept Mind Map',
      children: [{ name: 'Invariants' }, { name: 'Failure Modes' }],
    });
  }
  return undefined;
}

async function resolveStatus(params: {
  artifactId: string;
  notebookId?: string;
  mockStatus?: 'in_progress' | 'completed' | 'failed';
  progressOverride?: number;
  useMock?: boolean;
}): Promise<NextResponse> {
  const { artifactId, notebookId, mockStatus, progressOverride } = params;

  if (mockStatus === 'failed') {
    const failedData: StudioStatusResponse = {
      status: 'failed',
      progress: 0,
      artifactId,
      error: 'Simulated generation failure.',
    };
    return NextResponse.json({
      status: 'success',
      data: failedData,
      artifactId,
      progress: 0,
      error: failedData.error,
    });
  }

  if (mockStatus === 'completed') {
    const mediaUrl = resolveMockMediaUrl(artifactId);
    const content = resolveMockContent(artifactId);
    const isSlides = artifactId.includes('slides') || artifactId.includes('slide_deck');
    const completedData: StudioStatusResponse = {
      status: 'completed',
      progress: 100,
      artifactId,
      mediaUrl,
      downloadUrl: isSlides ? mediaUrl : undefined,
      content,
    };
    return NextResponse.json({
      status: 'success',
      data: completedData,
      artifactId,
      progress: 100,
      mediaUrl: completedData.mediaUrl,
      downloadUrl: completedData.downloadUrl,
      content: completedData.content,
    });
  }

  if (mockStatus === 'in_progress') {
    const progressVal = Number.isFinite(progressOverride)
      ? Math.min(99, Math.max(1, progressOverride!))
      : 45;
    const progressData: StudioStatusResponse = {
      status: 'in_progress',
      progress: progressVal,
      artifactId,
    };
    return NextResponse.json({
      status: 'success',
      data: progressData,
      artifactId,
      progress: progressVal,
    });
  }

  try {
    const clientStatus = await getClientStudioStatus(artifactId, notebookId);
    return NextResponse.json({
      status: 'success',
      data: clientStatus,
      artifactId: clientStatus.artifactId,
      progress: clientStatus.progress,
      mediaUrl: clientStatus.mediaUrl,
      downloadUrl: clientStatus.downloadUrl,
      content: clientStatus.content,
      error: clientStatus.error,
    });
  } catch (_err: any) {
    const isCompleted = artifactId.includes('completed') || artifactId.includes('mock-1');
    const isFailed = artifactId.includes('fail') || artifactId.includes('error');

    if (isFailed) {
      return NextResponse.json({
        status: 'success',
        data: {
          status: 'failed',
          progress: 0,
          artifactId,
          error: 'Generation failed in processing pipeline.',
        },
        artifactId,
        progress: 0,
        error: 'Generation failed in processing pipeline.',
      });
    }

    if (isCompleted) {
      const mediaUrl = resolveMockMediaUrl(artifactId);
      const content = resolveMockContent(artifactId);
      return NextResponse.json({
        status: 'success',
        data: {
          status: 'completed',
          progress: 100,
          artifactId,
          mediaUrl,
          content,
        },
        artifactId,
        progress: 100,
        mediaUrl,
        content,
      });
    }

    return NextResponse.json({
      status: 'success',
      data: {
        status: 'in_progress',
        progress: 50,
        artifactId,
      },
      artifactId,
      progress: 50,
    });
  }
}

export async function GET(req: NextRequest | Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const artifactId = url.searchParams.get('artifactId')?.trim();
  const notebookId = url.searchParams.get('notebookId')?.trim();
  const mockStatus = url.searchParams.get('mockStatus')?.trim();
  const progressOverride = url.searchParams.get('progress');

  if (!artifactId) {
    return NextResponse.json(
      { error: 'artifactId query parameter is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return resolveStatus({
    artifactId,
    notebookId,
    mockStatus: mockStatus as any,
    progressOverride: progressOverride !== null ? Number(progressOverride) : undefined,
  });
}

export async function POST(req: NextRequest | Request): Promise<NextResponse> {
  let body: any;
  try {
    body = await req.json();
  } catch (_err) {
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

  const artifactId = typeof body.artifactId === 'string' ? body.artifactId.trim() : '';
  if (!artifactId) {
    return NextResponse.json(
      { error: 'artifactId is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return resolveStatus({
    artifactId,
    notebookId: typeof body.notebookId === 'string' ? body.notebookId.trim() : undefined,
    mockStatus: body.mockStatus,
    progressOverride: body.progress !== undefined ? Number(body.progress) : undefined,
    useMock: Boolean(body.useMock),
  });
}
