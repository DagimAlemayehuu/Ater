/**
 * LIFE OS - API CONTRACTS (SUPREME LAW)
 * This file defines the shared schemas between the FastAPI Sidecar and the React Frontend.
 * All data exchange must adhere to these interfaces.
 */

export interface HealthResponse {
  status: 'ok';
  version: string;
}

export interface NotionPage {
  id: string;
  properties: Record<string, any>;
}

export interface ObsidianNote {
  path: string;
  content: string;
}

// Add more contracts here as the project evolves.
