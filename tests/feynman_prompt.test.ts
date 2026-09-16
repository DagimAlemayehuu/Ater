import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/ai/feynman-prompt/route';
import { NextRequest } from 'next/server';

describe('Socratic Feynman Prompt API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejects missing concept with 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/ai/feynman-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Concept is required');
  });

  it('generates a Socratic challenge question with taboo words and spoken prompt', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    question: "How would a council of generals agree on a plan if messengers might be traitors?",
                    tabooWords: ["consensus", "byzantine"],
                    spokenPrompt: "How would a council of generals agree on an attack plan if some messengers might be traitors?"
                  })
                }
              ]
            }
          }
        ]
      })
    });

    const req = new NextRequest('http://localhost:3000/api/ai/feynman-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: 'Byzantine Fault Tolerance' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.question).toBeDefined();
    expect(typeof data.question).toBe('string');
    expect(Array.isArray(data.tabooWords)).toBe(true);
    expect(data.tabooWords.length).toBeGreaterThanOrEqual(1);
    expect(data.spokenPrompt).toBeDefined();
  });
});
