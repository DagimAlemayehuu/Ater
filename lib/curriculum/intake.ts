import type {
  IntakeRequest,
  IntakeResponse,
  SocraticDiscoveryQuestion,
  SocraticQuestionCategory,
} from '@/types';
import { extractJsonFromResponse } from '@/lib/ai/gemini';

/**
 * Remove all emoji characters from text strings.
 */
export function stripEmojis(text: string): string {
  if (!text) return '';
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      ''
    )
    .trim();
}

/**
 * Ensures prose is continuous analytical text adhering to the Zero-Bullet Invariant.
 * Strips list markers, bullet characters (-, *, +, 1.), and collapses whitespace.
 */
export function cleanContinuousProse(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => line.replace(/^[\s]*([-*+•]|\d+[\.)]|\(\d+\))\s+/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/[\s]*[-*+•]\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format questions for vocalization via Edge Neural TTS (en-US-JennyNeural at +8% rate).
 * Strips markdown symbols, code formatting, and bullet prefixes; expands abbreviations;
 * and ensures proper terminal question inflection.
 */
export function sanitizeSpokenPrompt(text: string): string {
  if (!text) return '';
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~#|]/g, '')
    .replace(/[\[\]]/g, '')
    .replace(/^[\s]*([-*+•]|\d+[\.)]|\(\d+\)|Q\d+:?|Question\s*\d+:?)\s*/i, '')
    .replace(/\be\.g\.,?\s*/gi, 'for example, ')
    .replace(/\bi\.e\.,?\s*/gi, 'that is, ')
    .replace(/\betc\.\b/gi, 'and so on')
    .replace(/\bvs\.?\b/gi, 'versus')
    .replace(/<=/g, 'less than or equal to')
    .replace(/>=/g, 'greater than or equal to')
    .replace(/!=/g, 'not equal to')
    .replace(/\s+/g, ' ')
    .trim();

  const stripped = stripEmojis(cleaned);
  if (!stripped) return '';

  const withoutTrailingPunct = stripped.replace(/[.,!?;]+$/, '').trim();
  return withoutTrailingPunct ? `${withoutTrailingPunct}?` : '';
}

/**
 * Checks if a string contains valid base64-encoded PDF magic bytes.
 */
export function isPdfBase64(base64: string): boolean {
  if (!base64 || typeof base64 !== 'string') return false;
  const clean = base64.replace(/^data:[^;]+;base64,/, '').trim();
  if (clean.length < 8) return false;
  return clean.startsWith('JVBERi0');
}

/**
 * Generates a deterministic, calibrated IntakeResponse with 3 Socratic discovery questions
 * conforming to zero-bullet and voice TTS invariants.
 */
