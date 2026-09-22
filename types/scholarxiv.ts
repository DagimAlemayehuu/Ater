/**
 * Scholarxiv Platform & MCP Type Definitions for Ater_V2
 */

export interface ScholarxivPaper {
  id: string;
  extractedID?: string;
  title: string;
  summary: string;
  authors: string[];
  published?: string;
  updated?: string;
  primaryCategory?: string;
  category?: string[];
  categories?: string[];
  pdfLink?: string;
  absLink?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  year?: number;
  keyInsight?: string;
  journalRef?: string;
  comment?: string;
  source?: string;
  sources?: string[];
}

export interface NormalizedScholarxivPaper extends ScholarxivPaper {
  year: number;
  url: string;
  abstract: string;
  keyInsight: string;
  categories: string[];
}

export interface ScholarxivPagination {
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
}

export interface ScholarxivSearchResponse {
  data: ScholarxivPaper[];
  pagination: ScholarxivPagination;
  bySource?: Record<string, { count: number; hasMore: boolean }>;
}

export type ScholarxivSearchFilter = 'all' | 'ti' | 'au' | 'abs' | 'cat' | 'id' | 'co' | 'jr' | 'rn';

export interface ScholarxivSearchOptions {
  query?: string;
  searchFilterString?: Record<string, string>;
  limit?: number;
  page?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sortOrder?: 'ascending' | 'descending';
}

export interface ScholarxivCollection {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  visibility?: 'public' | 'private';
  paperCount?: number;
  role?: string;
  papers?: ScholarxivPaper[];
  shareUrl?: string;
}

export interface ScholarxivRouterRequest {
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  preset?: 'balanced' | 'quality' | 'cheap';
  requires_tools?: boolean;
  has_image?: boolean;
  has_pdf?: boolean;
  models?: string[];
}

export interface ScholarxivRouterResponse {
  decision_id: string;
  model: string;
  fallbacks: string[];
  task: string;
  difficulty: number;
  preset: string;
  estimated_cost_usd: number;
  candidates_considered: number;
  routing_latency_ms: number;
  degraded: boolean;
}

export interface ScholarxivChatRequest {
  question: string;
  chatId?: string;
  selectedPapers?: string;
  selectedTexts?: string;
  isDeepResearch?: boolean;
  model?: string;
}

export interface ScholarxivChatResponse {
  chatId?: string;
  reply: string;
  toolCalls?: any[];
}

export interface ScholarxivComment {
  id: string;
  author: string;
  date: string;
  text: string;
}

export interface ScholarxivBenchmarkItem {
  preset: 'balanced' | 'quality' | 'cheap';
  model: string;
  latencyMs: number;
  estimatedCostUsd: number;
  difficulty: number;
  task: string;
  candidatesCount: number;
  fallbacks: string[];
}

export interface ScholarxivBenchmarkResult {
  prompt: string;
  timestamp: string;
  items: ScholarxivBenchmarkItem[];
  cheapestModel: string;
  fastestModel: string;
  savingsPercentage: number;
}

export interface CitationFormats {
  apa: string;
  mla: string;
  ieee: string;
  bibtex: string;
  markdown: string;
}
