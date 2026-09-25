import { NextRequest, NextResponse } from 'next/server';
import { generateRemediationLesson, spliceRemediationLesson } from '@/lib/curriculum/generator';
import type {
  CurriculumRemediateRequest,
  CurriculumRemediateResponse,
  RoadmapLesson,
} from '@/types';

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

  const { courseId, failedLessonId, misconceptions, learnerExplanation, failedLesson, lessons, useMock } = body;

  const resolvedFailedId = typeof failedLessonId === 'string' ? failedLessonId.trim() : '';
  if (!resolvedFailedId) {
    return NextResponse.json(
      { error: 'failedLessonId is required' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resolvedMisconceptions = Array.isArray(misconceptions) ? misconceptions : [];

  const targetLesson: RoadmapLesson = failedLesson || {
    id: resolvedFailedId,
    order: 1,
    title: resolvedFailedId.replace(/[-_]/g, ' '),
    slug: `${resolvedFailedId}_concept`,
    summary: 'Core concepts requiring remediation.',
    status: 'remediation',
    estimatedMinutes: 5,
    prerequisites: [],
    isRemediation: false,
  };

  try {
    const remediationLesson = await generateRemediationLesson({
      courseId: courseId || 'course-default',
      failedLesson: targetLesson,
      misconceptions: resolvedMisconceptions,
      learnerExplanation: typeof learnerExplanation === 'string' ? learnerExplanation : undefined,
      useMock: !!useMock,
      throwOnError: true,
    });

    const activeLessons: RoadmapLesson[] = Array.isArray(lessons) ? lessons : [targetLesson];
    const updatedLessons = spliceRemediationLesson(activeLessons, resolvedFailedId, remediationLesson);

    const responsePayload: CurriculumRemediateResponse = {
      remediationLesson,
      updatedLessons,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('API /api/curriculum/remediate route error:', error);

    const fallbackRemediation: RoadmapLesson = {
      id: `${resolvedFailedId}b`,
      order: targetLesson.order + 0.5,
      title: `Remediation: ${targetLesson.title} Clarification`,
      slug: `${targetLesson.slug}_remediation`,
      summary: `Micro-remediation targeting diagnosed misconceptions in ${targetLesson.title}.`,
      status: 'remediation',
      estimatedMinutes: 5,
      prerequisites: targetLesson.prerequisites,
      conceptsCovered: resolvedMisconceptions.length > 0 ? resolvedMisconceptions : ['Remedial Concept'],
      isRemediation: true,
      parentLessonId: resolvedFailedId,
    };

    const activeLessons: RoadmapLesson[] = Array.isArray(lessons) ? lessons : [targetLesson];
    const updatedLessons = spliceRemediationLesson(activeLessons, resolvedFailedId, fallbackRemediation);

    return NextResponse.json(
      {
        remediationLesson: fallbackRemediation,
        updatedLessons,
      },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