export function generateFallbackIntake(topicHint?: string, language: 'en' | 'am' = 'en'): IntakeResponse {
  const isAm = language === 'am';
  const cleanTopic = (topicHint || (isAm ? 'የተሰራጩ ስርዓቶች' : 'Distributed Systems and Consensus'))
    .replace(/[_-]/g, ' ')
    .replace(/\.pdf$/i, '')
    .trim();

  const topic = cleanTopic ? cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1) : (isAm ? 'የተሰራጩ ስርዓቶች' : 'Distributed Systems');

  return isAm
    ? {
        topic,
        initialSummary: `ስለ ${topic} መሰረታዊ መርሆች፣ የአሰራር ሚዛኖች እና የድንበር ሁኔታዎች አጠቃላይ ጥናት።`,
        questions: [
          {
            id: 'q1',
            question: `ስለ ${topic} ለመማር ዋናው ግብዎ ምንድን ነው?`,
            spokenPrompt: `ስለ ${topic} ለመማር ዋናው አላማዎ ምንድን ነው? ተግባራዊ ፕሮጀክት ለመስራት ወይስ የንድፈ-ሀሳብ መሰረቱን ለመረዳት ይፈልጋሉ?`,
            category: 'goal',
            conceptTarget: 'የትምህርት ግብ እና አተገባበር',
            difficulty: 'L1',
            options: [
              'ተግባራዊ ፕሮጀክት ከባዶ መስራት',
              'የአልጎሪዝም እና የሂሳብ ማረጋገጫዎችን መረዳት',
              'ለቴክኒካል ቃለ-መጠይቅ ወይም ፈተና መዘጋጀት',
              'አጠቃላይ ግንዛቤ እና ፅንሰ-ሀሳባዊ እውቀት ማግኘት',
            ],
          },
          {
            id: 'q2',
            question: `በ ${topic} ዙሪያ ያለዎት የቀደመ እውቀት ምን ይመስላል?`,
            spokenPrompt: `ትምህርቱን እንደ እርስዎ ደረጃ ለማዘጋጀት፣ ከዚህ በፊት በ ${topic} ላይ ምን ያህል ልምድ አለዎት?`,
            category: 'baseline',
            conceptTarget: 'የቀደመ እውቀት ደረጃ',
            difficulty: 'L2',
            options: [
              'ምንም አይነት የቀደመ እውቀት የሌለኝ አዲስ ጀማሪ',
              'መሰረታዊውን አውቃለሁ፣ ዝርዝር አሰራሩን መማር እፈልጋለሁ',
              'ልምድ ያለኝ ባለሙያ፣ ውስብስብ ክፍተቶችን መረዳት እፈልጋለሁ',
              'የአካዳሚክ እና የምርምር እውቀት ያለኝ',
            ],
          },
          {
            id: 'q3',
            question: `የትምህርቱ ጥልቀት እስከምን ድረስ እንዲሆን ይፈልጋሉ?`,
            spokenPrompt: `በ ${topic} ውስጥ ወደ ውስብስብ የስህተት ወጥመዶች እና ዝርዝር አሰራሮች ምን ያህል በጥልቀት መግባት ይፈልጋሉ?`,
            category: 'depth',
            conceptTarget: 'የትምህርት ጥልቀት እና ገደቦች',
            difficulty: 'L3',
            options: [
              'በእውነተኛ የስራ አለም የስህተት ወጥመዶች ላይ ማተኮር',
              'ፅንሰ-ሀሳብን ከተግባራዊ ምሳሌዎች ጋር ማመጣጠን',
              'ጥልቅ ማረጋገጫዎች እና የስርዓት ደህንነት ትንተና',
              'ፈጣን እና ፅንሰ-ሀሳብ ላይ ያተኮረ ጉዞ',
            ],
          },
        ],
      }
    : {
        topic,
        initialSummary: `A clear, step-by-step guide to ${topic}, covering core ideas, practical examples, and common mistakes.`,
        questions: [
          {
            id: 'q1',
            question: `What is your main goal with ${topic}?`,
            spokenPrompt: `What is your main goal with ${topic}? Do you want to build a real project or understand the core ideas?`,
            category: 'goal',
            conceptTarget: 'Learning goal',
            difficulty: 'L1',
            options: [
              'Build a working project from scratch',
              'Understand the core concepts and ideas',
              'Prepare for an interview or exam',
              'Get a simple step-by-step overview',
            ],
          },
          {
            id: 'q2',
            question: `What is your experience level with ${topic}?`,
            spokenPrompt: `How much experience do you have with ${topic}?`,
            category: 'baseline',
            conceptTarget: 'Experience level',
            difficulty: 'L2',
            options: [
              'Complete beginner with zero background',
              'Know the basics, want to learn more',
              'Experienced, want advanced tips and details',
              'Academic background, want thorough understanding',
            ],
          },
          {
            id: 'q3',
            question: `How deep would you like to go?`,
            spokenPrompt: `How deep would you like to dive into ${topic}?`,
            category: 'depth',
            conceptTarget: 'Course depth',
            difficulty: 'L3',
            options: [
              'Focus on common mistakes and practical tips',
              'Balance simple intuition with hands-on examples',
              'Deep technical dive',
              'Quick high-level summary',
            ],
          },
        ],
      };
}

export interface UploadedFileItem {
  fileName: string;
  fileBase64?: string;
  fileType?: string;
  textContent?: string;
}

export interface AnalyzeIntakeOptions {
  type?: 'prompt' | 'pdf' | 'document' | 'file';
  prompt?: string;
  pdfBase64?: string;
  fileName?: string;
  filename?: string;
  files?: UploadedFileItem[];
  useMock?: boolean;
  throwOnError?: boolean;
  language?: 'en' | 'am';
}

const VALID_CATEGORIES: SocraticQuestionCategory[] = ['goal', 'baseline', 'depth', 'style', 'followup'];

/**
 * Analyzes dual intake material (text prompt or multiple uploaded files) using gemini-3.5-flash-lite,
 * extracting the learning topic and generating 3-5 calibrated Socratic discovery questions.
 */
