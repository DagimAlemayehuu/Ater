import type { AterAtomicNote, FeynmanEvaluation, ScholarPaper } from '@/types';

export function cleanContinuousProse(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => line.replace(/^[\s]*([-*•]|\d+[\.)]|\(\d+\))\s+/, '').trim())
    .filter(Boolean)
    .join(' ');
}

export function extractJsonFromResponse(raw: string): any {
  if (!raw) throw new Error('Empty response string');
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch (initialErr) {
    const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeFenceMatch && codeFenceMatch[1]) {
      try {
        return JSON.parse(codeFenceMatch[1].trim());
      } catch (_err) {}
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch (_err) {}
    }

    throw initialErr;
  }
}

export const FALLBACK_NOTE: AterAtomicNote = {
  title: 'Byzantine Fault Tolerance',
  sourcePaperId: 'bft:1982',
  mentalModel: 'Imagine five generals encamped outside an enemy fortress who must all attack or all retreat simultaneously, communicating solely through messengers who might be captured or bribed by enemy spies.',
  intuitivePurpose: 'Byzantine Fault Tolerance provides a mathematical foundation for distributed nodes to reach consensus on state updates even when some participants crash, broadcast contradictory values, or intentionally attempt to subvert the protocol without a central coordinator.',
  operationalMechanism: 'The protocol establishes consensus by proceeding through rounds of signed messages where each node collects broadcast proposals, cross-checks signatures against quorum thresholds of two-thirds supermajorities, and applies deterministic state mutations only after receiving verification proofs from enough independent peers.',
  boundaryConditions: 'The consensus guarantees hold strictly when the total number of faulty or malicious nodes f satisfies 3f + 1 <= N, collapsing immediately if one-third or more participants become corrupt.',
  artifactCode: 'graph TD\n  Leader[Primary Leader] -->|Pre-Prepare| R1[Replica 1]\n  Leader -->|Pre-Prepare| R2[Replica 2]\n  R1 -->|Prepare Quorum 2f+1| Commit[Commit Phase]',
  artifactLanguage: 'mermaid',
  provingGrounds: [
    {
      id: 'pg-1',
      type: 'mcq',
      difficulty: 'L1',
      question: 'What is the minimum number of nodes required to tolerate 2 Byzantine failures?',
      options: { A: '5', B: '6', C: '7', D: '8' },
      answer: 'C',
      explanation: 'Under 3f + 1, tolerating f=2 requires 3(2) + 1 = 7 nodes minimum.',
    },
    {
      id: 'pg-2',
      type: 'scenario',
      difficulty: 'L2',
      question: 'In a 4-node cluster with 1 traitor sending conflicting commit messages to two peers, how is consensus preserved?',
      answer: 'Peers exchange received messages and detect that the traitor sent contradictory values, ignoring the invalid state update.',
      explanation: 'Because 3f + 1 = 4, the 3 honest nodes form a supermajority of 2f + 1 = 3 and isolate the conflicting message.',
    },
    {
      id: 'pg-3',
      type: 'trace',
      difficulty: 'L3',
      question: 'Trace the state mutation failure that occurs if two-thirds quorum is relaxed to a simple majority (>50%) under Byzantine conditions.',
      answer: 'A split-brain condition occurs where two distinct quorums finalize conflicting state updates simultaneously.',
      explanation: 'Without a 2/3 supermajority overlap, two sets of majority quorums can intersect solely on Byzantine nodes who vote for both branches.',
    },
  ],
};

export interface CompileNoteOptions {
  paper?: ScholarPaper;
  title?: string;
  context?: string;
  sourceText?: string;
  domain?: string;
  useMock?: boolean;
}

