import type { GateQuestionTurn, SocraticGateSession, DynamicLessonNote, SocraticTier } from '@/types';
export type { SocraticTier };
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import { cleanContinuousProse, stripEmojis, sanitizeSpokenPrompt } from '@/lib/curriculum/intake';

export interface GenerateGateQuestionsOptions {
  lessonTitle: string;
  note?: Partial<DynamicLessonNote> | null;
  language?: 'en' | 'am';
  useMock?: boolean;
}

/**
 * Detects whether any forbidden taboo words appear in the learner's answer.
 */
export function detectTabooWordViolations(text: string, tabooWords?: string[]): string[] {
  if (!text || !tabooWords || tabooWords.length === 0) return [];
  const lowerText = text.toLowerCase();
  const violations: string[] = [];

  for (const word of tabooWords) {
    const trimmed = word.trim();
    if (!trimmed) continue;
    const lowerWord = trimmed.toLowerCase();

    // Check if word contains non-ASCII characters (e.g. Ge'ez / Amharic)
    const hasNonAscii = /[^\x00-\x7F]/.test(lowerWord);
    if (hasNonAscii) {
      if (lowerText.includes(lowerWord)) {
        violations.push(trimmed);
      }
    } else {
      const escaped = lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        violations.push(trimmed);
      }
    }
  }

  return Array.from(new Set(violations));
}

/**
 * Deterministically constructs the 3 initial open-ended questions for the Socratic Gate.
 */
export function generateFallbackGateQuestions(
  lessonTitle: string,
  language: 'en' | 'am' = 'en',
  _note?: Partial<DynamicLessonNote> | null
): GateQuestionTurn[] {
  const isAm = language === 'am';
  const cleanTitle = stripEmojis(lessonTitle || (isAm ? 'ትምህርት' : 'Foundational Lesson')).trim();

  return isAm
    ? [
        {
          id: 'turn-1',
          index: 1,
          question: `የ ${cleanTitle}ን ዋና የዕለት ተዕለት ምሳሌ እና ሊታወቅ የሚችል ዓላማ ምንም ዓይነት ቴክኒካዊ ቃላት ሳትጠቀሙ ለ12 ዓመት ልጅ እንዴት ታስረዱታላችሁ?`,
          spokenPrompt: `የ ${cleanTitle}ን ዋና የዕለት ተዕለት ምሳሌ እና ሊታወቅ የሚችል ዓላማ ምንም ዓይነት ቴክኒካዊ ቃላት ሳትጠቀሙ ለ12 ዓመት ልጅ አስረዱ?`,
          targetDimension: 'intuition',
        },
        {
          id: 'turn-2',
          index: 2,
          question: `በ ${cleanTitle} ውስጥ ያለውን ትክክለኛ የእርምጃ በደረጃ የአሰራር ሂደት አብራሩ። መረጃ ከመነሻው እስከ መጨረሻው ውጤት ድረስ እንዴት ይጓዛል?`,
          spokenPrompt: `በ ${cleanTitle} ውስጥ መረጃ ከመነሻው እስከ መጨረሻው ውጤት ድረስ እንዴት ይጓዛል?`,
          targetDimension: 'mechanism',
        },
        {
          id: 'turn-3',
          index: 3,
          question: `በ ${cleanTitle} ውስጥ ዋነኛው የድንበር ወጥመድ ወይም የስርዓቱ መበላሸት ሁኔታ ምንድን ነው? አመክንዮው የት ጋር ይፈርሳል፣ ይህንስ ውድቀት እንዴት ይከላከላሉ ወይም ያገግማሉ?`,
          spokenPrompt: `በ ${cleanTitle} ውስጥ አመክንዮው የት ጋር ይፈርሳል፣ ውድቀቱስ እንዴት ይከላከላል?`,
          targetDimension: 'boundary',
        },
      ]
    : [
        {
          id: 'turn-1',
          index: 1,
          question: `Explain the core everyday analogy and intuitive purpose of ${cleanTitle} as if teaching a twelve-year-old, without using technical buzzwords.`,
          spokenPrompt: `Explain the core everyday analogy and intuitive purpose of ${cleanTitle} to a twelve-year-old, without using technical buzzwords?`,
          targetDimension: 'intuition',
        },
        {
          id: 'turn-2',
          index: 2,
          question: `Walk me through the exact step-by-step causal chain of execution in ${cleanTitle}. How does data flow from input to final output?`,
          spokenPrompt: `Walk me through the exact step-by-step causal chain of execution in ${cleanTitle}. How does data flow from input to final output?`,
          targetDimension: 'mechanism',
        },
        {
          id: 'turn-3',
          index: 3,
          question: `What is the primary boundary trap or failure mode in ${cleanTitle}? Where does the logic break down, and how do you prevent or recover from that failure?`,
          spokenPrompt: `What is the primary boundary trap or failure mode in ${cleanTitle}, and how do you prevent or recover from that failure?`,
          targetDimension: 'boundary',
        },
      ];
}

