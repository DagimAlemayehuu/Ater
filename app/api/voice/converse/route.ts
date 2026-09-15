import { NextRequest, NextResponse } from 'next/server';
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 });
    }

    const userText = (body?.text || body?.transcript || '').trim();
    const history = Array.isArray(body?.history) ? body.history : [];
    const base64Audio = body?.audio;
    const mimeType = (body?.mimeType || 'audio/webm').split(';')[0].trim();
    const activeNoteTitle = body?.activeNoteTitle || '';
    const papers = Array.isArray(body?.papers) ? body.papers : [];

    const language = (body?.language || 'en').toLowerCase();
    const isAmharic = language === 'am' || language.startsWith('am');

    if (!userText && !base64Audio) {
      return NextResponse.json({ error: 'Audio or text input is required' }, { status: 400 });
    }

    const historyContext = history.length > 0
      ? `\nPREVIOUS CONVERSATION IN THIS THREAD:\n${history.map((h: any) => `${h.role === 'user' ? 'Learner' : 'Teacher'}: ${h.content}`).join('\n')}\n`
      : '';

    const systemPrompt = isAmharic
      ? `You are the Ater Voice Intelligence Co-pilot and expert Socratic tutor, teaching Dagim in Amharic (አማርኛ).
Current State:
- Active Lesson: ${activeNoteTitle ? `"${activeNoteTitle}"` : 'None'}
- Available Units: ${papers.length > 0 ? papers.map((p: any, i: number) => `[${i + 1}] ${p.title}`).join(', ') : 'None'}
${historyContext}
${userText ? `Learner Spoken/Written Input: "${userText}"` : "Listen to the user's spoken audio directly, extract the transcript."}

CROSS-LANGUAGE COMPREHENSION & TARGET RESPONSE RULES:
1. CROSS-LANGUAGE TRANSLATION:
   - Understand the learner's intent whether in English, phonetic Amharic, or Amharic Ge'ez script.
   - In "transcript", provide the Amharic Ge'ez script interpretation.
2. TARGET RESPONSE LANGUAGE:
   - Your response MUST ALWAYS be strictly in fluent, natural, grammatically correct Amharic (አማርኛ) using Ge'ez script.
   - ZERO English words or latin alphabet letters in "summary", "thought", and "spokenResponse".
3. ZERO GREETINGS & ZERO WELCOMING FLUFF:
   - NEVER say "እንኳን ደህና መጣህ", "ሰላም", or any welcoming introductory pleasantries.
   - Jump immediately and directly into the core answer in the very first word.
4. THOUGHT & SUMMARY:
   - "thought": A 1-2 sentence thinking trace explaining your reasoning strategy in Amharic.
   - "summary": A crisp, 1-sentence key takeaway answering the core question directly in Amharic.
   - "spokenResponse": 3 to 5 articulate sentences explaining the intuition, mechanism, and causality in Amharic with zero fluff.
5. ACTIONS:
   - QUESTIONS / EXPLANATIONS: Deep, articulate pedagogical answer in Amharic. Action: "none".
   - ROADMAP / CURRICULUM: If learner asks to build a roadmap, action "compile" with payload { "title": "concept" }.
   - FEYNMAN SPARRING: If user asks to test themselves, action "open_feynman" with payload { "concept": "${activeNoteTitle || 'active concept'}" }.

INVARIANTS:
- STRICT ZERO EMOJIS anywhere.
- Zero markdown bullets or list markers.

Respond ONLY with valid JSON:
{
  "transcript": "${userText || 'string'}",
  "thought": "string",
  "summary": "string",
  "spokenResponse": "string",
  "action": {
    "type": "none" | "search" | "compile" | "open_feynman",
    "payload": {}
  }
}`
      : `You are the Ater Voice Intelligence Co-pilot and expert Socratic tutor, teaching Dagim in English.
Current State:
- Active Lesson: ${activeNoteTitle ? `"${activeNoteTitle}"` : 'None'}
- Available Units: ${papers.length > 0 ? papers.map((p: any, i: number) => `[${i + 1}] ${p.title}`).join(', ') : 'None'}
${historyContext}
${userText ? `Learner Spoken/Written Input: "${userText}"` : "Listen to the user's spoken audio directly, extract the transcript."}

CROSS-LANGUAGE COMPREHENSION & TARGET RESPONSE RULES:
1. CROSS-LANGUAGE TRANSLATION:
   - If learner speaks/writes in Amharic or English, understand and translate the learner's intent into English.
   - In "transcript", provide the English transcript/translation.
2. TARGET RESPONSE LANGUAGE:
   - Your response MUST ALWAYS be strictly in clear, articulate, fluent English.
3. ZERO GREETINGS & ZERO WELCOMING FLUFF:
   - NEVER say "Welcome Dagim", "Hello", "Welcome to...", "Great question", "Certainly", or any throat-clearing pleasantries.
   - Jump immediately and directly into answering the question in the very first sentence.
4. THOUGHT & SUMMARY:
   - "thought": A 1-2 sentence pedagogical thinking trace explaining your reasoning and mental model selection.
   - "summary": A crisp, 1-sentence key takeaway answering the question directly in simple plain English.
   - "spokenResponse": 3 to 5 articulate, direct sentences explaining intuition, causality, and practical mechanisms in plain English with zero fluff.
5. ACTIONS:
   - QUESTIONS / EXPLANATIONS: Deep, articulate pedagogical answer explaining intuition and causality directly. Action: "none".
   - ROADMAP / CURRICULUM: If learner asks to build a roadmap, action "compile" with payload { "title": "concept" }.
   - FEYNMAN SPARRING: If user asks to test themselves, action "open_feynman" with payload { "concept": "${activeNoteTitle || 'active concept'}" }.

INVARIANTS:
- STRICT ZERO EMOJIS anywhere.
- Zero markdown bullets or list markers.

Respond ONLY with valid JSON:
{
  "transcript": "${userText || 'string'}",
  "thought": "string",
  "summary": "string",
  "spokenResponse": "string",
  "action": {
    "type": "none" | "search" | "compile" | "open_feynman",
    "payload": {}
  }
}`;

    const parts: any[] = [];
    if (!userText && base64Audio) {
      parts.push({ inlineData: { mimeType, data: base64Audio } });
    }
    parts.push({ text: systemPrompt });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 900,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      throw new Error(`Gemini processing failed with status ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response from Gemini');

    const result = extractJsonFromResponse(rawText);
    const spokenResponse = result.spokenResponse || (isAmharic ? 'ዝግጁ ነኝ።' : 'Ready.');
    const transcript = result.transcript || userText || '';
    const thought = result.thought || (isAmharic ? 'ዋናውን ፅንሰ-ሀሳብ እና የአሰራር ሂደት በመተንተን ላይ።' : 'Analyzing the core mental model and clarifying the causal mechanism.');
    const summary = result.summary || (spokenResponse.split('.')[0] + '.' || spokenResponse);
    const action = result.action || { type: 'none', payload: {} };

    // Synthesize spokenResponse briskly using Jenny Neural (en) or Mekdes Neural (am)
    let audioBase64 = '';
    try {
      const voice = isAmharic ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural';
      const tts = new EdgeTTS({ voice, rate: '+10%' });
      const tmpPath = path.join(os.tmpdir(), `tts_fast_${crypto.randomBytes(8).toString('hex')}.mp3`);
      await tts.ttsPromise(spokenResponse, tmpPath);
      const audioBuffer = fs.readFileSync(tmpPath);
      audioBase64 = audioBuffer.toString('base64');
      try { fs.unlinkSync(tmpPath); } catch (_e) {}
    } catch (ttsErr) {
      console.warn('Fast TTS generation warning:', ttsErr);
    }

    return NextResponse.json({
      transcript,
      thought,
      summary,
      spokenResponse,
      action,
      audioBase64,
    });
  } catch (err: any) {
    console.error('Converse Route Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process voice conversation' },
      { status: 500 }
    );
  }
}