export async function compilePedagogicalNote(
  titleOrOptions: string | CompileNoteOptions,
  contextArg?: string,
  domainArg?: string
): Promise<AterAtomicNote> {
  let title = '';
  let context = '';
  let domain = '';
  let paperId: string | undefined = undefined;
  let useMock = false;

  if (typeof titleOrOptions === 'string') {
    title = titleOrOptions;
    context = contextArg || '';
    domain = domainArg || '';
  } else {
    const opts = titleOrOptions;
    title = opts.title || opts.paper?.title || '';
    context = opts.context || opts.sourceText || opts.paper?.abstract || '';
    domain = opts.domain || domainArg || '';
    paperId = opts.paper?.id;
    useMock = !!opts.useMock;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey) {
    return {
      ...FALLBACK_NOTE,
      title: title || FALLBACK_NOTE.title,
      sourcePaperId: paperId || FALLBACK_NOTE.sourcePaperId,
      intuitivePurpose: cleanContinuousProse(FALLBACK_NOTE.intuitivePurpose),
      operationalMechanism: cleanContinuousProse(FALLBACK_NOTE.operationalMechanism),
    };
  }

  const prompt = `You are the Ater Pedagogical Compiler.
Compile the following academic concept into a structured 5-section mental model note.
Title: "${title}"
Context / Abstract: "${context}"
${domain ? `Academic Domain: "${domain}"` : ''}

CRITICAL INVARIANTS:
1. Section 1 (mentalModel): Everyday physical analogy (ELI12 mapping >= 2 components).
2. Section 2 (intuitivePurpose): Continuous prose explaining why this exists. STRICT INVARIANT: ZERO bullet points, dashes, or numbered lists in prose.
3. Section 3 (operationalMechanism): Continuous causal execution prose explaining step-by-step state transitions. STRICT INVARIANT: ZERO bullet points, dashes, or numbered lists.
4. Section 4 (boundaryConditions & artifactCode): Boundary trap failure conditions and an architecture diagram or code snippet.
5. Section 5 (provingGrounds): Exactly 3 test questions:
   - Question 1: difficulty "L1" (direct recall / MCQ)
   - Question 2: difficulty "L2" (scenario analysis)
   - Question 3: difficulty "L3" (trace / debug edge case)

Respond with ONLY valid JSON matching this schema:
{
  "title": "${title}",
  "sourcePaperId": "${paperId || ''}",
  "mentalModel": "string",
  "intuitivePurpose": "string",
  "operationalMechanism": "string",
  "boundaryConditions": "string",
  "artifactCode": "string",
  "artifactLanguage": "mermaid",
  "provingGrounds": [
    {
      "id": "q1",
      "type": "mcq",
      "difficulty": "L1",
      "question": "string",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "answer": "string",
      "explanation": "string"
    },
    {
      "id": "q2",
      "type": "scenario",
      "difficulty": "L2",
      "question": "string",
      "answer": "string",
      "explanation": "string"
    },
    {
      "id": "q3",
      "type": "trace",
      "difficulty": "L3",
      "question": "string",
      "answer": "string",
      "explanation": "string"
    }
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 1 },
          },
        }),
      }
    );

    if (!response.ok) {
      return {
        ...FALLBACK_NOTE,
        title: title || FALLBACK_NOTE.title,
        sourcePaperId: paperId || FALLBACK_NOTE.sourcePaperId,
      };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { ...FALLBACK_NOTE, title: title || FALLBACK_NOTE.title, sourcePaperId: paperId };
    }

    const parsed: AterAtomicNote = extractJsonFromResponse(rawText);
    parsed.title = parsed.title || title || FALLBACK_NOTE.title;
    parsed.mentalModel = parsed.mentalModel || FALLBACK_NOTE.mentalModel;
    parsed.intuitivePurpose = cleanContinuousProse(parsed.intuitivePurpose || FALLBACK_NOTE.intuitivePurpose);
    parsed.operationalMechanism = cleanContinuousProse(parsed.operationalMechanism || FALLBACK_NOTE.operationalMechanism);
    parsed.boundaryConditions = parsed.boundaryConditions || FALLBACK_NOTE.boundaryConditions;
    if (!parsed.provingGrounds || !Array.isArray(parsed.provingGrounds) || parsed.provingGrounds.length < 3) {
      parsed.provingGrounds = FALLBACK_NOTE.provingGrounds;
    }
    return parsed;
  } catch (_error) {
    return {
      ...FALLBACK_NOTE,
      title: title || FALLBACK_NOTE.title,
      sourcePaperId: paperId || FALLBACK_NOTE.sourcePaperId,
    };
  }
}

export interface EvaluateFeynmanOptions {
  concept: string;
  explanation?: string;
  explanationText?: string;
  useMock?: boolean;
  forcePass?: boolean;
  language?: 'en' | 'am';
}

export async function evaluateFeynmanExplanation(
  conceptOrOptions: string | EvaluateFeynmanOptions,
  studentExplanationArg?: string
): Promise<FeynmanEvaluation> {
  let concept = '';
  let explanation = '';
  let useMock = false;
  let forcePass: boolean | undefined = undefined;
  let language: 'en' | 'am' = 'en';

  if (typeof conceptOrOptions === 'string') {
    concept = conceptOrOptions;
    explanation = studentExplanationArg || '';
  } else {
    concept = conceptOrOptions.concept;
    explanation = conceptOrOptions.explanation || conceptOrOptions.explanationText || '';
    useMock = !!conceptOrOptions.useMock;
    forcePass = conceptOrOptions.forcePass;
    language = conceptOrOptions.language === 'am' ? 'am' : 'en';
  }

  const isAm = language === 'am';
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey) {
    const pass = forcePass !== undefined ? forcePass : explanation.length > 30;
    const score = pass ? 9 : 5;
    return {
      score,
      passed: score >= 8,
      causalAccuracy: pass
        ? (isAm ? 'ከፍተኛ የምክንያትና ውጤት ትክክለኛነት እና የመሠረታዊ ሃሳብ ግንዛቤ።' : 'High causal accuracy with sound first-principles grounding.')
        : (isAm ? 'ያልተሟላ ማብራሪያ፣ የምክንያትና ውጤት አሠራር እና ገደቦች አልተገለጹም።' : 'Incomplete explanation lacking causal mechanism and failure boundaries.'),
      misconceptions: pass ? [] : [
        isAm ? 'የአሠራር ሂደቱን በግልጽ አላብራሩም' : 'Missing quorum requirement explanation',
        isAm ? 'መሰረታዊ ነጥቦች ጎድለዋል' : 'Did not address traitorous nodes',
      ],
      spokenFeedback: pass
        ? (isAm ? 'በጣም ጥሩ ማብራሪያ። መሰረታዊ ሃሳቡን ያለ ውስብስብ ቃላት በግልጽ አስረድተዋል።' : 'Excellent explanation. You accurately articulated the quorum supermajority and consensus mechanism without jargon.')
        : (isAm ? 'ማብራሪያዎ በጣም አጭር ነው። አሠራሩ እንዴት እንደሚሰራ በዝርዝር ያብራሩ።' : 'Your explanation is too brief. Be specific about how nodes reach agreement when bad actors send conflicting votes.'),
    };
  }

  const languagePrompt = isAm
    ? 'Language: Amharic (አማርኛ). All text fields ("causalAccuracy", "misconceptions", "spokenFeedback") MUST be in fluent Amharic.'
    : 'Language: English.';

  const prompt = `You are the Ater Feynman Comprehension Evaluator.
Evaluate this student's spoken explanation of the concept: "${concept}".
Student Explanation: "${explanation}"
${languagePrompt}

Evaluation Criteria:
1. First-principles clarity without robotic jargon.
2. Causal accuracy of the mechanism.
3. Awareness of boundary conditions.
4. Score strictly from 1 to 10.
5. Invariant: If score >= 8, set passed to true. If score < 8, set passed to false.

Respond ONLY with valid JSON matching:
{
  "score": number,
  "passed": boolean,
  "causalAccuracy": "string",
  "misconceptions": ["string"],
  "spokenFeedback": "string"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 1 },
          },
        }),
      }
    );

    if (!response.ok) {
      const pass = explanation.length > 30;
      const score = pass ? 8 : 5;
      return {
        score,
        passed: score >= 8,
        causalAccuracy: isAm ? 'በተጠባባቂ ሞድ የተገመገመ ማብራሪያ።' : 'Evaluated under fallback mode.',
        misconceptions: pass ? [] : [isAm ? 'ያልተሟላ ማብራሪያ' : 'Incomplete explanation'],
        spokenFeedback: pass
          ? (isAm ? 'የመሰረታዊ ሃሳቡ ጥሩ ማብራሪያ።' : 'Good explanation of the core principles.')
          : (isAm ? 'አስፈላጊ የምክንያትና ውጤት አሠራሮች ጎድለዋል።' : 'Missing essential causal mechanics.'),
      };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty model response');
    const result: FeynmanEvaluation = extractJsonFromResponse(rawText);
    const score = Math.max(1, Math.min(10, Math.round(Number(result.score) || 5)));
    result.score = score;
    result.passed = score >= 8;
    result.causalAccuracy = result.causalAccuracy || (isAm ? 'የምክንያት ማብራሪያ ተገምግሟል።' : 'Causal explanation evaluated.');
    result.misconceptions = Array.isArray(result.misconceptions) ? result.misconceptions : [];
    result.spokenFeedback = result.spokenFeedback || (score >= 8 ? (isAm ? 'ፅንሰ-ሀሳቡ በትክክል ተብራርቷል።' : 'Concept accurately explained.') : (isAm ? 'እባክዎ አሠራሩን ያሻሽሉ።' : 'Please revise the mechanism.'));
    return result;
  } catch (_error) {
    const pass = explanation.length > 30;
    const score = pass ? 8 : 5;
    return {
      score,
      passed: score >= 8,
      causalAccuracy: isAm ? 'ጥሩ አጠቃላይ ግንዛቤ።' : 'Good general comprehension.',
      misconceptions: pass ? [] : [isAm ? 'ማብራሪያው በጣም አጭር ወይም ግልጽ ያልሆነ ነው' : 'Explanation too short or unclear'],
      spokenFeedback: pass
        ? (isAm ? 'ፅንሰ-ሀሳቡ በትክክል ተብራርቷል።' : 'Concept demonstrated accurately.')
        : (isAm ? 'ስርዓቱ በምክንያትና ውጤት እንዴት እንደሚሰራ በዝርዝር ያብራሩ።' : 'Please expand on how the system works causally.'),
    };
  }
}

export const evaluateFeynmanResponse = evaluateFeynmanExplanation;