/**
 * Generates the battery of 3 open-ended questions using Gemini 3.5 Flash Lite or returns deterministic fallbacks.
 */
export async function generateInitialGateQuestions(
  options: GenerateGateQuestionsOptions
): Promise<GateQuestionTurn[]> {
  const { lessonTitle, note, language = 'en', useMock = false } = options;
  const isAm = language === 'am';
  const cleanTitle = stripEmojis(lessonTitle || 'Lesson').trim();

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey) {
    return generateFallbackGateQuestions(cleanTitle, language);
  }

  const systemPrompt = `You are the Ater Socratic Gate Master.
Your goal is to formulate 3 deep, open-ended oral defense questions to test a learner's true first-principles mastery of: "${cleanTitle}".
Context:
Mental Model: "${note?.mentalModel || cleanTitle}"
Operational Mechanism: "${note?.operationalMechanism || cleanTitle}"
Boundary Traps: "${note?.boundaryConditions || cleanTitle}"

LANGUAGE DIRECTIVE:
${isAm ? "Output all text (questions, spokenPrompts) strictly in natural, educated Amharic (አማርኛ) using Ge'ez script. Zero latin characters." : "Output in clear, articulate English."}

CRITICAL INVARIANTS:
1. Exactly 3 ordered questions:
   - Question 1 (targetDimension: "intuition"): Probes the core everyday physical analogy and intuition (ELI12 without robotic jargon).
   - Question 2 (targetDimension: "mechanism"): Probes the step-by-step causal execution flow and state transitions.
   - Question 3 (targetDimension: "boundary"): Probes edge conditions, failure modes, partition traps, and invariants.
2. "spokenPrompt": Clean spoken text ending with a question mark (?) suitable for Edge Neural TTS.
3. Zero emojis. Zero bullet characters in text fields.

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "index": 1,
      "question": "string",
      "spokenPrompt": "string",
      "targetDimension": "intuition"
    },
    {
      "index": 2,
      "question": "string",
      "spokenPrompt": "string",
      "targetDimension": "mechanism"
    },
    {
      "index": 3,
      "question": "string",
      "spokenPrompt": "string",
      "targetDimension": "boundary"
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
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 1 },
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    if (!response.ok) {
      return generateFallbackGateQuestions(cleanTitle, language);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return generateFallbackGateQuestions(cleanTitle, language);

    const parsed = extractJsonFromResponse(rawText);
    const questionsArray = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (questionsArray.length < 3) {
      return generateFallbackGateQuestions(cleanTitle, language);
    }

    return questionsArray.slice(0, 3).map((q: any, idx: number) => ({
      id: `turn-${idx + 1}`,
      index: idx + 1,
      question: stripEmojis(q.question),
      spokenPrompt: sanitizeSpokenPrompt(q.spokenPrompt || q.question),
      targetDimension: q.targetDimension === 'mechanism' || q.targetDimension === 'boundary' ? q.targetDimension : 'intuition',
    }));
  } catch (_e) {
    return generateFallbackGateQuestions(cleanTitle, language);
  }
}

/**
 * Backwards compatibility alias for generateInitialGateQuestions.
 */
export const generateGateQuestions = generateInitialGateQuestions;

export interface EvaluateGateTurnOptions {
  lessonTitle: string;
  currentTurn: GateQuestionTurn;
  studentAnswer: string;
  attemptNumber?: number;
  language?: 'en' | 'am';
  useMock?: boolean;
  tabooWords?: string[];
  note?: Partial<DynamicLessonNote> | null;
}

export interface GateTurnEvaluationResult {
  score: number; // 1 to 10
  tier: SocraticTier;
  feedback: string;
  miniLesson?: string;
  misconceptions: string[];
  mastered: boolean;
  needsFollowUp: boolean;
  followUpTurn?: GateQuestionTurn;
  violatedTabooWords?: string[];
}

/**
 * Evaluates a student's answer to a Socratic Gate question using a strict 4-tier progression:
 * - Score < 5: Mini-lesson (concise concept breakdown) + follow-up question
 * - Score 5-7.9: Slight explanation + harder probe
 * - Score 8-9.9: Clarification and refinement on attempt 1, then pass on refinement
 * - Score 10: Immediate perfect pass
 */
export async function evaluateGateTurn(
  options: EvaluateGateTurnOptions
): Promise<GateTurnEvaluationResult> {
  const {
    lessonTitle,
    currentTurn,
    studentAnswer,
    attemptNumber = 1,
    language = 'en',
    useMock = false,
  } = options;
  const isAm = language === 'am';
  const cleanTitle = stripEmojis(lessonTitle || (isAm ? 'ትምህርት' : 'Lesson')).trim();
  const cleanAnswer = stripEmojis(studentAnswer).trim();
  const isUnknown =
    !cleanAnswer ||
    /^(i\s*don'?t\s*know|idk|no\s*idea|not\s*sure|what|help|i\s*do\s*not\s*know|don'?t\s*know|አላውቅም|አላውቀውም)$/i.test(
      cleanAnswer.toLowerCase()
    );

  const maxAttempts = 3;
  const canFollowUp = attemptNumber < maxAttempts;

  // Extract taboo words from options or note criteria
  const tabooWords: string[] = options.tabooWords || options.note?.feynmanCriteria?.tabooWords || [];
  const violatedTabooWords = detectTabooWordViolations(cleanAnswer, tabooWords);
  const hasTabooViolation = violatedTabooWords.length > 0;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey || isUnknown || hasTabooViolation) {
    if (hasTabooViolation) {
      const violatedListStr = violatedTabooWords.join(', ');
      const tabooFeedback = isAm
        ? `የተከለከለውን ቃል ተጠቅመዋል፡ ${violatedListStr}። ፅንሰ-ሀሳቡን ያለ ቴክኒካዊ ቃላት በግልጽ ቋንቋ ያስረዱ።`
        : `You used the forbidden word: ${violatedListStr}. Explain the concept in plain English without relying on buzzwords.`;

      const followUpTurn: GateQuestionTurn | undefined = canFollowUp
        ? {
            id: `${currentTurn.id}-probe-${attemptNumber}`,
            index: currentTurn.index,
            isFollowUp: true,
            parentQuestionId: currentTurn.id,
            question: isAm
              ? `የተከለከሉትን ቃላት (${violatedListStr}) ሳትጠቀሙ የ ${cleanTitle}ን ፅንሰ-ሀሳብ በዕለት ተዕለት ምሳሌ እንደገና ያስረዱ።`
              : `Re-explain the core intuition and mechanism of ${cleanTitle} in plain English without using the forbidden words: ${violatedListStr}.`,
            spokenPrompt: isAm
              ? `${violatedListStr} የሚሉትን ሳትጠቀሙ የ ${cleanTitle}ን ሂደት ማስረዳት ትችላላችሁ?`
              : `Can you explain ${cleanTitle} without using ${violatedListStr}?`,
            targetDimension: currentTurn.targetDimension,
            tier: 'refinement',
          }
        : undefined;

      return {
        score: 4,
        tier: 'mini_lesson',
        feedback: tabooFeedback,
        misconceptions: [
          isAm
            ? `የተከለከሉ ቴክኒካዊ ቃላት አጠቃቀም: ${violatedListStr}`
            : `Relied on forbidden buzzwords: ${violatedListStr}`,
        ],
        mastered: false,
        needsFollowUp: canFollowUp,
        followUpTurn,
        violatedTabooWords,
      };
    }

    if (isUnknown) {
      const miniLesson = isAm
        ? `በ ${cleanTitle} ውስጥ ዋናው ደንብ ማንኛውም ለውጥ ከመጽደቁ በፊት ግልጽ የሆነ የደረጃ ቅደም ተከተል መከተል አለበት። አንድ እርምጃ ካልተሳካ ስርዓቱ እንዳይበላሽ ለውጡ ውድቅ መደረግ አለበት።`
        : `In ${cleanTitle}, the core rule is that state transitions must follow a strict causal order from input to output. If an intermediate step fails or violates invariants, changes must not be applied so the system remains consistent.`;

      const followUpTurn: GateQuestionTurn | undefined = canFollowUp
        ? {
            id: `${currentTurn.id}-probe-${attemptNumber}`,
            index: currentTurn.index,
            isFollowUp: true,
            parentQuestionId: currentTurn.id,
            question: isAm
              ? `ይህን መርህ መሰረት በማድረግ፡ በ ${cleanTitle} ውስጥ አንዱ እርምጃ ካልተሳካ ለውጡ በቋሚነት እንዳይመዘገብ መከልከል ያለበት ለምንድን ነው?`
              : `Based on this rule: why must ${cleanTitle} prevent state changes from taking effect if an intermediate step fails?`,
            spokenPrompt: isAm
              ? `አንዱ እርምጃ ካልተሳካ ለውጡ እንዳይመዘገብ መከልከል ያለበት ለምንድን ነው?`
              : `Why must ${cleanTitle} prevent state changes if an intermediate step fails?`,
            targetDimension: currentTurn.targetDimension,
            tier: 'mini_lesson',
            miniLesson,
          }
        : undefined;

      return {
        score: 1,
        tier: 'mini_lesson',
        feedback: isAm
          ? 'አለማወቅን በግልጽ መናገር ጥሩ ጅምር ነው። ከዚህ በታች የቀረበውን አጭር ትምህርት በጥሞና ይመልከቱ።'
          : 'Admitting uncertainty is honest. Study the mini-lesson below to grasp the causal rule.',
        miniLesson,
        misconceptions: [isAm ? 'የመሰረታዊ ግንዛቤ ክፍተት' : 'Foundational mental model gap'],
        mastered: false,
        needsFollowUp: canFollowUp,
        followUpTurn,
      };
    }

    const isPerfect = cleanAnswer.length >= 100;
    const isSolid = !isPerfect && cleanAnswer.length >= 45;
    const isBorderline = !isPerfect && !isSolid && cleanAnswer.length >= 15;
    const score = isPerfect ? 10 : isSolid ? 9 : isBorderline ? 6 : 3;

    if (score === 10) {
      return {
        score: 10,
        tier: 'perfect_pass',
        feedback: isAm
          ? 'ፍጹም የምክንያትና ውጤት ማብራሪያ። ሙሉ ግንዛቤ ተረጋግጧል።'
          : 'First-principles mastery verified. Clean causal rationale and boundary precision.',
        misconceptions: [],
        mastered: true,
        needsFollowUp: false,
      };
    }

    if (score >= 8) {
      const needsRefinement = attemptNumber === 1;
      const followUpTurn: GateQuestionTurn | undefined = needsRefinement
        ? {
            id: `${currentTurn.id}-probe-${attemptNumber}`,
            index: currentTurn.index,
            isFollowUp: true,
            parentQuestionId: currentTurn.id,
            question: isAm
              ? `ግንዛቤዎ ጠንካራ ነው። ነገር ግን አንድ ወሳኝ ጥቃቅን ነጥብ ያብራሩ፡ በ ${cleanTitle} ውስጥ የማስተካከያ እርምጃዎች ሲዘገዩ መረጃ እንዳይበላሽ የሚያደርገው ወሰን ምንድን ነው?`
              : `Your explanation is strong. To finalize mastery, clarify this edge nuance: how does ${cleanTitle} preserve consistency if an acknowledgment is delayed or dropped?`,
            spokenPrompt: isAm
              ? `የማስተካከያ እርምጃዎች ሲዘገዩ መረጃ እንዳይበላሽ የሚያደርገው ወሰን ምንድን ነው?`
              : `How is consistency preserved if an acknowledgment is delayed or dropped?`,
            targetDimension: currentTurn.targetDimension,
            tier: 'refinement',
          }
        : undefined;

      return {
        score,
        tier: 'refinement',
        feedback: needsRefinement
          ? (isAm ? 'ጠንካራ ግንዛቤ። ለሙሉ ማረጋገጫ አንድ የመጨረሻ ጥቃቅን ነጥብ ያብራሩ።' : 'Solid intuition. Clarify one specific edge nuance to confirm full mastery.')
          : (isAm ? 'ጥቃቅን ነጥቡ ተብራርቷል። ግንዛቤ ተረጋግጧል።' : 'Clarification confirmed. Comprehensive mastery verified.'),
        misconceptions: [],
        mastered: !needsRefinement,
        needsFollowUp: needsRefinement,
        followUpTurn,
      };
    }

    if (score >= 5) {
      const followUpTurn: GateQuestionTurn | undefined = canFollowUp
        ? {
            id: `${currentTurn.id}-probe-${attemptNumber}`,
            index: currentTurn.index,
            isFollowUp: true,
            parentQuestionId: currentTurn.id,
            question: isAm
              ? `አመክንዮውን በከፊል ገልጸዋል። አሁን ወደ ከበደው ጥያቄ እንለፍ፡ በ ${cleanTitle} ውስጥ ያልተጠበቁ ስህተቶች ሲያጋጥሙ የአሰራር ሂደቱ ደረጃ በደረጃ እንዴት እንደሚፈጸም አብራሩ።`
              : `You captured the basic premise, but missed the causal mechanism. Let us push deeper: walk me through the precise step-by-step causal chain in ${cleanTitle} when unexpected inputs or failures happen.`,
            spokenPrompt: isAm
              ? `በ ${cleanTitle} ውስጥ ስህተቶች ሲያጋጥሙ ሂደቱ እንዴት እንደሚፈጸም አስረዱ?`
              : `Walk me through the precise step-by-step causal chain in ${cleanTitle} during unexpected failures?`,
            targetDimension: currentTurn.targetDimension,
            tier: 'harder_probe',
          }
        : undefined;

      return {
        score,
        tier: 'harder_probe',
        feedback: isAm
          ? 'ያልተሟላ ማብራሪያ። የምክንያትና ውጤት ሂደቱ ጠለቅ ያለ ማብራሪያ ያስፈልገዋል።'
          : 'Partial explanation lacking specific failure boundary conditions. Deepen your causal mechanism.',
        misconceptions: [isAm ? 'የድንበር ሁኔታዎች አልተገለጹም' : 'Omitted boundary condition verification'],
        mastered: false,
        needsFollowUp: canFollowUp,
        followUpTurn,
      };
    }

    // Score < 5: Mini-lesson tier
    const miniLesson = isAm
      ? `በ ${cleanTitle} ውስጥ ዋናው ደንብ ማንኛውም ለውጥ ከመጽደቁ በፊት ግልጽ የሆነ የደረጃ ቅደም ተከተል መከተል አለበት። አንድ እርምጃ ካልተሳካ ስርዓቱ እንዳይበላሽ ለውጡ ውድቅ መደረግ አለበት።`
      : `In ${cleanTitle}, the core rule is that state transitions must follow a strict causal order from input to output. If an intermediate step fails or violates invariants, changes must not be applied so the system remains consistent.`;

    const followUpTurn: GateQuestionTurn | undefined = canFollowUp
      ? {
          id: `${currentTurn.id}-probe-${attemptNumber}`,
          index: currentTurn.index,
          isFollowUp: true,
          parentQuestionId: currentTurn.id,
          question: isAm
            ? `ይህን አጭር ትምህርት መሰረት በማድረግ፡ በ ${cleanTitle} ውስጥ አንዱ እርምጃ ካልተሳካ ለውጡ በቋሚነት እንዳይመዘገብ መከልከል ያለበት ለምንድን ነው?`
            : `Applying this mini-lesson: why must ${cleanTitle} prevent state changes from taking effect if an intermediate step fails?`,
          spokenPrompt: isAm
            ? `አንዱ እርምጃ ካልተሳካ ለውጡ እንዳይመዘገብ መከልከል ያለበት ለምንድን ነው?`
            : `Why must ${cleanTitle} prevent state changes if an intermediate step fails?`,
          targetDimension: currentTurn.targetDimension,
          tier: 'mini_lesson',
          miniLesson,
        }
      : undefined;

    return {
      score,
      tier: 'mini_lesson',
      feedback: isAm
        ? 'መሰረታዊ ክፍተቶች ታይተዋል። ከዚህ በታች ያለውን አጭር ትምህርት ይመልከቱ።'
        : 'Foundational gaps identified. Review the mini-lesson below to reconstruct your intuition.',
      miniLesson,
      misconceptions: [isAm ? 'የመሰረታዊ ግንዛቤ ክፍተት' : 'Foundational mental model gap'],
      mastered: false,
      needsFollowUp: canFollowUp,
      followUpTurn,
    };
  }

  const tabooWordsDirective = tabooWords.length > 0
    ? `TABOO BUZZWORDS INVARIANT:
