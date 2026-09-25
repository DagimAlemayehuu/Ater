import { NextRequest, NextResponse } from 'next/server';
import { extractJsonFromResponse } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const concept = body?.concept?.trim();
    const purpose = body?.purpose || '';
    const language = (body?.language || 'en').toLowerCase();
    const isAmharic = language === 'am' || language.startsWith('am');

    if (!concept) {
      return NextResponse.json({ error: 'Concept is required' }, { status: 400 });
    }

    const prompt = isAmharic
      ? `You are the Ater Feynman Challenge Architect.
Generate a rigorous, first-principles Socratic Feynman challenge for the student on this technical concept in AMHARIC (አማርኛ) using Ge'ez script:
Concept: "${concept}"
${purpose ? `Context: "${purpose}"` : ''}

Invariants:
1. "question": A targeted question in Amharic asking the student to explain the core causal mechanism as if explaining to a 12-year-old, using a tangible physical analogy.
2. "tabooWords": Exactly 2 key technical buzzwords in Amharic the student is STRICTLY FORBIDDEN from saying.
3. "spokenPrompt": A single, punchy sentence in Amharic to be read aloud via neural TTS.
4. "criteria": What causal insight the student must prove in Amharic.

Strictly zero emojis.

Respond ONLY with valid JSON matching:
{
  "concept": "${concept}",
  "question": "string (in Amharic)",
  "tabooWords": ["string", "string"],
  "spokenPrompt": "string (in Amharic)",
  "criteria": "string (in Amharic)"
}`
      : `You are the Ater Feynman Challenge Architect.
Generate a rigorous, first-principles Socratic Feynman challenge for the student on this technical concept:
Concept: "${concept}"
${purpose ? `Context: "${purpose}"` : ''}

Invariants:
1. "question": A targeted question asking the student to explain the core causal mechanism as if explaining to a bright 12-year-old, using a tangible physical analogy.
2. "tabooWords": Exactly 2 key domain buzzwords or technical terms the student is STRICTLY FORBIDDEN from saying. (For example, if explaining Byzantine Generals, taboo words might be "general" and "traitor" or "vote").
3. "spokenPrompt": A single, engaging sentence to be read aloud via neural text-to-speech posing the challenge.
4. "criteria": What causal insight the student must prove.

Strictly zero emojis.

Respond ONLY with valid JSON matching:
{
  "concept": "${concept}",
  "question": "string",
  "tabooWords": ["string", "string"],
  "spokenPrompt": "string",
  "criteria": "string"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      // Fallback challenge
      return NextResponse.json({
        concept,
        question: isAmharic
          ? `የ${concept}ን ዋና አሰራር በራስዎ ቃላት በቀላል ምሳሌ ያስረዱ።`
          : `Explain how ${concept} works in your own words using an everyday physical analogy.`,
        tabooWords: isAmharic ? ['ስርዓት', 'አልጎሪዝም'] : ['algorithm', 'system'],
        spokenPrompt: isAmharic
          ? `ለ${concept} የተዘጋጀው የፈተና ጥያቄ ይህ ነው፡ ዋናውን አሰራር ያለ ስርዓት ወይም አልጎሪዝም ቃላት ያስረዱ።`
          : `Here is your Feynman challenge for ${concept}: Explain the core mechanism without using the words algorithm or system.`,
        criteria: isAmharic
          ? 'የስቴት ሽግግሮች እና የአሰራር ሂደት ትንተና።'
          : 'Causal explanation of state transitions.',
      });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json({
        concept,
        question: isAmharic
          ? `የ${concept}ን ዋና አሰራር በራስዎ ቃላት በቀላል ምሳሌ ያስረዱ።`
          : `Explain how ${concept} works in your own words using an everyday physical analogy.`,
        tabooWords: isAmharic ? ['ስርዓት', 'አልጎሪዝም'] : ['algorithm', 'system'],
        spokenPrompt: isAmharic
          ? `ለ${concept} የተዘጋጀው የፈተና ጥያቄ ይህ ነው፡ ዋናውን አሰራር ያለ ስርዓት ወይም አልጎሪዝም ቃላት ያስረዱ።`
          : `Here is your Feynman challenge for ${concept}. Explain the core mechanism in plain English.`,
        criteria: isAmharic
          ? 'የስቴት ሽግግሮች እና የአሰራር ሂደት ትንተና።'
          : 'Causal explanation of state transitions.',
      });
    }

    const parsed = extractJsonFromResponse(rawText);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Feynman Prompt Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate Feynman challenge prompt' },
      { status: 500 }
    );
  }
}
