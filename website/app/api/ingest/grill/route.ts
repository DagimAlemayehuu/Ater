import { NextRequest, NextResponse } from 'next/server';
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import { sanitizeSpokenPrompt, stripEmojis } from '@/lib/curriculum/intake';
import type { SocraticDiscoveryQuestion } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest | Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { topic, previousQA = [], language = 'en', useMock = false } = body;
    const isAm = language === 'am';

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    const count = previousQA.length;

    // Allow thorough multi-turn diagnostic interview up to 8 questions total
    if (count >= 8) {
      return NextResponse.json({ done: true, reason: 'maximum_depth_reached' });
    }

    if (useMock || !apiKey) {
      if (count >= 3) {
        return NextResponse.json({ done: true });
      }
      const fallbackQuestions = isAm
        ? [
            {
              id: `g-${count + 1}`,
              question: `በ ${topic} ውስጥ ምን ዓይነት ተግባራዊ ችግር መፍታት ይፈልጋሉ?`,
              spokenPrompt: `በ ${topic} ውስጥ ምን ዓይነት ተግባራዊ ችግር መፍታት ይፈልጋሉ?`,
              category: 'depth' as const,
              conceptTarget: 'ተግባራዊ አተገባበር',
              difficulty: 'L2' as const,
              options: [
                'የስርዓቱን ፍጥነት እና ጥንካሬ ማሳደግ',
                'የተለመዱ የስህተት ወጥመዶችን ማስወገድ',
                'ከመሰረቱ ጀምሮ እያንዳንዱን እርምጃ በግልጽ መረዳት',
                'ሌላ (በሳጥኑ ውስጥ ይጻፉ)',
              ],
            },
          ]
        : [
            {
              id: `g-${count + 1}`,
              question: `What specific problem or system do you want to solve in ${topic}?`,
              spokenPrompt: `What specific problem or system do you want to solve in ${topic}?`,
              category: 'depth' as const,
              conceptTarget: 'Practical use case',
              difficulty: 'L2' as const,
              options: [
                'Build a real-world working project from scratch',
                'Learn how to find and fix difficult bugs and errors',
                'Understand how everything connects step by step',
                'Other (type in the box below)',
              ],
            },
          ];

      return NextResponse.json({
        done: false,
        question: fallbackQuestions[0],
      });
    }

    const promptText = `You are a friendly Socratic teacher conducting a direct "Grill Me" interview to understand the student's exact learning goal for "${topic}".
Use VERY simple, plain, everyday English. NO academic jargon, NO complex words like "calibrating", "pedagogical", "heuristics", "scaffolding", "invariants", etc.

Previous student answers so far:
${JSON.stringify(previousQA, null, 2)}

TASK:
Evaluate the student's learning goal and background based on their responses so far:
1. Proactively look for opportunities to ask an illuminating follow-up question. If their previous answer was high-level, introduced a specific project idea, highlighted a doubt, or mentioned an interesting subtopic, formulate a targeted follow-up question that helps tailor the curriculum roadmap specifically for them.
2. Only respond with "done": true if you already have all necessary nuances (concrete objective, specific practical context, baseline proficiency, depth preferences, and boundary constraints) and no further follow-up would provide additional value.
3. If asking a question:
   - Do NOT ask redundant questions already answered.
   - Formulate 3-4 realistic multiple choice options written in simple everyday language.
   - Tag category as "followup".

CRITICAL INVARIANTS:
- Language: ${isAm ? "natural Amharic (አማርኛ) in Ge'ez script" : "very simple, plain everyday English"}.
- ZERO EMOJIS.
- JSON response only.

SCHEMA:
{
  "done": boolean,
  "question": {
    "id": "string",
    "question": "string (very simple words)",
    "spokenPrompt": "string (plain spoken question ending with ?)",
    "category": "followup",
    "options": ["Option 1", "Option 2", "Option 3"]
  }
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ done: count >= 2 });
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return NextResponse.json({ done: count >= 2 });
    }

    const parsed = extractJsonFromResponse(candidateText);
    if (!parsed || parsed.done || !parsed.question) {
      return NextResponse.json({ done: true });
    }

    const q: SocraticDiscoveryQuestion = {
      id: parsed.question.id || `g-${count + 1}`,
      question: stripEmojis(parsed.question.question || ''),
      spokenPrompt: sanitizeSpokenPrompt(parsed.question.spokenPrompt || parsed.question.question || ''),
      category: 'followup',
      difficulty: 'L2',
      conceptTarget: 'Goal clarification',
      options: Array.isArray(parsed.question.options) ? parsed.question.options.map(stripEmojis) : [],
    };

    return NextResponse.json({ done: false, question: q });
  } catch (err: any) {
    console.error('Grill API error:', err);
    return NextResponse.json({ done: true });
  }
}
