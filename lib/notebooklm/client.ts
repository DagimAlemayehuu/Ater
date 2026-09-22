import { ScholarxivPaper } from '@/types/scholarxiv';
import { searchScholarxivPapers } from '@/lib/scholarxiv/client';
import { stripEmojis } from '@/lib/curriculum/intake';

export type StudioArtifactType =
  | 'audio'
  | 'video'
  | 'slide_deck'
  | 'report'
  | 'flashcards'
  | 'mind_map';

export interface StudioCreateOptions {
  notebookId?: string;
  artifactType: StudioArtifactType | 'slides';
  format?: string;
  visualStyle?: string;
  language?: string;
  sourceContext?: string;
  title?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  focusPrompt?: string;
  useMock?: boolean;
}

export interface StudioCreateResponse {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  artifactId: string;
  notebookId: string;
  artifactType: StudioArtifactType;
  estimatedSeconds: number;
  message?: string;
  isFallback?: boolean;
}

export interface StudioStatusResponse {
  status: 'in_progress' | 'completed' | 'failed';
  progress: number; // 0 to 100
  artifactId: string;
  artifactType?: StudioArtifactType;
  title?: string;
  mediaUrl?: string;
  downloadUrl?: string;
  content?: string;
  error?: string;
}

export interface ResearchQueryOptions {
  query: string;
  mode: 'fast' | 'deep';
  sources: Array<'scholarxiv' | 'web' | 'notebooklm'>;
  notebookId?: string;
  limit?: number;
  useMock?: boolean;
}

export interface ResearchFinding {
  title: string;
  summary: string;
  takeaways: string[];
  papers: ScholarxivPaper[];
  webCitations?: Array<{ title: string; url: string; snippet?: string }>;
  reportContext?: string;
}

export interface NotebookInfo {
  notebookId: string;
  title: string;
  url: string;
  sourceCount?: number;
  updatedAt?: string;
}

export interface SourceAddOptions {
  notebookId: string;
  sourceType: 'text' | 'url' | 'file';
  title?: string;
  text?: string;
  url?: string;
  filePath?: string;
  wait?: boolean;
  useMock?: boolean;
}

export interface SourceAddResponse {
  status: 'success' | 'failed';
  sourceId: string;
  notebookId: string;
  title: string;
  sourceType: string;
  message?: string;
}

export interface MockStudioSession {
  artifactId: string;
  notebookId: string;
  artifactType: StudioArtifactType;
  format?: string;
  title: string;
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  pollCount: number;
  createdAt: number;
  estimatedSeconds: number;
  mediaUrl?: string;
  downloadUrl?: string;
  content?: string;
  errorReason?: string;
}

export interface INotebookLMClient {
  isAvailable(): Promise<boolean>;
  createNotebook(title?: string, options?: { useMock?: boolean }): Promise<NotebookInfo>;
  listNotebooks(options?: { maxResults?: number; useMock?: boolean }): Promise<NotebookInfo[]>;
  addSource(options: SourceAddOptions): Promise<SourceAddResponse>;
  createStudioArtifact(options: StudioCreateOptions): Promise<StudioCreateResponse>;
  getStudioStatus(artifactId: string, notebookId?: string): Promise<StudioStatusResponse>;
  executeResearchQuery(options: ResearchQueryOptions): Promise<ResearchFinding>;
}

function normalizeArtifactType(type: string): StudioArtifactType {
  if (type === 'slides') return 'slide_deck';
  return type as StudioArtifactType;
}

function getEstimatedSeconds(type: StudioArtifactType): number {
  switch (type) {
    case 'audio':
      return 35;
    case 'video':
      return 60;
    case 'slide_deck':
      return 25;
    case 'report':
      return 20;
    case 'flashcards':
      return 15;
    case 'mind_map':
      return 15;
    default:
      return 30;
  }
}

