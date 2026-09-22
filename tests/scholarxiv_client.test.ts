import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScholarxivClient,
  normalizePaper,
  extractKeyInsight,
  matchQueryToDomain,
  searchScholarxivPapers,
  getScholarxivPaper,
  DOMAIN_FIXTURES,
  getAllFallbackPapers,
} from '../lib/scholarxiv/client';

describe('Scholarxiv Client & Metadata Engine', () => {
  describe('1. Metadata Normalization Suite', () => {
    it('normalizes raw arXiv payload to fully typed ScholarxivPaper with guaranteed fields', () => {
      const rawPayload = {
        id: 'https://arxiv.org/abs/1706.03762v7',
        extractedID: '1706.03762v7',
        title: '  Attention Is   All You Need\n ',
        summary: '  The dominant sequence transduction models are based on complex RNNs.  ',
        authors: ['Ashish Vaswani', 'Noam Shazeer'],
        published: '2017-06-12T17:57:34Z',
        primaryCategory: 'cs.CL',
        category: ['cs.CL', 'cs.LG'],
        pdfLink: 'https://arxiv.org/pdf/1706.03762v7',
        absLink: 'https://arxiv.org/abs/1706.03762v7',
      };

      const normalized = normalizePaper(rawPayload);

      expect(normalized.id).toBe('https://arxiv.org/abs/1706.03762v7');
      expect(normalized.extractedID).toBe('1706.03762v7');
      expect(normalized.title).toBe('Attention Is All You Need');
      expect(normalized.authors).toEqual(['Ashish Vaswani', 'Noam Shazeer']);
      expect(normalized.year).toBe(2017);
      expect(normalized.abstract).toBe(
        'The dominant sequence transduction models are based on complex RNNs.'
      );
      expect(normalized.url).toBe('https://arxiv.org/abs/1706.03762v7');
      expect(normalized.doi).toBe('10.48550/arXiv.1706.03762');
      expect(normalized.categories).toEqual(['cs.CL', 'cs.LG']);
      expect(normalized.keyInsight).toBeTruthy();
      expect(typeof normalized.keyInsight).toBe('string');
    });

    it('extracts numeric year correctly from date strings and arXiv IDs', () => {
      const paperWithDate = normalizePaper({
        title: 'Test Paper 1',
        published: '2022-05-27T00:00:00Z',
      });
      expect(paperWithDate.year).toBe(2022);

      const paperWithArxivId = normalizePaper({
        title: 'Test Paper 2',
        extractedID: '1407.03762',
      });
      expect(paperWithArxivId.year).toBe(2014);

      const paperWithExplicitYear = normalizePaper({
        title: 'Test Paper 3',
        year: 1999,
      });
      expect(paperWithExplicitYear.year).toBe(1999);
    });

    it('parses authors from array, comma-separated string, or fallback', () => {
      const fromArray = normalizePaper({
        title: 'Paper A',
        authors: ['Leslie Lamport'],
      });
      expect(fromArray.authors).toEqual(['Leslie Lamport']);

      const fromString = normalizePaper({
        title: 'Paper B',
        authorsRaw: 'Diego Ongaro, John Ousterhout and Mendel Rosenblum',
      });
      expect(fromString.authors).toEqual(['Diego Ongaro', 'John Ousterhout', 'Mendel Rosenblum']);

      const fallback = normalizePaper({
        title: 'Paper C',
      });
      expect(fallback.authors).toEqual(['Anonymous Researcher']);
    });

    it('extracts key insights using proposal keywords or first sentence', () => {
      const abstractWithProposal =
        'Recurrent networks suffer from sequential bottlenecks. We propose the Transformer, based solely on attention mechanisms. It achieves state of the art results.';
      const insight = extractKeyInsight(abstractWithProposal, 'Transformer');
      expect(insight).toBe('We propose the Transformer, based solely on attention mechanisms.');

      const abstractSimple =
        'Raft is an understandable consensus algorithm for replicated state machines. It separates leader election and log safety.';
      const simpleInsight = extractKeyInsight(abstractSimple, 'Raft');
      expect(simpleInsight).toBe('Raft is an understandable consensus algorithm for replicated state machines.');

      const emptyInsight = extractKeyInsight('', 'Operating Systems');
      expect(emptyInsight).toBe('Theoretical and empirical study of Operating Systems.');
    });
  });

  describe('2. Domain-Indexed Offline Fallback Suite', () => {
    const client = new ScholarxivClient();

    it('returns consensus fixtures when querying consensus or raft', async () => {
      const res = await client.searchPapers({ query: 'raft consensus protocol', useMock: true });
      expect(res.data.length).toBeGreaterThanOrEqual(3);
      expect(res.data.some((p) => p.title.includes('Raft'))).toBe(true);
      expect(res.data.some((p) => p.title.includes('Paxos'))).toBe(true);
      expect(res.data.every((p) => typeof p.year === 'number')).toBe(true);
      expect(res.data.every((p) => p.keyInsight && p.keyInsight.length > 0)).toBe(true);
    });

    it('returns attention fixtures when querying transformer or attention', async () => {
      const res = await client.searchPapers({ query: 'transformer self-attention', useMock: true });
      expect(res.data.length).toBeGreaterThanOrEqual(3);
      expect(res.data.some((p) => p.title.includes('Attention Is All You Need'))).toBe(true);
      expect(res.data.some((p) => p.title.includes('FlashAttention'))).toBe(true);
    });

    it('returns memory fixtures when querying virtual memory or paging', async () => {
      const res = await client.searchPapers({ query: 'virtual memory paging', useMock: true });
      expect(res.data.length).toBeGreaterThanOrEqual(3);
      expect(res.data.some((p) => p.title.includes('PagedAttention') || p.title.includes('MULTICS'))).toBe(true);
    });

    it('returns operating systems fixtures when querying kernel or filesystem', async () => {
      const res = await client.searchPapers({ query: 'microkernel unix operating system', useMock: true });
      expect(res.data.length).toBeGreaterThanOrEqual(3);
      expect(res.data.some((p) => p.title.includes('UNIX') || p.title.includes('seL4'))).toBe(true);
    });

    it('returns composite fallback when query matches no specific domain', async () => {
      const res = await client.searchPapers({ query: 'quantum cryptography algebra', useMock: true });
      expect(res.data.length).toBe(4);
      // Contains top paper from each domain
      expect(res.data.some((p) => p.title.includes('Raft'))).toBe(true);
      expect(res.data.some((p) => p.title.includes('Attention'))).toBe(true);
      expect(res.data.some((p) => p.title.includes('PagedAttention'))).toBe(true);
      expect(res.data.some((p) => p.title.includes('UNIX'))).toBe(true);
    });

    it('handles empty query gracefully with default domain fallback', async () => {
      const res = await client.searchPapers({ query: '' });
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  describe('3. Resilience & Network Failure Suite', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('falls back to domain fixtures when fetch rejects with network error', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const client = new ScholarxivClient({ timeoutMs: 1000 });
      const res = await client.searchPapers({ query: 'distributed consensus' });

      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data.some((p) => p.title.includes('Raft') || p.title.includes('Paxos'))).toBe(true);

      globalThis.fetch = originalFetch;
    });

    it('falls back to domain fixtures when HTTP returns 429 rate limit', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const client = new ScholarxivClient({ timeoutMs: 1000 });
      const res = await client.searchPapers({ query: 'transformers' });

      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data.some((p) => p.title.includes('Attention'))).toBe(true);

      globalThis.fetch = originalFetch;
    });

    it('falls back to domain fixtures when fetch times out', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const client = new ScholarxivClient({ timeoutMs: 50 });
      const res = await client.searchPapers({ query: 'operating systems kernel' });

      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data.some((p) => p.title.includes('UNIX') || p.title.includes('seL4'))).toBe(true);

      globalThis.fetch = originalFetch;
    });
  });

  describe('4. Single Paper Lookup Suite (getPaper)', () => {
    it('retrieves known paper by ID or arXiv identifier from fixtures', async () => {
      const paper = await getScholarxivPaper('1407.03762');
      expect(paper).not.toBeNull();
      expect(paper?.title).toContain('Raft');
      expect(paper?.year).toBe(2014);
      expect(paper?.keyInsight).toBeTruthy();

      const paperAttention = await getScholarxivPaper('1706.03762v7');
      expect(paperAttention).not.toBeNull();
      expect(paperAttention?.title).toContain('Attention Is All You Need');
    });

    it('returns null for non-existent paper without throwing errors', async () => {
      const paper = await getScholarxivPaper('non-existent-paper-xyz-999');
      // When offline/fallback, non-matching ID returns null
      expect(paper).toBeNull();
    });

    it('returns null for empty string or whitespace paperId', async () => {
      const paperEmpty = await getScholarxivPaper('');
      expect(paperEmpty).toBeNull();

      const paperWhitespace = await getScholarxivPaper('   ');
      expect(paperWhitespace).toBeNull();
    });
  });
});