export async function analyzeIntakeMaterial(
  promptOrOptions?: string | AnalyzeIntakeOptions,
  pdfBase64Arg?: string,
  optionsOrFilename?: { fileName?: string; filename?: string; files?: UploadedFileItem[]; useMock?: boolean; throwOnError?: boolean; language?: 'en' | 'am' } | string
): Promise<IntakeResponse> {
  let prompt = '';
  let pdfBase64 = '';
  let fileName = '';
  let files: UploadedFileItem[] = [];
  let useMock = false;
  let throwOnError = false;
  let language: 'en' | 'am' = 'en';

  if (typeof promptOrOptions === 'object' && promptOrOptions !== null) {
    prompt = promptOrOptions.prompt || '';
    pdfBase64 = promptOrOptions.pdfBase64 || '';
    fileName = promptOrOptions.fileName || promptOrOptions.filename || '';
    files = promptOrOptions.files || [];
    useMock = !!promptOrOptions.useMock;
    throwOnError = !!promptOrOptions.throwOnError;
    language = promptOrOptions.language === 'am' ? 'am' : 'en';
  } else {
    prompt = typeof promptOrOptions === 'string' ? promptOrOptions : '';
    pdfBase64 = typeof pdfBase64Arg === 'string' ? pdfBase64Arg : '';
    if (typeof optionsOrFilename === 'string') {
      fileName = optionsOrFilename;
    } else if (typeof optionsOrFilename === 'object' && optionsOrFilename !== null) {
      fileName = optionsOrFilename.fileName || optionsOrFilename.filename || '';
      files = optionsOrFilename.files || [];
      useMock = !!optionsOrFilename.useMock;
      throwOnError = !!optionsOrFilename.throwOnError;
      language = optionsOrFilename.language === 'am' ? 'am' : 'en';
    }
  }

  const isAm = language === 'am';
  const trimmedPrompt = prompt.trim();
  const trimmedPdf = pdfBase64.trim();
  const trimmedFileName = fileName.trim();

  // If a single file was provided via legacy parameters, convert to files list
  if (files.length === 0 && (trimmedPdf || trimmedFileName)) {
    files.push({
      fileName: trimmedFileName || 'document.pdf',
      fileBase64: trimmedPdf,
      fileType: trimmedFileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
    });
  }

  if (!trimmedPrompt && files.length === 0) {
    throw new Error('Missing intake content: either prompt or uploaded files must be provided');
  }

  let derivedTopic = trimmedPrompt.slice(0, 60);
  if (!derivedTopic && files.length > 0) {
    derivedTopic = files[0].fileName
      .replace(/\.[a-zA-Z0-9]+$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();
  }
  if (!derivedTopic) derivedTopic = isAm ? 'የተሰራጩ ስርዓቶች' : 'Foundational Computing';

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey) {
    return generateFallbackIntake(derivedTopic, language);
  }

  const languageDirective = isAm
    ? `CRITICAL LANGUAGE INVARIANT:
You MUST author the entire output (topic, initialSummary, questions, spokenPrompt, options) strictly in natural, articulate Amharic (አማርኛ) using Ge'ez script. Zero English letters or latin script.`
    : `CRITICAL LANGUAGE INVARIANT:
Author the entire output in clear, articulate English.`;

  const filesSummary = files.map((f) => `- ${f.fileName} (${f.fileType || 'document'})`).join('\n');

  const systemPrompt = `You are a friendly teacher conducting an interview to understand the student's exact goal.
Use VERY simple, plain, everyday English. Absolutely ZERO academic jargon and ZERO complex words.

${languageDirective}

Material Details:
${trimmedPrompt ? `User Prompt: "${trimmedPrompt}"` : ''}
${files.length > 0 ? `Uploaded Learning Materials:\n${filesSummary}` : ''}

CRITICAL INVARIANTS:
1. Extract "topic": A concise canonical title of the domain or subject (2-5 words).
2. Formulate "initialSummary": Exactly 1-2 analytical sentences summarizing the core focus. STRICT INVARIANT: Continuous prose only, strictly zero bullet points, asterisks, plus signs, or numbered list prefixes.
3. Formulate "questions": Generate diagnostic Socratic discovery questions tailored to the input.
   - If the user prompt is broad, short, or vague (e.g. "learn programming", "AI", "physics"), formulate 4 to 5 foundational diagnostic questions (probing specific sub-domain, target real-world project, prior baseline, target depth, and preferred focus).
   - If the user prompt is detailed or provided via PDF/syllabus files, formulate 3 to 4 focused diagnostic questions.
   - Question Categories: "goal", "baseline", "depth", "style", "followup".
4. Question Schema Fields:
   - "id": Unique string identifier ("q1", "q2", "q3", etc.).
   - "question": Written text formatted clearly for screen reading.
   - "spokenPrompt": Conversational question written specifically for Edge Neural TTS vocalization (clean spoken text, ending with a question mark ?, no markdown formatting, no bullet prefixes).
   - "category": One of "goal", "baseline", "depth", "style", "followup".
   - "conceptTarget": Specific prerequisite or learning attribute being probed.
   - "difficulty": One of "L1", "L2", "L3".
   - "options": An array of exactly 3-4 concise, diverse, realistic student calibration answers tailored precisely to this question.
5. STRICT INVARIANT: ZERO EMOJIS in any text field.
6. STRICT INVARIANT: spokenPrompt must be clean, natural spoken text without markdown formatting, asterisks, backticks, brackets, or URLs, and must end with a question mark ?.

Respond with ONLY valid JSON matching this schema:
{
  "topic": "string",
  "initialSummary": "string",
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "spokenPrompt": "string",
      "category": "goal",
      "conceptTarget": "string",
      "difficulty": "L1",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
    }
  ]
}`;

  const parts: any[] = [];
  // Attach inline document data
  for (const f of files.slice(0, 5)) {
    if (f.fileBase64) {
      const cleanBase64 = f.fileBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
      const mime = f.fileType || (f.fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain');
      if (mime === 'application/pdf' || mime.startsWith('text/')) {
        parts.push({
          inlineData: {
            mimeType: mime === 'application/pdf' ? 'application/pdf' : 'text/plain',
            data: cleanBase64,
          },
        });
      }
    } else if (f.textContent) {
      parts.push({
        text: `Content from ${f.fileName}:\n${f.textContent.slice(0, 10000)}`,
      });
    }
  }
  parts.push({ text: systemPrompt });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      if (throwOnError) {
        throw new Error(`Gemini intake API returned status ${response.status}`);
      }
      return generateFallbackIntake(derivedTopic, language);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      if (throwOnError) {
        throw new Error('Empty response from Gemini intake model');
      }
      return generateFallbackIntake(derivedTopic, language);
    }

    const parsed = extractJsonFromResponse(rawText);
    const resolvedTopic = stripEmojis(parsed.topic || derivedTopic).trim() || derivedTopic;
    const resolvedSummary = cleanContinuousProse(
      stripEmojis(parsed.initialSummary || `An exploration of ${resolvedTopic} focusing on foundational mechanics.`)
    );

    const rawQuestions: any[] = Array.isArray(parsed.questions) ? parsed.questions : [];
    const normalizedQuestions: SocraticDiscoveryQuestion[] = rawQuestions.map((q, idx) => {
      const id = String(q.id || `q${idx + 1}`);
      const question = stripEmojis(String(q.question || '')).trim();
      const rawSpoken = q.spokenPrompt ? String(q.spokenPrompt) : question;
      const spokenPrompt = sanitizeSpokenPrompt(rawSpoken) || sanitizeSpokenPrompt(question);
      const rawCat = String(q.category || '').toLowerCase();
      const category: SocraticQuestionCategory = VALID_CATEGORIES.includes(rawCat as SocraticQuestionCategory)
        ? (rawCat as SocraticQuestionCategory)
        : idx === 0
          ? 'goal'
          : idx === 1
            ? 'baseline'
            : 'depth';
      const conceptTarget = stripEmojis(String(q.conceptTarget || resolvedTopic)).trim();
      const rawDiff = String(q.difficulty || '').toUpperCase();
      const difficulty = rawDiff === 'L1' || rawDiff === 'L2' || rawDiff === 'L3' ? rawDiff : `L${Math.min(idx + 1, 3)}`;

      const options = Array.isArray(q.options) && q.options.length > 0
        ? q.options.map((opt: any) => stripEmojis(String(opt)).trim()).filter(Boolean)
        : undefined;

      return {
        id,
        question: question || `What aspect of ${resolvedTopic} would you like to explore?`,
        spokenPrompt,
        category,
        conceptTarget,
        difficulty,
        options,
      };
    });

    // Invariant: Enforce between 2 and 4 questions
    let finalQuestions = normalizedQuestions.slice(0, 4);
    if (finalQuestions.length < 2) {
      const fallbackQuestions = generateFallbackIntake(resolvedTopic, language).questions;
      for (const fq of fallbackQuestions) {
        if (finalQuestions.length >= 2) break;
        if (!finalQuestions.some((q) => q.category === fq.category)) {
          finalQuestions.push({
            ...fq,
            id: `q${finalQuestions.length + 1}`,
          });
        }
      }
    }

    return {
      topic: resolvedTopic,
      initialSummary: resolvedSummary,
      questions: finalQuestions,
    };
  } catch (err: any) {
    if (throwOnError) {
      throw err;
    }
    return generateFallbackIntake(derivedTopic, language);
  }
}
