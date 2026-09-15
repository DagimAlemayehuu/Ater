'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

export interface InteractiveCanvasViewerProps {
  title?: string;
  preset?: 'consensus-simulator' | 'wave-visualizer' | 'custom';
  customHtml?: string;
  className?: string;
}

export const InteractiveCanvasViewer: React.FC<InteractiveCanvasViewerProps> = ({
  title = 'Interactive Simulation',
  preset = 'consensus-simulator',
  customHtml,
  className = '',
}) => {
  const [simulationState, setSimulationState] = useState<{
    leader: number | null;
    term: number;
    nodes: Array<{ id: number; status: 'follower' | 'candidate' | 'leader' | 'isolated'; logCount: number }>;
    heartbeatActive: boolean;
  }>({
    leader: 1,
    term: 1,
    nodes: [
      { id: 1, status: 'leader', logCount: 4 },
      { id: 2, status: 'follower', logCount: 4 },
      { id: 3, status: 'follower', logCount: 4 },
    ],
    heartbeatActive: true,
  });

  const [waveFreq, setWaveFreq] = useState(2);
  const [waveAmp, setWaveAmp] = useState(30);

  const handleSendHeartbeat = () => {
    setSimulationState((prev) => ({
      ...prev,
      heartbeatActive: true,
      nodes: prev.nodes.map((n) =>
        n.status === 'isolated' ? n : { ...n, logCount: n.logCount + 1 }
      ),
    }));
  };

  const handleTogglePartition = (nodeId: number) => {
    setSimulationState((prev) => {
      const target = prev.nodes.find((n) => n.id === nodeId);
      const isIsolated = target?.status === 'isolated';
      const updatedNodes = prev.nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            status: isIsolated ? ('follower' as const) : ('isolated' as const),
          };
        }
        return n;
      });

      // If current leader was isolated, elect new leader if quorum exists
      const activeCount = updatedNodes.filter((n) => n.status !== 'isolated').length;
      let newLeader = prev.leader;
      if (nodeId === prev.leader && !isIsolated) {
        if (activeCount >= 2) {
          const nextCandidate = updatedNodes.find((n) => n.status !== 'isolated');
          newLeader = nextCandidate ? nextCandidate.id : null;
        } else {
          newLeader = null;
        }
      }

      return {
        ...prev,
        leader: newLeader,
        term: newLeader !== prev.leader ? prev.term + 1 : prev.term,
        nodes: updatedNodes.map((n) => ({
          ...n,
          status: n.id === newLeader ? 'leader' : n.status === 'isolated' ? 'isolated' : 'follower',
        })),
      };
    });
  };

  const handleResetSimulation = () => {
    setSimulationState({
      leader: 1,
      term: 1,
      nodes: [
        { id: 1, status: 'leader', logCount: 4 },
        { id: 2, status: 'follower', logCount: 4 },
        { id: 3, status: 'follower', logCount: 4 },
      ],
      heartbeatActive: true,
    });
    setWaveFreq(2);
    setWaveAmp(30);
  };

  return (
    <div
      data-testid="interactive-canvas-viewer"
      className={`my-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-sm ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800 bg-zinc-900/90 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span>{title}</span>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            Interactive
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetSimulation}
          aria-label="Reset simulation"
          title="Reset simulation"
          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center gap-1 text-[10px] font-mono"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Preset: Consensus Cluster Simulator */}
      {preset === 'consensus-simulator' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Current Term: #{simulationState.term}</span>
            <span>
              Quorum Status:{' '}
              {simulationState.nodes.filter((n) => n.status !== 'isolated').length >= 2 ? (
                <span className="text-emerald-400 font-semibold">Active Quorum (2/3)</span>
              ) : (
                <span className="text-rose-400 font-semibold">Quorum Lost (1/3)</span>
              )}
            </span>
          </div>

          {/* Nodes Container */}
          <div className="grid grid-cols-3 gap-2.5">
            {simulationState.nodes.map((node) => {
              const isLeader = node.status === 'leader';
              const isIsolated = node.status === 'isolated';

              return (
                <div
                  key={node.id}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isLeader
                      ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200 shadow-sm'
                      : isIsolated
                        ? 'border-rose-900/60 bg-rose-950/20 text-rose-300 opacity-60'
                        : 'border-zinc-800 bg-zinc-900/70 text-zinc-300'
                  }`}
                >
                  <div className="text-xs font-mono font-bold flex items-center justify-center gap-1">
                    <span>Node {node.id}</span>
                    {isLeader && (
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        Leader
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 mt-1">
                    Log Index: {node.logCount}
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-800/60 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleTogglePartition(node.id)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        isIsolated
                          ? 'border-emerald-700 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/40'
                          : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {isIsolated ? 'Heal Partition' : 'Isolate Node'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-zinc-400 font-sans">
              Test partition isolation and observe how quorum preservation prevents split-brain state.
            </p>
            <button
              type="button"
              onClick={handleSendHeartbeat}
              disabled={!simulationState.leader}
              className="px-3 py-1 text-xs font-mono font-medium rounded-lg bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3 h-3" />
              <span>Broadcast AppendEntries</span>
            </button>
          </div>
        </div>
      )}

      {/* Preset: Wave / Harmonic Visualizer */}
      {preset === 'wave-visualizer' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Frequency: {waveFreq}x</span>
            <span>Amplitude: {waveAmp}px</span>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="h-28 bg-zinc-900/90 rounded-lg flex items-center justify-center overflow-hidden border border-zinc-800 relative">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path
                d={`M 0 50 ${Array.from({ length: 400 })
                  .map((_, x) => {
                    const y = 50 + Math.sin((x / 400) * Math.PI * 2 * waveFreq) * waveAmp;
                    return `L ${x} ${y.toFixed(1)}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="text-[11px] text-zinc-400 space-y-1 block font-mono">
              <span>Frequency:</span>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={waveFreq}
                onChange={(e) => setWaveFreq(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />
            </label>
            <label className="text-[11px] text-zinc-400 space-y-1 block font-mono">
              <span>Amplitude:</span>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={waveAmp}
                onChange={(e) => setWaveAmp(parseFloat(e.target.value))}
                className="w-full accent-sky-400"
              />
            </label>
          </div>
        </div>
      )}

      {/* Custom HTML iframe sandbox */}
      {preset === 'custom' && customHtml && (
        <div className="p-2">
          <iframe
            srcDoc={customHtml}
            sandbox="allow-scripts"
            className="w-full h-48 border-0 rounded-lg bg-white dark:bg-zinc-950"
            title="Interactive Widget Sandbox"
          />
        </div>
      )}
    </div>
  );
};