The learner is STRICTLY FORBIDDEN from using these buzzwords: ${tabooWords.join(', ')}.
If they used any of them, penalize their score heavily (maximum score 4) and instruct them to re-explain in plain English without buzzwords.`
    : '';

  const systemPrompt = `You are the Ater Socratic Gate Evaluator conducting a live, intense oral defense for: "${lessonTitle}".
Current Question (${currentTurn.targetDimension}): "${currentTurn.question}"
Student Explanation: "${cleanAnswer}"
Interrogation Attempt: #${attemptNumber} (Max: ${maxAttempts})

LANGUAGE DIRECTIVE:
${isAm ? "Feedback, miniLesson, and follow-up must be strictly in articulate Amharic (አማርኛ) using Ge'ez script. Zero latin characters." : "Feedback, miniLesson, and follow-up in clear English."}

${tabooWordsDirective}

EVALUATION & SOCRATIC PROGRESSION INVARIANTS:
Score strictly 1 to 10 based on first-principles causality, mechanistic precision, and boundary awareness.
Apply the EXACT 4-tier pedagogical progression rules:

1. Score < 5 (Foundational Gaps / Score 1-4):
   - "tier": "mini_lesson"
   - "miniLesson": Exactly 2 concise, crystal-clear conversational sentences teaching the core intuition or causal mechanism directly.
   - "feedback": 1 concise sentence noting the foundational gap.
   - "needsFollowUp": ${canFollowUp ? 'true' : 'false'}
   - "mastered": false
   - "followUpQuestion": A targeted probe testing the specific concept just taught in the mini-lesson.
   - "followUpSpokenPrompt": Clean spoken text ending with a question mark (?).

