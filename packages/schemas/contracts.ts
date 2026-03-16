/**
 * LIFE OS - API CONTRACTS (SUPREME LAW)
 * This file defines the shared schemas between the FastAPI Sidecar and the React Frontend.
 * All data exchange must adhere to these interfaces.
 */

export interface HealthResponse {
  status: 'ok';
  version: string;
}

// --- NOTION ---

export interface NotionProperty {
  id: string;
  type: string;
  [key: string]: any; // Still need some flexibility for Notion's deep structures, but better than 'any' for the whole object
}

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, NotionProperty>;
  url: string;
}

export interface NotionDatabase {
  id: string;
  title: Array<{ plain_text: string }>;
  properties: Record<string, any>;
}

// --- OBSIDIAN ---

export interface ObsidianNote {
  path: string;
  content: string;
  mtime?: number;
  ctime?: number;
}

export interface ObsidianFile {
  name: string;
  path: string;
  is_directory: boolean;
}

// --- OKA & AI ---

export interface OkaJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  source_path: string;
  target_path?: string;
  created_at: string;
  error?: string;
}

export interface BrainstormRequest {
  query: string;
  context?: string;
  system_prompt?: string;
  history?: Array<{ role: string; content: string }>;
}

export interface BrainstormResponse {
  response: string;
}

// --- CONFIG ---

export interface AppConfig {
  notion_key?: string;
  gemini_key?: string;
  vault_path?: string;
  gemini_model?: string;
  is_configured: boolean;
}
