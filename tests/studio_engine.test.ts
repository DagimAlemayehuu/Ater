import { describe, it, expect, beforeEach } from 'vitest';
import {
  NotebookLMClient,
  createStudioArtifact,
  getStudioStatus,
  executeResearchQuery,
} from '../lib/notebooklm/client';
import { POST as researchQueryPOST } from '../app/api/research/query/route';
import { POST as studioCreatePOST } from '../app/api/studio/create/route';
import { GET as studioStatusGET, POST as studioStatusPOST } from '../app/api/studio/status/route';

describe('Studio Engine & NotebookLM Client', () => {
  let client: NotebookLMClient;

  beforeEach(() => {
    client = new NotebookLMClient({ useMock: true });
  });

  describe('1. Studio Artifact Creation', () => {
    it('dispatches creation for all artifact types with positive estimated duration', async () => {
      const types = [
        'audio',
        'video',
        'slide_deck',
        'report',
        'flashcards',
        'mind_map',
      ] as const;

      for (const artifactType of types) {
        const res = await client.createStudioArtifact({
          artifactType,
          notebookId: 'test-nb-1',
          title: `Test ${artifactType}`,
        });

        expect(res.artifactId).toBeTruthy();
        expect(res.notebookId).toBe('test-nb-1');
        expect(res.artifactType).toBe(artifactType);
        expect(res.estimatedSeconds).toBeGreaterThan(0);
        expect(res.status).toBe('in_progress');
        expect(res.message).toContain('confirm: true');
      }
    });

    it('normalizes slides alias to slide_deck', async () => {
      const res = await client.createStudioArtifact({
        artifactType: 'slides',
        notebookId: 'test-nb-slides',
      });
      expect(res.artifactType).toBe('slide_deck');
    });
  });

  describe('2. Monotonic Progress Tracking & State Transitions', () => {
    it('tracks monotonic progress increments across polling cycles', async () => {
      const created = await client.createStudioArtifact({
        artifactType: 'audio',
        notebookId: 'test-nb-poll',
      });

      const poll1 = await client.getStudioStatus(created.artifactId);
      expect(poll1.status).toBe('in_progress');
      expect(poll1.progress).toBeGreaterThanOrEqual(20);

      const poll2 = await client.getStudioStatus(created.artifactId);
      expect(poll2.status).toBe('in_progress');
      expect(poll2.progress).toBeGreaterThanOrEqual(poll1.progress);

      // Third poll reaches completion threshold in state machine
      const poll3 = await client.getStudioStatus(created.artifactId);
      expect(poll3.status).toBe('completed');
      expect(poll3.progress).toBe(100);
      expect(poll3.mediaUrl).toBeTruthy();
    });

    it('populates mediaUrl for audio and video, and downloadUrl for slides', async () => {
      const audio = await client.createStudioArtifact({ artifactType: 'audio' });
      client.setSessionProgress(audio.artifactId, 100, 'completed');
      const audioStatus = await client.getStudioStatus(audio.artifactId);
      expect(audioStatus.status).toBe('completed');
      expect(audioStatus.mediaUrl).toContain('.ogg');

      const video = await client.createStudioArtifact({ artifactType: 'video' });
      client.setSessionProgress(video.artifactId, 100, 'completed');
      const videoStatus = await client.getStudioStatus(video.artifactId);
      expect(videoStatus.status).toBe('completed');
      expect(videoStatus.mediaUrl).toContain('.mp4');

      const slides = await client.createStudioArtifact({ artifactType: 'slide_deck' });
      client.setSessionProgress(slides.artifactId, 100, 'completed');
      const slidesStatus = await client.getStudioStatus(slides.artifactId);
      expect(slidesStatus.status).toBe('completed');
      expect(slidesStatus.mediaUrl).toContain('.pdf');
      expect(slidesStatus.downloadUrl).toContain('.pdf');
    });

    it('populates content markdown/JSON for report, flashcards, and mind_map', async () => {
      const report = await client.createStudioArtifact({ artifactType: 'report' });
      client.setSessionProgress(report.artifactId, 100, 'completed');
      const reportStatus = await client.getStudioStatus(report.artifactId);
      expect(reportStatus.content).toContain('Consensus');

      const flashcards = await client.createStudioArtifact({ artifactType: 'flashcards' });
      client.setSessionProgress(flashcards.artifactId, 100, 'completed');
      const fcStatus = await client.getStudioStatus(flashcards.artifactId);
      expect(fcStatus.content).toBeTruthy();
      const parsedCards = JSON.parse(fcStatus.content!);
      expect(Array.isArray(parsedCards)).toBe(true);
      expect(parsedCards[0]).toHaveProperty('front');
      expect(parsedCards[0]).toHaveProperty('back');

      const mindMap = await client.createStudioArtifact({ artifactType: 'mind_map' });
      client.setSessionProgress(mindMap.artifactId, 100, 'completed');
      const mmStatus = await client.getStudioStatus(mindMap.artifactId);
      expect(mmStatus.content).toBeTruthy();
      const parsedMap = JSON.parse(mmStatus.content!);
      expect(parsedMap).toHaveProperty('root');
      expect(parsedMap).toHaveProperty('children');
    });

    it('handles simulated generation failure cleanly without throwing', async () => {
      const failArtifact = await client.createStudioArtifact({
        artifactType: 'audio',
        focusPrompt: 'trigger error simulation',
      });
      expect(failArtifact.status).toBe('failed');

      const status = await client.getStudioStatus(failArtifact.artifactId);
      expect(status.status).toBe('failed');
      expect(status.progress).toBe(0);
      expect(status.error).toBeTruthy();
    });
  });

  describe('3. Notebook Management & Source Attachment', () => {
    it('creates and lists notebook containers', async () => {
      const created = await client.createNotebook('Distributed Consensus Course');
      expect(created.notebookId).toBeTruthy();
      expect(created.title).toBe('Distributed Consensus Course');
      expect(created.url).toContain(created.notebookId);

      const list = await client.listNotebooks();
      expect(list.length).toBeGreaterThanOrEqual(3);
      expect(list.some((nb) => nb.title.includes('Raft'))).toBe(true);
    });

    it('attaches text and url sources to notebooks', async () => {
      const textSource = await client.addSource({
        notebookId: 'nb-123',
        sourceType: 'text',
        title: 'Lesson 1 Notes',
        text: 'State machine replication fundamentals...',
      });
      expect(textSource.status).toBe('success');
      expect(textSource.sourceId).toBeTruthy();

      const urlSource = await client.addSource({
        notebookId: 'nb-123',
        sourceType: 'url',
        url: 'https://arxiv.org/abs/1407.03762',
      });
      expect(urlSource.status).toBe('success');
      expect(urlSource.sourceType).toBe('url');
    });
  });

  describe('4. Autonomous Research Query Engine', () => {
    it('executes fast research query returning structured findings', async () => {
      const result = await client.executeResearchQuery({
        query: 'Raft consensus invariants',
        mode: 'fast',
        sources: ['scholarxiv', 'web'],
        useMock: true,
      });

      expect(result.title).toBe('Raft consensus invariants');
      expect(result.summary).toBeTruthy();
      expect(result.takeaways.length).toBeGreaterThan(0);
      expect(result.papers.length).toBeGreaterThan(0);
      expect(result.webCitations?.length).toBeGreaterThan(0);
    });

    it('executes deep research query enforcing web citations and detailed report context', async () => {
      const result = await client.executeResearchQuery({
        query: 'Transformer attention scaling',
        mode: 'deep',
        sources: ['web', 'scholarxiv'],
        useMock: true,
      });

      expect(result.reportContext).toContain('deep');
      expect(result.takeaways.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('5. API Route Handlers Integration', () => {
    describe('/api/research/query route', () => {
      it('rejects empty query with 400', async () => {
        const req = new Request('http://localhost:3000/api/research/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '   ' }),
        });
        const res = await researchQueryPOST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain('Query string is required');
      });

      it('rejects invalid mode with 400', async () => {
        const req = new Request('http://localhost:3000/api/research/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'consensus', mode: 'invalid_mode' }),
        });
        const res = await researchQueryPOST(req);
        expect(res.status).toBe(400);
      });

      it('rejects invalid source with 400', async () => {
        const req = new Request('http://localhost:3000/api/research/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'consensus', sources: ['invalid_source'] }),
        });
        const res = await researchQueryPOST(req);
        expect(res.status).toBe(400);
      });

      it('executes federated search successfully returning 200 with ResearchFinding', async () => {
        const req = new Request('http://localhost:3000/api/research/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'Raft consensus', mode: 'fast', useMock: true }),
        });
        const res = await researchQueryPOST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe('success');
        expect(json.data.title).toBe('Raft consensus');
        expect(json.data.papers.length).toBeGreaterThan(0);
        expect(json.data.takeaways.length).toBeGreaterThan(0);
      });
    });

    describe('/api/studio/create route', () => {
      it('rejects missing artifactType with 400', async () => {
        const req = new Request('http://localhost:3000/api/studio/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const res = await studioCreatePOST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toContain('artifactType is required');
      });

      it('rejects invalid artifactType with 400', async () => {
        const req = new Request('http://localhost:3000/api/studio/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artifactType: 'hologram' }),
        });
        const res = await studioCreatePOST(req);
        expect(res.status).toBe(400);
      });

      it('creates artifact returning 200 with artifactId and estimatedSeconds', async () => {
        const req = new Request('http://localhost:3000/api/studio/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artifactType: 'audio',
            topic: 'Distributed Systems',
            useMock: true,
          }),
        });
        const res = await studioCreatePOST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe('success');
        expect(json.artifactId).toBeTruthy();
        expect(json.artifactType).toBe('audio');
        expect(json.estimatedSeconds).toBeGreaterThan(0);
      });

      it('normalizes slides alias to slide_deck in route', async () => {
        const req = new Request('http://localhost:3000/api/studio/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artifactType: 'slides', useMock: true }),
        });
        const res = await studioCreatePOST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.artifactType).toBe('slide_deck');
      });
    });

    describe('/api/studio/status route', () => {
      it('rejects missing artifactId in GET with 400', async () => {
        const req = new Request('http://localhost:3000/api/studio/status');
        const res = await studioStatusGET(req);
        expect(res.status).toBe(400);
      });

      it('rejects missing artifactId in POST with 400', async () => {
        const req = new Request('http://localhost:3000/api/studio/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const res = await studioStatusPOST(req);
        expect(res.status).toBe(400);
      });

      it('handles mockStatus=in_progress returning progress percentage', async () => {
        const req = new Request(
          'http://localhost:3000/api/studio/status?artifactId=art-audio-1&mockStatus=in_progress&progress=65'
        );
        const res = await studioStatusGET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe('success');
        expect(json.data.status).toBe('in_progress');
        expect(json.data.progress).toBe(65);
      });

      it('handles mockStatus=completed returning 100% and mediaUrl', async () => {
        const req = new Request(
          'http://localhost:3000/api/studio/status?artifactId=art-video-1&mockStatus=completed'
        );
        const res = await studioStatusGET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe('success');
        expect(json.data.status).toBe('completed');
        expect(json.data.progress).toBe(100);
        expect(json.data.mediaUrl).toContain('.mp4');
      });

      it('handles mockStatus=failed returning status failed with error', async () => {
        const req = new Request(
          'http://localhost:3000/api/studio/status?artifactId=art-audio-err&mockStatus=failed'
        );
        const res = await studioStatusGET(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.status).toBe('success');
        expect(json.data.status).toBe('failed');
        expect(json.data.progress).toBe(0);
        expect(json.data.error).toBeTruthy();
      });
    });
  });
});
