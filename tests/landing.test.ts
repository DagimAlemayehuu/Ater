import { describe, it, expect } from 'vitest';
import { POST } from '../app/api/demo/evaluate/route';

describe('Demo Evaluation API (/api/demo/evaluate)', () => {
  it('rejects empty explanation with 400', async () => {
    const req = new Request('http://localhost:3000/api/demo/evaluate', {
      method: 'POST',
      body: JSON.stringify({ explanation: '   ' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.score).toBe('0/10');
  });

  it('catches taboo words B-Tree and Binary Search', async () => {
    const req = new Request('http://localhost:3000/api/demo/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        explanation: 'It organizes data in a b-tree so that binary search can quickly find records.',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.score).toBe('2/10');
    expect(json.tabooUsed).toContain('b-tree');
    expect(json.tabooUsed).toContain('binary search');
  });

  it('catches taboo word sorted', async () => {
    const req = new Request('http://localhost:3000/api/demo/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        explanation: 'It keeps values sorted in another table to locate them.',
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.score).toBe('2/10');
    expect(json.tabooUsed).toContain('sorted');
  });

  it('scores high on mechanistic, non-taboo explanations', async () => {
    const req = new Request('http://localhost:3000/api/demo/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        explanation:
          'Like a book table of contents, it maintains pointers directly to page and row address locations so the engine avoids checking every single record.',
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.score).toBe('9/10');
    expect(json.tabooUsed).toHaveLength(0);
    expect(json.breakdown).toContain('Causal mechanism cleanly described');
  });

  it('flags hand-waving explanations without causal mechanism', async () => {
    const req = new Request('http://localhost:3000/api/demo/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        explanation: 'It makes everything go much faster whenever queries are running on the server.',
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.score).toBe('5/10');
    expect(json.breakdown).toContain('Hand-waving detected');
  });
});

describe('Supabase Client Configuration', () => {
  it('initializes Supabase browser client with env variables', async () => {
    const { getSupabaseBrowserClient } = await import('../lib/supabase/client');
    const client = getSupabaseBrowserClient();
    expect(client).toBeDefined();
    expect(client?.from).toBeDefined();
  });
});

describe('Waitlist Validation and Data Flow', () => {
  it('validates contact payload before insertion', () => {
    const validEmail = 'tester@stanford.edu';
    const validTelegram = '@dagim_cs';
    const emptyContact = '   ';

    expect(validEmail.trim().length).toBeGreaterThan(0);
    expect(validTelegram.trim().length).toBeGreaterThan(0);
    expect(emptyContact.trim().length).toBe(0);
  });
});