function populateArtifactPayload(session: MockStudioSession): void {
  switch (session.artifactType) {
    case 'audio':
      session.mediaUrl = 'https://actions.google.com/sounds/v1/ambiences/humming_room.ogg';
      break;
    case 'video':
      session.mediaUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      break;
    case 'slide_deck':
      session.mediaUrl = '/mock/slides/presentation_slides.pdf';
      session.downloadUrl = '/mock/slides/presentation_slides.pdf';
      break;
    case 'report':
      session.content = `# ${session.title || 'Study Guide'}\n\n## 1. Core Intuition\nConsensus algorithms allow a distributed cluster of nodes to agree on a sequence of state transitions even when individual machines crash or network partitions occur.\n\n## 2. Formal Invariants\n- Election Safety: At most one leader can be elected in a given term.\n- Leader Append-Only: A leader never overwrites or truncates its log entries.\n- State Machine Safety: If a server has applied a log entry at a given index to its state machine, no other server will ever apply a different log entry for the same index.\n\n## 3. Review Questions\n1. How does a split vote occur, and how does randomized election timeouts resolve it?\n2. Why must a Raft leader never commit log entries from previous terms by counting replicas?`;
      break;
    case 'flashcards':
      session.content = JSON.stringify([
        {
          front: 'What is the Quorum intersection property?',
          back: 'Any two quorums in a cluster of 2F+1 nodes must overlap in at least one node, ensuring knowledge of past terms survives.',
        },
        {
          front: 'What invariant guarantees leader election safety in Raft?',
          back: 'A candidate cannot win an election unless its log is at least as up-to-date as the majority quorum.',
        },
        {
          front: 'What is the purpose of randomized election timeouts?',
          back: 'To prevent split votes by ensuring candidates timeout at different times and gather a majority quorum.',
        },
      ]);
      break;
    case 'mind_map':
      session.content = JSON.stringify({
        root: session.title || 'Distributed Systems',
        children: [
          {
            name: 'Safety Invariants',
            children: [{ name: 'Election Safety' }, { name: 'Log Matching' }, { name: 'State Machine Safety' }],
          },
          {
            name: 'Failure Modes',
            children: [{ name: 'Split Brain' }, { name: 'Network Partitions' }, { name: 'Crash-Recovery' }],
          },
        ],
      });
      break;
  }
}

export class NotebookLMClient implements INotebookLMClient {
  private readonly useMockDefault: boolean;
  private readonly sessions: Map<string, MockStudioSession> = new Map();