2. Score 5 to 7 (Partial Comprehension / Score 5-7):
   - "tier": "harder_probe"
   - "feedback": 1-2 sentences slightly explaining what was missed or lacking causal precision.
   - "needsFollowUp": ${canFollowUp ? 'true' : 'false'}
   - "mastered": false
   - "followUpQuestion": A harder, more demanding question probing deeper execution mechanics, failure modes, or edge conditions.
   - "followUpSpokenPrompt": Clean spoken text ending with a question mark (?).

3. Score 8 to 9 (Strong Comprehension / Score 8-9):
   - "tier": "refinement"
   - If Attempt #${attemptNumber} == 1:
     - "needsFollowUp": true
     - "mastered": false
     - "feedback": 1 sentence commending sound understanding and requesting refinement.
     - "followUpQuestion": A sharp clarification and refinement question on an edge nuance or subtle condition.
     - "followUpSpokenPrompt": Clean spoken text ending with a question mark (?).
   - If Attempt #${attemptNumber} > 1:
     - "needsFollowUp": false
     - "mastered": true
     - "feedback": 1-2 analytical sentences verifying why their refined mental model is sound and complete.

4. Score 10 (First-Principles Mastery / Score 10):
   - "tier": "perfect_pass"
   - "needsFollowUp": false
   - "mastered": true
   - "feedback": 1-2 sentences verifying perfect first-principles intuition and mechanistic rigor.

