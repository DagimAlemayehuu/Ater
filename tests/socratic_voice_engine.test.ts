import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  downsampleTo16k,
  int16ToBase64,
  base64ToInt16,
} from '@/lib/voice/audioProcessor';
import {
  saveCourseToStore,
  getCoursesFromStore,
  updateLessonMasteryInStore,
  clearUserSessionCache,
} from '@/lib/sync/store';
import type { CourseCurriculum } from '@/types';

describe('Socratic Voice Engine Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    clearUserSessionCache('test-user');
    vi.clearAllMocks();
  });

  describe('1. Audio Linear Downsampling & PCM Chunk Formatting', () => {
    it('downsamples 48kHz Float32 audio to 16kHz Int16 PCM with 3:1 ratio', () => {
      const inputRate = 48000;
      const inputLength = 4800; // 100ms at 48kHz
      const inputData = new Float32Array(inputLength);

      // Create a 1kHz sine wave normalized to [-0.8, 0.8]
      for (let i = 0; i < inputLength; i++) {
        inputData[i] = Math.sin((2 * Math.PI * 1000 * i) / inputRate) * 0.8;
      }

      const int16Result = downsampleTo16k(inputData, inputRate);

      // 48000 / 16000 = 3 => 4800 / 3 = 1600
      expect(int16Result).toBeInstanceOf(Int16Array);
      expect(int16Result.length).toBe(1600);

      // Verify values fit within 16-bit signed range [-32768, 32767]
      for (let i = 0; i < int16Result.length; i++) {
        expect(int16Result[i]).toBeGreaterThanOrEqual(-32768);
        expect(int16Result[i]).toBeLessThanOrEqual(32767);
      }
    });

    it('downsamples 44.1kHz Float32 audio to 16kHz Int16 PCM correctly', () => {
      const inputRate = 44100;
      const inputLength = 4410; // 100ms at 44.1kHz
      const inputData = new Float32Array(inputLength);

      for (let i = 0; i < inputLength; i++) {
        inputData[i] = 0.5;
      }

      const int16Result = downsampleTo16k(inputData, inputRate);
      const expectedLength = Math.round(4410 / (44100 / 16000)); // 1600
      expect(int16Result.length).toBe(expectedLength);

      // Constant 0.5 should map to ~16383 in 16-bit signed PCM
      expect(int16Result[0]).toBeGreaterThan(16000);
      expect(int16Result[0]).toBeLessThan(16500);
    });

    it('clamps out-of-range floats to [-1.0, 1.0] without integer overflow', () => {
      const inputData = new Float32Array([1.5, -2.0, 0.0]);
      const int16Result = downsampleTo16k(inputData, 16000);

      expect(int16Result[0]).toBe(32767);
      expect(int16Result[1]).toBe(-32768);
      expect(int16Result[2]).toBe(0);
    });

    it('formats Int16Array to base64 and roundtrips via base64ToInt16', () => {
      const original = new Int16Array([0, 1000, -1000, 32767, -32768]);
      const b64 = int16ToBase64(original);

      expect(typeof b64).toBe('string');
      expect(b64.length).toBeGreaterThan(0);

      const restored = base64ToInt16(b64);
      expect(restored.length).toBe(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(restored[i]).toBe(original[i]);
      }
    });
  });

  describe('2. Tool Calling Handling: gradeExplanation updates lib/sync/store.ts', () => {
    const mockCourse: CourseCurriculum = {
      id: 'course-voice-test',
      topic: 'Recursion and Algorithms',
      title: 'Recursion and Algorithms',
      targetGoal: 'Master recursive problem solving without buzzword crutches',
      activeLessonId: 'lesson-rec-01',
      createdAt: new Date().toISOString(),
      lessons: [
        {
          id: 'lesson-rec-01',
          order: 1,
          title: '01. Conceptual Intuition of Self-Similarity',
          slug: 'self-similarity',
          summary: 'Intuition behind recursive reduction',
          status: 'active',
          estimatedMinutes: 10,
          prerequisites: [],
        },
        {
          id: 'lesson-rec-02',
          order: 2,
          title: '02. Termination Conditions & Invariants',
          slug: 'termination-invariants',
          summary: 'Preventing runaway loops',
          status: 'locked',
          estimatedMinutes: 15,
          prerequisites: ['lesson-rec-01'],
        },
        {
          id: 'lesson-rec-03',
          order: 3,
          title: '03. Divide and Conquer Reductions',
          slug: 'divide-conquer',
          summary: 'Splitting problems into subproblems',
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-rec-02'],
        },
      ],
    };

    it('marks lesson mastered and unlocks next lesson when score >= 80', async () => {
      const uid = 'test-user';
      await saveCourseToStore(mockCourse, uid);

      const result = await updateLessonMasteryInStore(
        'course-voice-test',
        'lesson-rec-01',
        90,
        'Excellent explanation using pure first principles without taboo words.',
        uid
      );

      expect(result.passed).toBe(true);
      expect(result.updatedCurriculum).not.toBeNull();

      const lesson1 = result.updatedCurriculum?.lessons.find((l) => l.id === 'lesson-rec-01');
      const lesson2 = result.updatedCurriculum?.lessons.find((l) => l.id === 'lesson-rec-02');
      const lesson3 = result.updatedCurriculum?.lessons.find((l) => l.id === 'lesson-rec-03');

      expect(lesson1?.status).toBe('mastered');
      expect(lesson2?.status).toBe('active');
      expect(lesson3?.status).toBe('locked');

      // Verify persisted state in store
      const persistedCourses = await getCoursesFromStore(uid);
      const persistedCourse = persistedCourses.find((c) => c.id === 'course-voice-test');
      expect(persistedCourse?.lessons[0].status).toBe('mastered');
      expect(persistedCourse?.lessons[1].status).toBe('active');
      expect(persistedCourse?.lessons[2].status).toBe('locked');
    });

    it('does NOT mark lesson mastered or unlock next lesson when score < 80', async () => {
      const uid = 'test-user';
      await saveCourseToStore(mockCourse, uid);

      const result = await updateLessonMasteryInStore(
        'course-voice-test',
        'lesson-rec-01',
        65,
        'Explanation relied on vague intuition and missed the termination invariant.',
        uid
      );

      expect(result.passed).toBe(false);

      const lesson1 = result.updatedCurriculum?.lessons.find((l) => l.id === 'lesson-rec-01');
      const lesson2 = result.updatedCurriculum?.lessons.find((l) => l.id === 'lesson-rec-02');

      expect(lesson1?.status).toBe('active');
      expect(lesson2?.status).toBe('locked');
    });
  });

  describe('3. Mode Switching & Socratic Voice Session State', () => {
    it('initializes in Library Mode as default silent text and switches to Voice Mode', async () => {
      const { createSocraticVoiceSession } = await import('@/lib/voice/socraticSession');

      const session = createSocraticVoiceSession({
        topic: 'Recursion',
        tabooWords: ['base case', 'stack', 'call itself'],
        initialMode: 'library',
        isMuted: true,
      });

      expect(session.getMode()).toBe('library');
      expect(session.isAudioMuted()).toBe(true);

      // Switching to Voice Mode
      session.setMode('voice');
      expect(session.getMode()).toBe('voice');

      // Audio unmute toggle
      session.setMuted(false);
      expect(session.isAudioMuted()).toBe(false);
    });

    it('enforces strict hold-to-talk in Voice Mode (start capture on press, end_of_turn on release)', async () => {
      const { createSocraticVoiceSession } = await import('@/lib/voice/socraticSession');

      const sentMessages: any[] = [];
      const mockWs = {
        readyState: 1, // WebSocket.OPEN
        send: vi.fn((data: string) => {
          sentMessages.push(JSON.parse(data));
        }),
      };

      const session = createSocraticVoiceSession({
        topic: 'Recursion',
        tabooWords: ['base case', 'stack', 'call itself'],
        initialMode: 'voice',
        mockWs: mockWs as any,
      });

      // Press Spacebar / Orb to speak
      session.handleHoldToTalkStart();
      expect(session.isRecording()).toBe(true);

      // Send raw audio chunk
      session.feedAudioChunk(new Float32Array(4800), 48000);
      expect(sentMessages.length).toBe(1);
      expect(sentMessages[0].type).toBe('audio_chunk');
      expect(typeof sentMessages[0].data).toBe('string');

      // Release Spacebar / Orb to transmit
      session.handleHoldToTalkEnd();
      expect(session.isRecording()).toBe(false);
      expect(sentMessages.length).toBe(2);
      expect(sentMessages[1].type).toBe('end_of_turn');
      expect(sentMessages[1].is_audio).toBe(true);
    });

    it('dispatches gradeExplanation tool call to onGrade and onToolCall callbacks', async () => {
      const { createSocraticVoiceSession } = await import('@/lib/voice/socraticSession');

      const gradeCallback = vi.fn();
      const toolCallback = vi.fn();
      const session = createSocraticVoiceSession({
        topic: 'Recursion',
        tabooWords: ['base case', 'stack', 'call itself'],
        onGrade: gradeCallback,
        onToolCall: toolCallback,
      });

      // Simulate incoming tool_call from Gemini Live server
      await session.handleServerMessage({
        type: 'tool_call',
        id: 'call_123',
        name: 'gradeExplanation',
        args: { score: 92, feedback: 'Strong conceptual clarity.' },
      });

      expect(gradeCallback).toHaveBeenCalledWith({
        score: 92,
        feedback: 'Strong conceptual clarity.',
        id: 'call_123',
      });
      expect(toolCallback).toHaveBeenCalledWith({
        name: 'gradeExplanation',
        args: { score: 92, feedback: 'Strong conceptual clarity.' },
        id: 'call_123',
      });
    });

    it('dispatches advanceQuestion and triggerMiniLesson through onToolCall', async () => {
      const { createSocraticVoiceSession } = await import('@/lib/voice/socraticSession');

      const toolCallback = vi.fn();
      const session = createSocraticVoiceSession({
        topic: 'B-Tree Indexing',
        tabooWords: ['binary search', 'balanced tree', 'sorted order'],
        onToolCall: toolCallback,
      });

      await session.handleServerMessage({
        type: 'tool_call',
        id: 'call_adv',
        name: 'advanceQuestion',
        args: { nextIndex: 2, feedback: 'Solid explanation.' },
      });

      expect(toolCallback).toHaveBeenCalledWith({
        name: 'advanceQuestion',
        args: { nextIndex: 2, feedback: 'Solid explanation.' },
        id: 'call_adv',
      });

      await session.handleServerMessage({
        type: 'tool_call',
        id: 'call_mini',
        name: 'triggerMiniLesson',
        args: { reason: 'misconception', coreConcept: 'Page node splits' },
      });

      expect(toolCallback).toHaveBeenCalledWith({
        name: 'triggerMiniLesson',
        args: { reason: 'misconception', coreConcept: 'Page node splits' },
        id: 'call_mini',
      });
    });
  });

  describe('4. B-Tree Indexing Mock Lesson: Taboo Detection and Socratic Mastery', () => {
    const mockBTreeCourse: CourseCurriculum = {
      id: 'course-btree-test',
      topic: 'B-Tree Indexing',
      title: 'B-Tree Indexing Architecture',
      targetGoal: 'Master B-Tree node layout and split causality without taboo buzzwords',
      activeLessonId: 'lesson-btree-01',
      createdAt: new Date().toISOString(),
      lessons: [
        {
          id: 'lesson-btree-01',
          order: 1,
          title: '01. Disk Block Allocation & Cache-Line Alignment',
          slug: 'disk-block-allocation',
          summary: 'Why flat arrays fail on non-volatile block storage',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
        },
        {
          id: 'lesson-btree-02',
          order: 2,
          title: '02. Causal Splitting & Median Key Promotion',
          slug: 'node-splitting',
          summary: 'Maintaining height invariance during saturation',
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-btree-01'],
        },
      ],
    };

    const bTreeTabooWords = ['binary search', 'balanced tree', 'sorted order'];

    it('detects taboo violations in student response accurately', async () => {
      const { detectTabooWordViolations } = await import('@/lib/ai/gate');

      const cleanExplanation = 'Each node contains a block of keys sized to page boundaries. When it fills up, the median key rises to the parent.';
      const violatedExplanation = 'It works like a binary search over a balanced tree with sorted order keys.';

      const cleanViolations = detectTabooWordViolations(cleanExplanation, bTreeTabooWords);
      expect(cleanViolations).toEqual([]);

      const dirtyViolations = detectTabooWordViolations(violatedExplanation, bTreeTabooWords);
      expect(dirtyViolations).toContain('binary search');
      expect(dirtyViolations).toContain('balanced tree');
      expect(dirtyViolations).toContain('sorted order');
    });

    it('persists B-Tree oral defense mastery into store and unlocks next lesson', async () => {
      const uid = 'btree-student';
      await saveCourseToStore(mockBTreeCourse, uid);

      const masteryResult = await updateLessonMasteryInStore(
        'course-btree-test',
        'lesson-btree-01',
        88,
        'Excellent explanation of page cache lines without relying on taboo crutches.',
        uid
      );

      expect(masteryResult.passed).toBe(true);
      const lesson1 = masteryResult.updatedCurriculum?.lessons.find((l) => l.id === 'lesson-btree-01');
      const lesson2 = masteryResult.updatedCurriculum?.lessons.find((l) => l.id === 'lesson-btree-02');

      expect(lesson1?.status).toBe('mastered');
      expect(lesson2?.status).toBe('active');

      const savedCourses = await getCoursesFromStore(uid);
      const savedCourse = savedCourses.find((c) => c.id === 'course-btree-test');
      expect(savedCourse?.lessons[0].status).toBe('mastered');
      expect(savedCourse?.lessons[1].status).toBe('active');
    });
  });

  describe('5. Supabase Isolation Verification', () => {
    it('verifies Supabase client methods resolve in-memory without timing out', async () => {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const client = getSupabaseBrowserClient();

      expect(client).toBeDefined();
      const res = await client?.from('test_table').select('*').eq('id', '123');
      expect(res).toBeDefined();
      expect(res?.error).toBeNull();
    });
  });
});
