import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { UnifiedSandboxViewer } from '../components/obsidian/UnifiedSandboxViewer';
import { extractArtifacts } from '../lib/artifacts/parser';
import { useArtifactStore } from '../lib/artifacts/store';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from '../lib/ConfigContext';
import { ThemeProvider } from '../context/theme-provider';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    health: vi.fn().mockResolvedValue({ status: 'ok' }),
    readObsidianNote: vi.fn(),
  }
}));

describe('Artifact Robustness', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('extractArtifacts', () => {
    it('handles null/undefined source gracefully', () => {
      // @ts-ignore
      expect(extractArtifacts(null)).toEqual({ artifacts: [], sandboxSpecs: [] });
      // @ts-ignore
      expect(extractArtifacts(undefined)).toEqual({ artifacts: [], sandboxSpecs: [] });
      // @ts-ignore
      expect(extractArtifacts(123)).toEqual({ artifacts: [], sandboxSpecs: [] });
    });

    it('handles malformed tags without crashing', () => {
      const malformed = '<artifact title="Test"><chapter>No closing tag';
      const result = extractArtifacts(malformed);
      expect(result.artifacts.length).toBe(1);
      expect(result.artifacts[0].versions[0].chapters.length).toBe(1);
    });
  });

  describe('UnifiedSandboxViewer Error Boundary', () => {
    it('shows crash UI when iframe rendering fails', async () => {
      // Force a rendering error by mocking buildSandboxSrcDoc to throw
      const sandbox = await import('../lib/artifacts/sandbox');
      const spy = vi.spyOn(sandbox, 'buildSandboxSrcDoc').mockImplementation(() => {
        throw new Error('Simulated Rendering Crash');
      });

      // Setup store with an artifact
      useArtifactStore.getState().registerArtifacts([{
        id: 'art-1',
        title: 'Broken Art',
        versions: [{
          version: 1,
          chapters: [{ id: 'ch-1', title: 'Ch 1', content: '...', sandbox: 'console.log(1)' }]
        }]
      }]);
      useArtifactStore.getState().setActiveArtifact('art-1');

      render(
        <MemoryRouter>
          <ConfigProvider>
            <ThemeProvider>
              <UnifiedSandboxViewer />
            </ThemeProvider>
          </ConfigProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/Sandbox Crash/i)).toBeInTheDocument();
      expect(screen.getByText(/Simulated Rendering Crash/i)).toBeInTheDocument();

      spy.mockRestore();
    });
  });
});
