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
 * Deterministically constructs the 3 initial open-ended questions for the Socratic Gate.
 */
export function generateFallbackGateQuestions(
  lessonTitle: string,
  language: 'en' | 'am' = 'en'
): GateQuestionTurn[] {
  const isAm = language === 'am';
  const cleanTitle = stripEmojis(lessonTitle || (isAm ? 'ትምህርት' : 'Foundational Lesson')).trim();

  return isAm
    ? [
        {
          id: 'turn-1',
          index: 1,
          question: `የ ${cleanTitle}ን ዋና ፅንሰ-ሀሳብ እንደ ኮረም ወይም ስልተ-ቀመር ያሉ ውስብስብ ቴክኒካዊ ቃላትን ሳትጠቀሙ ለ12 ዓመት ልጅ እንዴት ታስረዱታላችሁ?`,
          spokenPrompt: `የ ${cleanTitle}ን ዋና ፅንሰ-ሀሳብ ምንም ዓይነት ውስብስብ ቴክኒካዊ ቃላት ሳትጠቀሙ ለ12 ዓመት ልጅ አስረዱ።`,
          targetDimension: 'intuition',
        },
        {
          id: 'turn-2',
          index: 2,
          question: `በ ${cleanTitle} የአሰራር ዑደት ውስጥ፣ መልእክቶች ከክፍል ወደ ክፍል እንዴት እንደሚዘዋወሩ እና ለውጡ በስርዓቱ ላይ በቋሚነት ከመጽደቁ በፊት ምን ዓይነት ማረጋገጫ እንደሚካሄድ ደረጃ በደረጃ አብራሩ።`,
          spokenPrompt: `በ ${cleanTitle} ውስጥ መልእክቶች እንዴት እንደሚተላለፉ እና ለውጡ ከመጽደቁ በፊት ምን እንደሚረጋገጥ ደረጃ በደረጃ አስረዱ።`,
          targetDimension: 'mechanism',
        },
        {
          id: 'turn-3',
          index: 3,
          question: `በአውታረ መረብ መቆራረጥ ወይም ክፍሎች ድንገት በሚጠፉበት ጊዜ ስርዓቱ እንዳይበላሽ ወይም የተሳሳተ መረጃ እንዳይመዘገብ የትኞቹ የደህንነት ወሰኖች ይጠብቁታል?`,
          spokenPrompt: `የአውታረ መረብ መቆራረጥ ሲፈጠር ስርዓቱ እንዳይበላሽ የትኞቹ የደህንነት ወሰኖች ይጠብቁታል?`,
          targetDimension: 'boundary',
        },
      ]
    : [
        {
          id: 'turn-1',
          index: 1,
          question: `Explain the core intuitive mental model of ${cleanTitle} as if teaching a 12-year-old, strictly avoiding technical buzzwords like consensus, quorum, or algorithm.`,
          spokenPrompt: `Explain the core mental model of ${cleanTitle} to a twelve-year-old, without using technical jargon like quorum or consensus?`,
          targetDimension: 'intuition',
        },
        {
          id: 'turn-2',
          index: 2,
          question: `Walk me through the exact step-by-step causal chain of events during an operational cycle in ${cleanTitle}. How are proposals validated before a commit is finalized?`,
          spokenPrompt: `Walk me through the step-by-step operational cycle in ${cleanTitle}. How are state changes validated before being committed?`,
          targetDimension: 'mechanism',
        },
        {
          id: 'turn-3',
          index: 3,
          question: `What is the primary boundary failure mode of ${cleanTitle}? Specifically, what happens during an asymmetric network partition, and how is split-brain prevented?`,
          spokenPrompt: `What happens during a network partition in ${cleanTitle}, and how does the architecture prevent conflicting states?`,
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
          generationConfig: { responseMimeType: 'application/json' },
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

export interface EvaluateGateTurnOptions {
  lessonTitle: string;
  currentTurn: GateQuestionTurn;
  studentAnswer: string;
  attemptNumber?: number;
  language?: 'en' | 'am';
  useMock?: boolean;
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
  const { lessonTitle, currentTurn, studentAnswer, attemptNumber = 1, language = 'en', useMock = false } = options;
  const isAm = language === 'am';
  const cleanAnswer = stripEmojis(studentAnswer).trim();
  const isUnknown =
    !cleanAnswer ||
    /^(i\s*don'?t\s*know|idk|no\s*idea|not\s*sure|what|help|i\s*do\s*not\s*know|don'?t\s*know|አላውቅም|አላውቀውም)$/i.test(
      cleanAnswer.toLowerCase()
    );

  const maxAttempts = 4;
  const canFollowUp = attemptNumber < maxAttempts;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey || isUnknown) {
    if (isUnknown) {
      const miniLesson = isAm
        ? `ማንኛውም የተከፋፈለ ስርዓት አለመግባባትን ለመከላከል አብላጫ ድምፅ (Quorum) ይፈልጋል። ሁለት ክፍሎች ተቆራርጠው እያንዳንዳቸው መሪ ነን ቢሉ መረጃው ይጋጫል። ስለዚህ ከአጠቃላይ ክፍሎች ከግማሽ በላይ ድጋፍ ያገኘው ብቻ ውሳኔ እንዲያሳልፍ ይደረጋል።`
        : `Distributed architectures require an odd-numbered quorum (strict majority) to prevent conflicting updates. When a network partition occurs, only the side with more than half the total membership may commit writes, safely rejecting writes on the minority side to prevent split-brain divergence.`;

      const followUpTurn: GateQuestionTurn | undefined = canFollowUp
        ? {
            id: `${currentTurn.id}-probe-${attemptNumber}`,
            index: currentTurn.index,
            isFollowUp: true,
            parentQuestionId: currentTurn.id,
            question: isAm
              ? `ይህን መነሻ በማድረግ፡ 5 ክፍሎች ባሉት ስርዓት ውስጥ አውታረ መረቡ በ3 እና በ2 ቢከፈል፣ መረጃ መመዝገብ የሚችለው የትኛው ክፍል ነው? ለምን?`
              : `Based on this rule: if a network partition splits a 5-node cluster into 3 nodes and 2 nodes, which side is permitted to commit state changes, and why?`,
            spokenPrompt: isAm
              ? `5 ክፍሎች ያሉት ስርዓት በ3 እና በ2 ቢከፈል፣ መረጃ መመዝገብ የሚችለው የትኛው ነው?`
              : `If a five node cluster splits into three and two nodes, which side commits updates and why?`,
            targetDimension: currentTurn.targetDimension,
            tier: 'mini_lesson',
            miniLesson,
          }
        : undefined;

      return {
        score: 1,
        tier: 'mini_lesson',
        feedback: isAm
          ? 'አለማወቅን በግልጽ መናገር ጥሩ ጅምር ነው። ከዚህ በታች የቀረበውን አጭር ትምህርት በጥሞና ያንብቡ።'
          : 'Admitting uncertainty is honest. Study the mini-lesson below to grasp the causal rule.',
        miniLesson,
        misconceptions: [isAm ? 'የፅንሰ-ሀሳብ አለመረዳት' : 'Knowledge gap acknowledged'],
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
              ? `ግንዛቤዎ ጠንካራ ነው። ነገር ግን አንድ ወሳኝ ጥቃቅን ነጥብ ያብራሩ፡ ስርዓቱ ያልተጠናቀቀ ዝውውርን በሚያጋጥመው ጊዜ የመጨረሻውን ሁኔታ እንዴት ያረጋግጣል?`
              : `Your explanation is strong. To finalize mastery, clarify this edge nuance: how does the coordinator guarantee monotonicity if the network drops the final acknowledgment packet?`,
            spokenPrompt: isAm
              ? `ስርዓቱ ያልተጠናቀቀ ዝውውር ሲያጋጥመው የመጨረሻውን ሁኔታ እንዴት ያረጋግጣል?`
              : `How is monotonicity preserved if the network drops the final acknowledgment packet?`,
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
              ? `አመክንዮውን በከፊል ገልጸዋል። አሁን ወደ ከበደው ጥያቄ እንለፍ፡ በአውታረ መረብ መዘግየት ወቅት የስርዓቱ ሁኔታ እንዳይዛባ የትኞቹ የደህንነት ወሰኖች ይሰራሉ?`
              : `You captured the basic premise, but missed the causal mechanism. Let us push deeper: how does the system detect and resolve conflicting timestamps during high network latency without an external clock?`,
            spokenPrompt: isAm
              ? `በከፍተኛ መዘግየት ወቅት የስርዓቱ ሁኔታ እንዳይዛባ የትኞቹ ወሰኖች ይጠብቁታል?`
              : `How does the system resolve conflicting timestamps without an external clock?`,
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
      ? `ዋናው የአሰራር ሂደት፡ ማንኛውም የውሳኔ ሃሳብ ከመጽደቁ በፊት በአብላጫ ክፍሎች መጽደቅ አለበት። ይህ ካልሆነ ሁለት የተለያዩ ቡድኖች ለየብቻ ውሳኔ በማሳለፍ መረጃውን ያበላሹታል።`
      : `Core Invariant: State changes require causal validation across a strict quorum before committing. Without an odd-numbered majority agreement, parallel disjoint updates cause fatal split-brain state divergence.`;

    const followUpTurn: GateQuestionTurn | undefined = canFollowUp
      ? {
          id: `${currentTurn.id}-probe-${attemptNumber}`,
          index: currentTurn.index,
          isFollowUp: true,
          parentQuestionId: currentTurn.id,
          question: isAm
            ? `ይህን አጭር ትምህርት መሰረት በማድረግ፡ የውሳኔ ሃሳቡ ከመጽደቁ በፊት አብላጫ ድምፅ የሚያስፈልገው ለምንድን ነው?`
            : `Applying this mini-lesson: why must a proposal achieve strict quorum before being finalized into permanent state?`,
          spokenPrompt: isAm
            ? `የውሳኔ ሃሳቡ ከመጽደቁ በፊት አብላጫ ድምፅ የሚያስፈልገው ለምንድን ነው?`
            : `Why must a proposal achieve strict quorum before being finalized into permanent state?`,
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

  const systemPrompt = `You are the Ater Socratic Gate Evaluator conducting a live, intense oral defense for: "${lessonTitle}".
Current Question (${currentTurn.targetDimension}): "${currentTurn.question}"
Student Explanation: "${cleanAnswer}"
Interrogation Attempt: #${attemptNumber} (Max: ${maxAttempts})

LANGUAGE DIRECTIVE:
${isAm ? "Feedback, miniLesson, and follow-up must be strictly in articulate Amharic (አማርኛ) using Ge'ez script. Zero latin characters." : "Feedback, miniLesson, and follow-up in clear English."}

EVALUATION & SOCRATIC PROGRESSION INVARIANTS:
Score strictly 1 to 10 based on first-principles causality, mechanistic precision, and boundary awareness.
Apply the EXACT 4-tier pedagogical progression rules:

1. Score < 5 (Foundational Gaps / Score 1-4):
   - "tier": "mini_lesson"
   - "miniLesson": Exactly 2-3 concise, crystal-clear sentences teaching the core intuition or causal mechanism directly.
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
          generationConfig: { responseMimeType: 'application/json' },
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
    const score = Math.max(1, Math.min(10, Math.round(Number(parsed.score) || 6)));

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

    const feedback = cleanContinuousProse(stripEmojis(parsed.feedback || 'Response evaluated.'));
    const miniLesson = tier === 'mini_lesson' && parsed.miniLesson ? cleanContinuousProse(stripEmojis(parsed.miniLesson)) : undefined;
    const misconceptions = Array.isArray(parsed.misconceptions) ? parsed.misconceptions.map(stripEmojis) : [];

    let followUpTurn: GateQuestionTurn | undefined = undefined;
    if (needsFollowUp && parsed.followUpQuestion) {
      followUpTurn = {
        id: `${currentTurn.id}-probe-${attemptNumber}`,
        index: currentTurn.index,
        isFollowUp: true,
        parentQuestionId: currentTurn.id,
        question: stripEmojis(parsed.followUpQuestion),
        spokenPrompt: sanitizeSpokenPrompt(parsed.followUpSpokenPrompt || parsed.followUpQuestion),
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