CRITICAL FORMATTING INVARIANTS:
- Zero emojis under any circumstances.
- Continuous prose only. No bullet points or markdown headings.

Respond ONLY with valid JSON:
{
  "score": number,
  "tier": "mini_lesson" | "harder_probe" | "refinement" | "perfect_pass",
  "miniLesson": "string",
  "feedback": "string",
  "misconceptions": ["string"],
  "mastered": boolean,
  "needsFollowUp": boolean,
  "followUpQuestion": "string",
  "followUpSpokenPrompt": "string"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 1 },
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      return {
        score: 10,
        tier: 'perfect_pass',
        feedback: isAm ? 'ግንዛቤዎ ተረጋግጧል።' : 'Comprehension verified.',
        misconceptions: [],
        mastered: true,
        needsFollowUp: false,
      };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return {
        score: 6,
        tier: 'harder_probe',
        feedback: 'Evaluated response.',
        misconceptions: [],
        mastered: false,
        needsFollowUp: canFollowUp,
      };
    }

    const parsed = extractJsonFromResponse(rawText);
    let score = Math.max(1, Math.min(10, Math.round(Number(parsed.score) || 6)));

    // Deterministically enforce taboo words violation even if model missed it
    if (hasTabooViolation) {
      score = Math.min(score, 4);
    }

    let tier: SocraticTier;
    let mastered = false;
    let needsFollowUp = false;

    if (score === 10) {
      tier = 'perfect_pass';
      mastered = true;
      needsFollowUp = false;
    } else if (score >= 8) {
      tier = 'refinement';
      if (attemptNumber === 1) {
        mastered = false;
        needsFollowUp = true;
      } else {
        mastered = true;
        needsFollowUp = false;
      }
    } else if (score >= 5) {
      tier = 'harder_probe';
      mastered = false;
      needsFollowUp = canFollowUp;
    } else {
      tier = 'mini_lesson';
      mastered = false;
      needsFollowUp = canFollowUp;
    }

    let feedback = cleanContinuousProse(stripEmojis(parsed.feedback || 'Response evaluated.'));
    if (hasTabooViolation) {
      feedback = isAm
        ? `የተከለከለውን ቃል ተጠቅመዋል፡ ${violatedTabooWords.join(', ')}። ፅንሰ-ሀሳቡን ያለ ቴክኒካዊ ቃላት በግልጽ ቋንቋ ያስረዱ።`
        : `You used the forbidden word: ${violatedTabooWords.join(', ')}. Explain the concept in plain English without relying on buzzwords.`;
    }

    const miniLesson = tier === 'mini_lesson' && parsed.miniLesson ? cleanContinuousProse(stripEmojis(parsed.miniLesson)) : undefined;
    const misconceptions = Array.isArray(parsed.misconceptions) ? parsed.misconceptions.map(stripEmojis) : [];
    if (hasTabooViolation) {
      misconceptions.push(`Relied on forbidden buzzwords: ${violatedTabooWords.join(', ')}`);
    }

    let followUpTurn: GateQuestionTurn | undefined = undefined;
    if (needsFollowUp && parsed.followUpQuestion) {
      followUpTurn = {
        id: `${currentTurn.id}-probe-${attemptNumber}`,
        index: currentTurn.index,
        isFollowUp: true,
        parentQuestionId: currentTurn.id,
        question: hasTabooViolation
          ? (isAm
              ? `የተከለከሉትን ቃላት (${violatedTabooWords.join(', ')}) ሳትጠቀሙ የ ${cleanTitle}ን ፅንሰ-ሀሳብ እንደገና ያስረዱ።`
              : `Re-explain ${cleanTitle} in plain English without using: ${violatedTabooWords.join(', ')}.`)
          : stripEmojis(parsed.followUpQuestion),
        spokenPrompt: sanitizeSpokenPrompt(
          hasTabooViolation
            ? (isAm ? `${violatedTabooWords.join(', ')} የሚሉትን ሳትጠቀሙ ማስረዳት ትችላላችሁ?` : `Can you explain ${cleanTitle} without using ${violatedTabooWords.join(', ')}?`)
            : (parsed.followUpSpokenPrompt || parsed.followUpQuestion)
        ),
        targetDimension: currentTurn.targetDimension,
        tier,
        miniLesson,
      };
    }

    return {
      score,
      tier,
      feedback,
      miniLesson,
      misconceptions,
      mastered,
      needsFollowUp,
      followUpTurn,
      violatedTabooWords: hasTabooViolation ? violatedTabooWords : undefined,
    };
  } catch (_err) {
    return {
      score: 6,
      tier: 'harder_probe',
      feedback: isAm ? 'የቀረበው ማብራሪያ ተመዝግቧል።' : 'Explanation recorded.',
      misconceptions: [],
      mastered: false,
      needsFollowUp: false,
    };
  }
}