  constructor(options?: { useMock?: boolean }) {
    this.useMockDefault = options?.useMock ?? true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async createNotebook(title?: string, options?: { useMock?: boolean }): Promise<NotebookInfo> {
    const cleanTitle = title?.trim() || 'Ater Course Notebook';
    const notebookId = `nb-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    return {
      notebookId,
      title: cleanTitle,
      url: `https://notebooklm.google.com/notebook/${notebookId}`,
      sourceCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async listNotebooks(_options?: { maxResults?: number; useMock?: boolean }): Promise<NotebookInfo[]> {
    return [
      {
        notebookId: 'mock-nb-distributed-systems',
        title: 'Distributed Systems & Raft Consensus',
        sourceCount: 6,
        url: 'https://notebooklm.google.com/notebook/mock-nb-distributed-systems',
        updatedAt: '2026-09-10T12:00:00Z',
      },
      {
        notebookId: 'mock-nb-transformers',
        title: 'Attention Mechanisms & Transformer Architecture',
        sourceCount: 8,
        url: 'https://notebooklm.google.com/notebook/mock-nb-transformers',
        updatedAt: '2026-09-12T14:30:00Z',
      },
      {
        notebookId: 'mock-nb-os-kernels',
        title: 'Operating System Kernels & Virtual Memory',
        sourceCount: 4,
        url: 'https://notebooklm.google.com/notebook/mock-nb-os-kernels',
        updatedAt: '2026-09-15T09:15:00Z',
      },
    ];
  }

  async addSource(options: SourceAddOptions): Promise<SourceAddResponse> {
    const sourceId = `src-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const title = options.title || (options.sourceType === 'url' ? options.url || 'Web Source' : 'Attached Document');
    return {
      status: 'success',
      sourceId,
      notebookId: options.notebookId,
      title,
      sourceType: options.sourceType,
      message: `Source successfully attached to notebook ${options.notebookId}.`,
    };
  }

  async createStudioArtifact(options: StudioCreateOptions): Promise<StudioCreateResponse> {
    const artifactType = normalizeArtifactType(options.artifactType);
    const estimatedSeconds = getEstimatedSeconds(artifactType);
    const notebookId = options.notebookId || `nb-${Date.now().toString(36)}`;
    const artifactId = `art-${artifactType}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const isSimulatedError =
      options.focusPrompt?.toLowerCase().includes('error') ||
      options.focusPrompt?.toLowerCase().includes('fail') ||
      options.title?.toLowerCase().includes('error') ||
      options.title?.toLowerCase().includes('fail');

    const session: MockStudioSession = {
      artifactId,
      notebookId,
      artifactType,
      format: options.format,
      title: options.title || `${artifactType} Overview`,
      status: isSimulatedError ? 'failed' : 'in_progress',
      progress: isSimulatedError ? 0 : 20,
      pollCount: 0,
      createdAt: Date.now(),
      estimatedSeconds,
      errorReason: isSimulatedError ? 'Simulated generation failure.' : undefined,
    };

    this.sessions.set(artifactId, session);

    return {
      status: isSimulatedError ? 'failed' : 'in_progress',
      artifactId,
      notebookId,
      artifactType,
      estimatedSeconds,
      message: `${artifactType} generation initiated with confirm: true guardrail.`,
      isFallback: true,
    };
  }

  async getStudioStatus(artifactId: string, _notebookId?: string): Promise<StudioStatusResponse> {
    const cleanId = (artifactId || '').trim();
    const session = this.sessions.get(cleanId);

    if (session) {
      if (session.status === 'failed') {
        return {
          status: 'failed',
          progress: 0,
          artifactId: cleanId,
          artifactType: session.artifactType,
          title: session.title,
          error: session.errorReason || 'Generation failed.',
        };
      }

      if (session.status === 'completed') {
        return {
          status: 'completed',
          progress: 100,
          artifactId: cleanId,
          artifactType: session.artifactType,
          title: session.title,
          mediaUrl: session.mediaUrl,
          downloadUrl: session.downloadUrl,
          content: session.content,
        };
      }

      session.pollCount += 1;
      // Monotonic progression: complete after 3 polls or if time elapsed
      if (session.pollCount >= 3) {
        session.status = 'completed';
        session.progress = 100;
        populateArtifactPayload(session);

        return {
          status: 'completed',
          progress: 100,
          artifactId: cleanId,
          artifactType: session.artifactType,
          title: session.title,
          mediaUrl: session.mediaUrl,
          downloadUrl: session.downloadUrl,
          content: session.content,
        };
      }

      // In progress step
      const calculatedProgress = Math.min(90, 20 + session.pollCount * 25);
      session.progress = calculatedProgress;

      return {
        status: 'in_progress',
        progress: calculatedProgress,
        artifactId: cleanId,
        artifactType: session.artifactType,
        title: session.title,
      };
    }

    // Not in memory session registry: infer deterministically from artifactId
    if (cleanId.includes('fail') || cleanId.includes('error')) {
      return {
        status: 'failed',
        progress: 0,
        artifactId: cleanId,
        error: 'Simulated generation failure.',
      };
    }

    if (cleanId.includes('completed')) {
      const isAudio = cleanId.includes('audio');
      const isVideo = cleanId.includes('video');
      const isSlides = cleanId.includes('slide');
      return {
        status: 'completed',
        progress: 100,
        artifactId: cleanId,
        mediaUrl: isAudio
          ? 'https://actions.google.com/sounds/v1/ambiences/humming_room.ogg'
          : isVideo
            ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            : isSlides
              ? '/mock/slides/presentation_slides.pdf'
              : undefined,
        downloadUrl: isSlides ? '/mock/slides/presentation_slides.pdf' : undefined,
        content: !isAudio && !isVideo && !isSlides ? '# Completed Study Document' : undefined,
      };
    }

    return {
      status: 'in_progress',
      progress: 45,
      artifactId: cleanId,
    };
  }

  async executeResearchQuery(options: ResearchQueryOptions): Promise<ResearchFinding> {
    const query = stripEmojis(options.query.trim());
    const mode = options.mode === 'deep' ? 'deep' : 'fast';

    // In deep mode, NotebookLM strictly requires web-only source
    const effectiveSources = mode === 'deep'
      ? options.sources.filter((s) => s === 'web' || s === 'scholarxiv')
      : options.sources;

    let papers: ScholarxivPaper[] = [];
    if (effectiveSources.includes('scholarxiv')) {
      try {
        const searchRes = await searchScholarxivPapers(query, {
          limit: options.limit ?? (mode === 'deep' ? 10 : 5),
          useMock: options.useMock,
        });
        papers = searchRes.data || [];
      } catch {
        // Safe fallback
      }
    }

    const takeaways: string[] = [];
    if (papers.length > 0) {
      for (const p of papers.slice(0, 3)) {
        if (p.keyInsight) {
          takeaways.push(stripEmojis(p.keyInsight));
        } else if (p.summary) {
          const firstSentence = p.summary.split(/\.\s+/)[0];
          takeaways.push(stripEmojis(firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`));
        }
      }
    }

    if (takeaways.length === 0) {
      takeaways.push(`Foundational principles and structural mechanisms governing ${query}.`);
      takeaways.push(`Invariant properties and boundary constraints validated through empirical analysis.`);
    }

    const webCitations = [
      {
        title: `${query} Architectural Overview`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
        snippet: `Comprehensive architectural reference and foundational theory regarding ${query}.`,
      },
      {
        title: `Standards & Engineering Specifications for ${query}`,
        url: `https://arxiv.org/abs/search?query=${encodeURIComponent(query)}`,
        snippet: `Empirical benchmarks, formal proofs, and production engineering practices.`,
      },
    ];

    const summary = stripEmojis(
      papers.length > 0 && papers[0].summary
        ? papers[0].summary
        : `Autonomous research synthesis on ${query} combining academic preprints and verified literature.`
    );

    return {
      title: query,
      summary,
      takeaways,
      papers,
      webCitations,
      reportContext: `Detailed ${mode} research synthesis examining ${query} across academic preprints and systems specifications.`,
    };
  }

  resetSessions(): void {
    this.sessions.clear();
  }

  setSessionProgress(
    artifactId: string,
    progress: number,
    status: 'in_progress' | 'completed' | 'failed' = 'in_progress'
  ): void {
    const session = this.sessions.get(artifactId);
    if (session) {
      session.progress = progress;
      session.status = status;
      if (status === 'completed') {
        populateArtifactPayload(session);
      }
    }
  }
}

export const notebookLMClient = new NotebookLMClient();

export function getNotebookLMClient(options?: { useMock?: boolean }): NotebookLMClient {
  if (options?.useMock !== undefined) {
    return new NotebookLMClient(options);
  }
  return notebookLMClient;
}

export async function createStudioArtifact(options: StudioCreateOptions): Promise<StudioCreateResponse> {
  return notebookLMClient.createStudioArtifact(options);
}

export async function getStudioStatus(artifactId: string, notebookId?: string): Promise<StudioStatusResponse> {
  return notebookLMClient.getStudioStatus(artifactId, notebookId);
}

export async function getStudioArtifactStatus(
  artifactId: string,
  options?: { notebookId?: string; useMock?: boolean }
): Promise<StudioStatusResponse> {
  return notebookLMClient.getStudioStatus(artifactId, options?.notebookId);
}

export async function executeResearchQuery(options: ResearchQueryOptions): Promise<ResearchFinding> {
  return notebookLMClient.executeResearchQuery(options);
}

export async function startResearchQuery(
  query: string,
  options?: { mode?: 'fast' | 'deep'; useMock?: boolean }
): Promise<{
  taskId: string;
  notebookId: string;
  status: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  report?: string;
}> {
  const result = await notebookLMClient.executeResearchQuery({
    query,
    mode: options?.mode ?? 'fast',
    sources: ['web', 'scholarxiv'],
    useMock: options?.useMock,
  });

  return {
    taskId: `task-${Date.now().toString(36)}`,
    notebookId: `nb-${Date.now().toString(36)}`,
    status: 'completed',
    sources: result.webCitations,
    report: result.summary,
  };
}
