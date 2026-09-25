import { NextRequest, NextResponse } from 'next/server';
import { cleanContinuousProse, stripEmojis } from '@/lib/curriculum/intake';
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import type { CourseCurriculum, RoadmapLesson } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest | Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { curriculum, feedback, language } = body;
    const isAm = language === 'am';

    if (!curriculum || !feedback || typeof feedback !== 'string') {
      return NextResponse.json(
        { error: 'Curriculum and feedback string are required' },
        { status: 400 }
      );
    }

    const cleanFeedback = stripEmojis(feedback).trim();
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    if (!apiKey) {
      // Offline fallback: append or adjust an updated lesson title based on feedback
      const updatedLessons = [...curriculum.lessons];
      const newLesson: RoadmapLesson = {
        id: `lesson-${String(updatedLessons.length + 1).padStart(2, '0')}`,
        order: updatedLessons.length + 1,
        title: isAm ? `ተጨማሪ ክፍል፡ ${cleanFeedback}` : `Added Module: ${cleanFeedback}`,
        slug: `${String(updatedLessons.length + 1).padStart(2, '0')}_modified`,
        summary: isAm ? `በተጠቃሚው አስተያየት መሰረት የተካተተ አዲስ ክፍል፡ ${cleanFeedback}` : `Custom lesson incorporated based on learner request: ${cleanFeedback}`,
        description: isAm ? 'የተስተካከለ የትምህርት እቅድ።' : 'Customized based on learner feedback.',
        status: 'locked',
        estimatedMinutes: 15,
        prerequisites: [updatedLessons[updatedLessons.length - 1]?.id || 'lesson-01'],
        conceptsCovered: [cleanFeedback],
        isRemediation: false,
      };
      updatedLessons.push(newLesson);

      const teacherWalkthrough = isAm
        ? `በሰጡት አስተያየት መሰረት የትምህርት ካርታው ተስተካክሏል። ${cleanFeedback} የሚለውን ርዕስ አካተናል። አዲሱን ቅደም ተከተል ይመልከቱ።`
        : `I have updated your roadmap based on your feedback. We added focus on ${cleanFeedback}. Take a look at the revised sequence and click approve when ready.`;

      const updatedCurriculum: CourseCurriculum = {
        ...curriculum,
        lessons: updatedLessons,
        teacherWalkthrough,
      };
      return NextResponse.json(updatedCurriculum);
    }

    const languagePromptDirective = isAm
      ? `CRITICAL LANGUAGE INVARIANT:
You MUST author all titles, summaries, descriptions, and teacherWalkthrough strictly in natural, articulate Amharic (አማርኛ) using Ge'ez script. Zero English letters or latin script.`
      : `CRITICAL LANGUAGE INVARIANT:
Author all fields in clear, articulate English.`;

    const systemPrompt = `You are the Ater Living Curriculum Architect.
The learner has reviewed their current curriculum roadmap and provided specific feedback to adjust or modify it.

Current Curriculum:
Topic: "${curriculum.topic}"
Target Goal: "${curriculum.targetGoal}"
Current Lessons:
${JSON.stringify(curriculum.lessons.map((l: RoadmapLesson) => ({ order: l.order, title: l.title, summary: l.summary })), null, 2)}

Learner Feedback / Modification Request:
"${cleanFeedback}"

${languagePromptDirective}

CRITICAL ARCHITECTURAL INVARIANTS:
1. Maintain 3 to 6 atomic, topologically ordered lessons (15-20 min each).
2. Incorporate the learner's feedback directly into the sequence (add, re-order, replace, or focus on requested concepts).
3. First lesson status must be "active", all subsequent lessons status must be "locked".
4. Strictly ZERO EMOJIS in any string field.
5. Provide a "teacherWalkthrough": 2-4 spoken sentences explaining the exact modifications made and inviting the student to approve or adjust further.

Respond with ONLY valid JSON:
{
  "title": "string",
  "topic": "${curriculum.topic}",
  "targetGoal": "string",
  "learnerBaseline": "${curriculum.learnerBaseline || 'Intermediate'}",
  "lessons": [
    {
      "id": "lesson-01",
      "order": 1,
      "title": "string",
      "slug": "01_slug",
      "summary": "string",
      "description": "string",
      "status": "active",
      "estimatedMinutes": 15,
      "prerequisites": [],
      "conceptsCovered": ["concept"],
      "isRemediation": false
    }
  ],
  "teacherWalkthrough": "Spoken explanation of the updates made. First acknowledge the user's specific request. Then walk sequentially through the modified or added lessons, giving a 1-sentence explanation of what each one covers, and invite the student to approve or adjust further."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Curriculum modification API returned ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from curriculum modification model');

    const parsed = extractJsonFromResponse(rawText);
    const rawLessons: any[] = Array.isArray(parsed.lessons) ? parsed.lessons : [];
    if (rawLessons.length === 0) throw new Error('No lessons returned in modified curriculum');

    const normalizedLessons: RoadmapLesson[] = rawLessons.map((l, idx) => {
      const order = idx + 1;
      const lessonId = l.id || `lesson-${String(order).padStart(2, '0')}`;
      const titleStr = stripEmojis(l.title || `Module ${order}`);
      const slug = l.slug || `${String(order).padStart(2, '0')}_${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const summary = cleanContinuousProse(stripEmojis(l.summary || `Core principles of ${titleStr}.`));
      const description = cleanContinuousProse(stripEmojis(l.description || summary));
      const estimatedMinutes = Math.min(25, Math.max(10, Number(l.estimatedMinutes) || 15));
      const prereqs = idx === 0 ? [] : (Array.isArray(l.prerequisites) && l.prerequisites.length > 0 ? l.prerequisites : [`lesson-${String(order - 1).padStart(2, '0')}`]);

      return {
        id: lessonId,
        order,
        title: titleStr,
        slug,
        summary,
        description,
        status: idx === 0 ? 'active' : 'locked',
        estimatedMinutes,
        prerequisites: prereqs,
        conceptsCovered: Array.isArray(l.conceptsCovered) ? l.conceptsCovered.map(stripEmojis) : [titleStr],
        isRemediation: false,
      };
    });

    const fallbackWalkthrough = isAm
      ? `የትምህርት ካርታውን በአስተያየትዎ መሰረት አሻሽለነዋል። አዲሱን ቅደም ተከተል ይገምግሙ።`
      : `I have updated the curriculum roadmap based on your feedback. Review the updated sequence and let me know if you are ready to begin.`;

    const teacherWalkthrough = cleanContinuousProse(stripEmojis(parsed.teacherWalkthrough || fallbackWalkthrough));

    const updatedCurriculum: CourseCurriculum = {
      id: curriculum.id || `course-${curriculum.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: stripEmojis(parsed.title || curriculum.title || `${curriculum.topic} Curriculum`),
      topic: curriculum.topic,
      sourceType: curriculum.sourceType || 'prompt',
      sourceName: curriculum.sourceName,
      sources: curriculum.sources,
      targetGoal: cleanContinuousProse(stripEmojis(parsed.targetGoal || curriculum.targetGoal)),
      learnerBaseline: cleanContinuousProse(stripEmojis(parsed.learnerBaseline || curriculum.learnerBaseline || 'Intermediate')),
      lessons: normalizedLessons,
      activeLessonId: normalizedLessons[0]?.id || 'lesson-01',
      teacherWalkthrough,
      createdAt: curriculum.createdAt || new Date().toISOString(),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedCurriculum);
  } catch (error: any) {
    console.error('Modify curriculum route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to modify curriculum' },
      { status: 500 }
    );
  }
}
