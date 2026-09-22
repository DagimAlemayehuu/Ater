'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Maximize2 } from 'lucide-react';
import { ArtifactModal } from './ArtifactModal';
import { RubiksCube } from './RubiksCube';

export interface InteractiveCanvasViewerProps {
  title?: string;
  preset?: 'consensus-simulator' | 'wave-visualizer' | 'rubiks-cube' | 'custom';
  code?: string;
  customHtml?: string;
  className?: string;
  disableExpand?: boolean;
}

export const InteractiveCanvasViewer: React.FC<InteractiveCanvasViewerProps> = ({
  title = 'Interactive Simulation',
  preset: propPreset,
  code,
  customHtml,
  className = '',
  disableExpand = false,
}) => {
  // Infer preset from code string if provided (e.g. preset: rubiks-cube)
  let activePreset: 'consensus-simulator' | 'wave-visualizer' | 'rubiks-cube' | 'custom' = propPreset || 'rubiks-cube';
  if (code) {
    if (code.includes('rubiks-cube') || code.includes('rubiks')) {
      activePreset = 'rubiks-cube';
    } else if (code.includes('wave-visualizer')) {
      activePreset = 'wave-visualizer';
    } else if (code.includes('consensus-simulator')) {
      activePreset = 'consensus-simulator';
    }
  }
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
  const [isExpanded, setIsExpanded] = useState(false);

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

      const activeNodes = updatedNodes.filter((n) => n.status !== 'isolated');
      let newLeader = prev.leader;
      if (target?.status === 'leader' && !isIsolated) {
        newLeader = activeNodes.length >= 2 ? activeNodes[0]?.id || null : null;
      }

      return {
        ...prev,
        leader: newLeader,
        nodes: updatedNodes,
      };
    });
  };

  const handleTriggerElection = () => {
    setSimulationState((prev) => {
      const activeFollowers = prev.nodes.filter((n) => n.status === 'follower');
      if (activeFollowers.length === 0) return prev;

      const candidate = activeFollowers[0];
      const newTerm = prev.term + 1;
      return {
        ...prev,
        term: newTerm,
        leader: candidate.id,
        nodes: prev.nodes.map((n) =>
          n.id === candidate.id ? { ...n, status: 'leader' as const } : n
        ),
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

  const renderContent = (isModal = false) => (
    <>
      {/* Preset: 3D Interactive Rubik's Cube */}
      {activePreset === 'rubiks-cube' && (
        <RubiksCube isModal={isModal} />
      )}

      {/* Preset: Consensus Cluster Simulator */}
      {activePreset === 'consensus-simulator' && (
        <div className={`p-4 space-y-4 ${isModal ? 'max-w-4xl mx-auto py-8' : ''}`}>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <span>Current Term: #{simulationState.term}</span>
            <span>
              Quorum Status:{' '}
              {simulationState.nodes.filter((n) => n.status !== 'isolated').length >= 2 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active Quorum (2/3)</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">Quorum Lost (1/3)</span>
              )}
            </span>
          </div>

          {/* Nodes Container */}
          <div className={`grid grid-cols-3 gap-2.5 ${isModal ? 'gap-4' : ''}`}>
            {simulationState.nodes.map((node) => {
              const isLeader = node.status === 'leader';
              const isIsolated = node.status === 'isolated';

              return (
                <div
                  key={node.id}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isModal ? 'p-5' : 'p-3'
                  } ${
                    isLeader
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : isIsolated
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 opacity-70'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 shadow-xs'
                  }`}
                >
                  <div className="text-xs font-mono font-bold flex items-center justify-center gap-1">
                    <span>Node {node.id}</span>
                    {isLeader && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">(Leader)</span>}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase font-mono tracking-wider">
                    {node.status}
                  </div>
                  <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-2">
                    WAL Logs: {node.logCount}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePartition(node.id);
                    }}
                    className={`mt-2.5 px-2 py-1 text-[10px] font-mono rounded w-full border transition-colors ${
                      isIsolated
                        ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {isIsolated ? 'Rejoin Network' : 'Simulate Failure'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSendHeartbeat();
              }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-900 dark:hover:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Broadcast AppendEntries RPC</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerElection();
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
            >
              Trigger Term Election
            </button>
          </div>
        </div>
      )}

      {/* Preset: Wave Visualizer */}
      {activePreset === 'wave-visualizer' && (
        <div className={`p-4 space-y-4 ${isModal ? 'max-w-4xl mx-auto py-8' : ''}`}>
          <div className="h-28 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden relative border border-zinc-200 dark:border-zinc-800">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path
                d={`M 0 50 ${Array.from({ length: 400 })
                  .map((_, x) => {
                    const y = 50 + Math.sin((x / 400) * Math.PI * 2 * waveFreq) * waveAmp;
                    return `L ${x} ${y.toFixed(1)}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="currentColor"
                className="text-zinc-600 dark:text-zinc-300"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 block font-mono">
              <span>Frequency:</span>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={waveFreq}
                onChange={(e) => setWaveFreq(parseFloat(e.target.value))}
                className="w-full accent-zinc-600 dark:accent-zinc-400"
              />
            </label>
            <label className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1 block font-mono">
              <span>Amplitude:</span>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={waveAmp}
                onChange={(e) => setWaveAmp(parseFloat(e.target.value))}
                className="w-full accent-zinc-600 dark:accent-zinc-400"
              />
            </label>
          </div>
        </div>
      )}

      {/* Custom HTML iframe sandbox */}
      {activePreset === 'custom' && customHtml && (
        <div className="p-2">
          <iframe
            srcDoc={customHtml}
            sandbox="allow-scripts"
            className={`w-full border-0 rounded-lg bg-white dark:bg-zinc-950 ${isModal ? 'h-[70vh]' : 'h-48'}`}
            title="Interactive Widget Sandbox"
          />
        </div>
      )}
    </>
  );

  return (
    <div
      data-testid="interactive-canvas-viewer"
      className={`my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden shadow-xs ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/70 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
          <span>{activePreset === 'rubiks-cube' ? "3D Rubik's Cube Simulator" : title}</span>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            Interactive
          </span>
        </div>

        <div className="flex items-center gap-1">
          {activePreset !== 'rubiks-cube' && (
            <button
              type="button"
              onClick={handleResetSimulation}
              aria-label="Reset simulation"
              title="Reset simulation"
              className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-[10px] font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          {!disableExpand && (
            <>
              {activePreset !== 'rubiks-cube' && <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" />}
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label="Expand interactive simulation"
                title="Expand interactive simulation"
                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-[10px] font-mono"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono hidden sm:inline">Expand</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Simulator Content */}
      <div className="w-full">
        {renderContent(false)}
      </div>

      {/* Expanded Modal View */}
      {!disableExpand && isExpanded && (
        <ArtifactModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          badgeText="Interactive"
          title={activePreset === 'rubiks-cube' ? "3D Rubik's Cube Simulator" : title}
        >
          <div className="bg-zinc-50/70 dark:bg-zinc-950 rounded-xl min-h-[60vh] text-zinc-900 dark:text-zinc-100 p-2 sm:p-6 border border-zinc-200 dark:border-zinc-800">
            {renderContent(true)}
          </div>
        </ArtifactModal>
      )}
    </div>
  );
};