/**
 * Concludes a Socratic Gate session across all completed turns.
 * Computes average score, pass threshold (score >= 8.0), and summarizes diagnostic feedback.
 */
export function finalizeGateSession(
  turns: GateQuestionTurn[],
  lessonTitle: string,
  language: 'en' | 'am' = 'en'
): {
  passed: boolean;
  overallScore: number;
  summaryFeedback: string;
  misconceptions: string[];
  remediationTopic?: string;
} {
  const isAm = language === 'am';
  if (turns.length === 0) {
    return {
      passed: false,
      overallScore: 0,
      summaryFeedback: isAm ? 'ምንም ጥያቄ አልተመለሰም።' : 'No questions answered.',
      misconceptions: ['Session incomplete'],
    };
  }

  const scores = turns.map((t) => Number(t.score) || 0);
  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  const overallScore = Math.round((totalScore / scores.length) * 10) / 10;

  const allMisconceptions = turns.flatMap((t) => t.misconceptions || []).filter(Boolean);
  const uniqueMisconceptions = Array.from(new Set(allMisconceptions));

  const passed = overallScore >= 8.0 && !scores.some((s) => s < 4);

  const cleanTitle = stripEmojis(lessonTitle);

  if (passed) {
    return {
      passed: true,
      overallScore,
      summaryFeedback: isAm
        ? `እጅግ በጣም ጥሩ። የ ${cleanTitle}ን መሰረታዊ ፅንሰ-ሀሳቦች እና የአሰራር ሂደቶች ያለ ስህተት አስረድተዋል። ትምህርቱ በተሳካ ሁኔታ ተጠናቋል።`
        : `Mastery confirmed. You articulated the core intuition, execution cycles, and boundary conditions of ${cleanTitle} with first-principles rigor. Next lesson unlocked.`,
      misconceptions: [],
    };
  }

  const primaryGap = uniqueMisconceptions[0] || (isAm ? 'የአሰራር ሂደት እና የድንበር ወጥመዶች' : 'Operational mechanics and boundary failure modes');
  const remediationTopic = `${cleanTitle}: ${primaryGap}`;

  return {
    passed: false,
    overallScore,
    summaryFeedback: isAm
      ? `በ ${cleanTitle} ማብራሪያዎ ውስጥ አንዳንድ ወሳኝ ክፍተቶች ታይተዋል። በተለይም፡ ${uniqueMisconceptions.join(', ') || 'የስርዓቱ የአሰራር ገደቦች'}። ትክክለኛ ግንዛቤ ለመገንባት የማካካሻ ትምህርት ተዘጋጅቷል።`
      : `Your explanation demonstrated effort, but identified critical gaps in: ${uniqueMisconceptions.join('; ') || 'core boundary safety properties'}. A micro-remediation lesson has been dynamically added to repair this invariant before advancing.`,
    misconceptions: uniqueMisconceptions,
    remediationTopic,
  };
}
