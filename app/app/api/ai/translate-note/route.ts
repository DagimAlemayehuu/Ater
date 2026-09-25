import { NextRequest, NextResponse } from 'next/server';
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import { generateFallbackNote } from '@/lib/curriculum/notes';
import type { DynamicLessonNote } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    const body = await req.json();
    const { note, targetLanguage } = body;

    if (!note) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 });
    }

    const isTargetAmharic = targetLanguage === 'am';

    if (!apiKey) {
      const fallback = generateFallbackNote(
        note.lessonId || note.id || 'lesson',
        note.title || 'Lesson',
        note.courseId,
        isTargetAmharic ? 'am' : 'en'
      );
      return NextResponse.json({ translatedNote: fallback });
    }

    const systemPrompt = isTargetAmharic
      ? `You are the Ater Cognitive Translation Engine.
Translate the following structured lesson note faithfully into natural, fluent, and highly articulate Amharic (አማርኛ) using Ge'ez script.

Input Note Title: "${note.title}"
Section 1 (Mental Model / Core Intuition): "${note.mentalModel || note.section1CoreIntuition || ''}"
Section 2 (Purpose / Framework): "${note.intuitivePurpose || note.section2FormalFramework || ''}"
Section 3 (Operational Mechanism): "${note.operationalMechanism || note.section3ConcreteCaseStudy || ''}"
Section 4 (Boundary Conditions): "${note.boundaryConditions || ''}"
Section 4 Checkpoint Question: "${note.checkpoints?.[0]?.question || note.section4MidwayCheckpoint?.question || ''}"
Section 4 Checkpoint Spoken: "${note.checkpoints?.[0]?.spokenPrompt || note.section4MidwayCheckpoint?.spokenPrompt || ''}"
Section 5 Synthesis: "${note.section5SocraticSynthesis || ''}"
Teacher Explanations:
- Section 1: "${note.teacherExplanations?.section1 || ''}"
- Section 2: "${note.teacherExplanations?.section2 || ''}"
- Section 3: "${note.teacherExplanations?.section3 || ''}"
- Section 4: "${note.teacherExplanations?.section4 || ''}"
- Section 5: "${note.teacherExplanations?.section5 || ''}"

CRITICAL INVARIANTS:
1. Translate fully into natural Amharic (አማርኛ) with Ge'ez script.
2. ZERO EMOJIS.
3. Keep continuous analytical prose (Zero bullets, asterisks, or dashes).
4. Maintain the deep, comprehensive detail in all 5 teacherExplanations (do NOT shorten or truncate).
5. Maintain the JSON structure faithfully.

Respond with ONLY valid JSON:
{
  "title": "string (in Amharic)",
  "mentalModel": "string (in Amharic)",
  "intuitivePurpose": "string (in Amharic)",
  "operationalMechanism": "string (in Amharic)",
  "boundaryConditions": "string (in Amharic)",
  "checkpointQuestion": "string (in Amharic)",
  "checkpointSpoken": "string (in Amharic)",
  "section5Synthesis": "string (in Amharic)",
  "teacherExplanations": {
    "section1": "string (detailed spoken explanation in Amharic)",
    "section2": "string (detailed spoken explanation in Amharic)",
    "section3": "string (detailed spoken explanation in Amharic)",
    "section4": "string (detailed spoken explanation in Amharic)",
    "section5": "string (detailed spoken explanation in Amharic)"
  }
}`
      : `You are the Ater Cognitive Translation Engine.
Translate the following structured lesson note faithfully into clear, articulate, and fluent English.

Input Note Title: "${note.title}"
Section 1 (Mental Model / Core Intuition): "${note.mentalModel || note.section1CoreIntuition || ''}"
Section 2 (Purpose / Framework): "${note.intuitivePurpose || note.section2FormalFramework || ''}"
Section 3 (Operational Mechanism): "${note.operationalMechanism || note.section3ConcreteCaseStudy || ''}"
Section 4 (Boundary Conditions): "${note.boundaryConditions || ''}"
Section 4 Checkpoint Question: "${note.checkpoints?.[0]?.question || note.section4MidwayCheckpoint?.question || ''}"
Section 4 Checkpoint Spoken: "${note.checkpoints?.[0]?.spokenPrompt || note.section4MidwayCheckpoint?.spokenPrompt || ''}"
Section 5 Synthesis: "${note.section5SocraticSynthesis || ''}"
Teacher Explanations:
- Section 1: "${note.teacherExplanations?.section1 || ''}"
- Section 2: "${note.teacherExplanations?.section2 || ''}"
- Section 3: "${note.teacherExplanations?.section3 || ''}"
- Section 4: "${note.teacherExplanations?.section4 || ''}"
- Section 5: "${note.teacherExplanations?.section5 || ''}"

CRITICAL INVARIANTS:
1. Translate fully into natural, articulate English.
2. ZERO EMOJIS.
3. Keep continuous analytical prose (Zero bullets, asterisks, or dashes).
4. Maintain the deep, comprehensive detail in all 5 teacherExplanations (do NOT shorten or truncate).
5. Maintain the JSON structure faithfully.

Respond with ONLY valid JSON:
{
  "title": "string (in English)",
  "mentalModel": "string (in English)",
  "intuitivePurpose": "string (in English)",
  "operationalMechanism": "string (in English)",
  "boundaryConditions": "string (in English)",
  "checkpointQuestion": "string (in English)",
  "checkpointSpoken": "string (in English)",
  "section5Synthesis": "string (in English)",
  "teacherExplanations": {
    "section1": "string (detailed spoken explanation in English)",
    "section2": "string (detailed spoken explanation in English)",
    "section3": "string (detailed spoken explanation in English)",
    "section4": "string (detailed spoken explanation in English)",
    "section5": "string (detailed spoken explanation in English)"
  }
}`;

    const geminiRes = await fetch(
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

    const amFallback = isTargetAmharic
      ? generateFallbackNote(note.lessonId || note.id || 'lesson', note.title || 'Lesson', note.courseId, 'am')
      : null;

    if (!geminiRes.ok) {
      return NextResponse.json({ translatedNote: amFallback || note });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return NextResponse.json({ translatedNote: amFallback || note });

    let parsed: any = null;
    try {
      parsed = extractJsonFromResponse(rawText);
    } catch (_parseErr) {
      // LLM response truncated or malformed JSON; fall back gracefully
      return NextResponse.json({ translatedNote: amFallback || note });
    }
    if (!parsed) return NextResponse.json({ translatedNote: amFallback || note });

    const geezRegex = /[\u1200-\u137F]/;

    const validatedTeacherExplanations = isTargetAmharic && amFallback?.teacherExplanations
      ? {
          section1: (parsed.teacherExplanations?.section1 && geezRegex.test(parsed.teacherExplanations.section1))
            ? parsed.teacherExplanations.section1
            : amFallback.teacherExplanations.section1,
          section2: (parsed.teacherExplanations?.section2 && geezRegex.test(parsed.teacherExplanations.section2))
            ? parsed.teacherExplanations.section2
            : amFallback.teacherExplanations.section2,
          section3: (parsed.teacherExplanations?.section3 && geezRegex.test(parsed.teacherExplanations.section3))
            ? parsed.teacherExplanations.section3
            : amFallback.teacherExplanations.section3,
          section4: (parsed.teacherExplanations?.section4 && geezRegex.test(parsed.teacherExplanations.section4))
            ? parsed.teacherExplanations.section4
            : amFallback.teacherExplanations.section4,
          section5: (parsed.teacherExplanations?.section5 && geezRegex.test(parsed.teacherExplanations.section5))
            ? parsed.teacherExplanations.section5
            : amFallback.teacherExplanations.section5,
        }
      : (parsed.teacherExplanations || note.teacherExplanations);

    const translatedNote: DynamicLessonNote = {
      ...note,
      title: (isTargetAmharic && parsed.title && geezRegex.test(parsed.title)) ? parsed.title : (amFallback?.title || parsed.title || note.title),
      mentalModel: (isTargetAmharic && parsed.mentalModel && geezRegex.test(parsed.mentalModel)) ? parsed.mentalModel : (amFallback?.mentalModel || parsed.mentalModel || note.mentalModel),
      section1CoreIntuition: (isTargetAmharic && parsed.mentalModel && geezRegex.test(parsed.mentalModel)) ? parsed.mentalModel : (amFallback?.section1CoreIntuition || parsed.mentalModel || note.section1CoreIntuition),
      intuitivePurpose: (isTargetAmharic && parsed.intuitivePurpose && geezRegex.test(parsed.intuitivePurpose)) ? parsed.intuitivePurpose : (amFallback?.intuitivePurpose || parsed.intuitivePurpose || note.intuitivePurpose),
      section2FormalFramework: (isTargetAmharic && parsed.intuitivePurpose && geezRegex.test(parsed.intuitivePurpose)) ? parsed.intuitivePurpose : (amFallback?.section2FormalFramework || parsed.intuitivePurpose || note.section2FormalFramework),
      operationalMechanism: (isTargetAmharic && parsed.operationalMechanism && geezRegex.test(parsed.operationalMechanism)) ? parsed.operationalMechanism : (amFallback?.operationalMechanism || parsed.operationalMechanism || note.operationalMechanism),
      section3ConcreteCaseStudy: (isTargetAmharic && parsed.operationalMechanism && geezRegex.test(parsed.operationalMechanism)) ? parsed.operationalMechanism : (amFallback?.section3ConcreteCaseStudy || parsed.operationalMechanism || note.section3ConcreteCaseStudy),
      boundaryConditions: (isTargetAmharic && parsed.boundaryConditions && geezRegex.test(parsed.boundaryConditions)) ? parsed.boundaryConditions : (amFallback?.boundaryConditions || parsed.boundaryConditions || note.boundaryConditions),
      section5SocraticSynthesis: (isTargetAmharic && parsed.section5Synthesis && geezRegex.test(parsed.section5Synthesis)) ? parsed.section5Synthesis : (amFallback?.section5SocraticSynthesis || parsed.section5Synthesis || note.section5SocraticSynthesis),
      teacherExplanations: validatedTeacherExplanations,
      checkpoints: note.checkpoints?.map((cp: any) => ({
        ...cp,
        question: (isTargetAmharic && parsed.checkpointQuestion && geezRegex.test(parsed.checkpointQuestion)) ? parsed.checkpointQuestion : (amFallback?.checkpoints?.[0]?.question || parsed.checkpointQuestion || cp.question),
        spokenPrompt: (isTargetAmharic && parsed.checkpointSpoken && geezRegex.test(parsed.checkpointSpoken)) ? parsed.checkpointSpoken : (amFallback?.checkpoints?.[0]?.spokenPrompt || parsed.checkpointSpoken || cp.spokenPrompt),
      })),
      section4MidwayCheckpoint: note.section4MidwayCheckpoint
        ? {
            ...note.section4MidwayCheckpoint,
            question: (isTargetAmharic && parsed.checkpointQuestion && geezRegex.test(parsed.checkpointQuestion)) ? parsed.checkpointQuestion : (amFallback?.section4MidwayCheckpoint?.question || parsed.checkpointQuestion || note.section4MidwayCheckpoint.question),
            spokenPrompt: (isTargetAmharic && parsed.checkpointSpoken && geezRegex.test(parsed.checkpointSpoken)) ? parsed.checkpointSpoken : (amFallback?.section4MidwayCheckpoint?.spokenPrompt || parsed.checkpointSpoken || note.section4MidwayCheckpoint.spokenPrompt),
          }
        : undefined,
    };

    return NextResponse.json({ translatedNote });
  } catch (err: any) {
    console.error('Translation route error:', err);
    const isTargetAmharic = req.headers?.get('content-type')?.includes('application/json');
    const fallback = generateFallbackNote('fallback', 'Lesson', undefined, 'am');
    return NextResponse.json({ translatedNote: fallback });
  }
}
