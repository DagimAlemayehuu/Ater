'use client';

import React, { useState, useRef, useCallback } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';

type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

// Standard Rubik's colors
// U (Up) = White, D (Down) = Yellow
// F (Front) = Green, B (Back) = Blue
// L (Left) = Orange, R (Right) = Red
const FACE_COLORS: Record<Face, string> = {
  U: '#ffffff', // White
  D: '#ffd500', // Yellow
  F: '#009b48', // Green
  B: '#0046ad', // Blue
  L: '#ff5800', // Orange
  R: '#b71234', // Red
};

interface CubieState {
  x: number; // -1, 0, 1
  y: number; // -1, 0, 1 (up/down: -1 is top, 1 is bottom)
  z: number; // -1, 0, 1 (front/back: 1 is front, -1 is back)
  colors: {
    U?: string;
    D?: string;
    F?: string;
    B?: string;
    L?: string;
    R?: string;
  };
}

function createSolvedCube(): CubieState[] {
  const cubies: CubieState[] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        cubies.push({
          x,
          y,
          z,
          colors: {
            U: y === -1 ? FACE_COLORS.U : undefined,
            D: y === 1 ? FACE_COLORS.D : undefined,
            F: z === 1 ? FACE_COLORS.F : undefined,
            B: z === -1 ? FACE_COLORS.B : undefined,
            L: x === -1 ? FACE_COLORS.L : undefined,
            R: x === 1 ? FACE_COLORS.R : undefined,
          },
        });
      }
    }
  }
  return cubies;
}

export interface RubiksCubeProps {
  isModal?: boolean;
}

export const RubiksCube: React.FC<RubiksCubeProps> = ({ isModal = false }) => {
  const [cubies, setCubies] = useState<CubieState[]>(createSolvedCube);
  // Orbit angles in degrees
  const [rotX, setRotX] = useState<number>(-25);
  const [rotY, setRotY] = useState<number>(35);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    rotX: -25,
    rotY: 35,
  });
  const [lastMove, setLastMove] = useState<string>('Solved');

  // Mouse / Pointer drag for 360 3D Orbiting
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX,
      rotY,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setRotY(dragStartRef.current.rotY + deltaX * 0.6);
    setRotX(Math.max(-85, Math.min(85, dragStartRef.current.rotX - deltaY * 0.6)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Turn face 90 degrees clockwise (or counter-clockwise if prime)
  const rotateFace = useCallback((face: Face, clockwise: boolean = true) => {
    setCubies((prev) => {
      return prev.map((cubie) => {
        let matches = false;
        let nx = cubie.x;
        let ny = cubie.y;
        let nz = cubie.z;
        let newColors = { ...cubie.colors };

        // Determine if cubie belongs to the rotated layer
        if (face === 'U' && cubie.y === -1) matches = true;
        if (face === 'D' && cubie.y === 1) matches = true;
        if (face === 'F' && cubie.z === 1) matches = true;
        if (face === 'B' && cubie.z === -1) matches = true;
        if (face === 'R' && cubie.x === 1) matches = true;
        if (face === 'L' && cubie.x === -1) matches = true;

        if (!matches) return cubie;

        // Apply coordinate & color rotation
        if (face === 'U') {
          if (clockwise) {
            nx = -cubie.z;
            nz = cubie.x;
            newColors = {
              ...cubie.colors,
              F: cubie.colors.R,
              R: cubie.colors.B,
              B: cubie.colors.L,
              L: cubie.colors.F,
            };
          } else {
            nx = cubie.z;
            nz = -cubie.x;
            newColors = {
              ...cubie.colors,
              F: cubie.colors.L,
              L: cubie.colors.B,
              B: cubie.colors.R,
              R: cubie.colors.F,
            };
          }
        } else if (face === 'D') {
          if (clockwise) {
            nx = cubie.z;
            nz = -cubie.x;
            newColors = {
              ...cubie.colors,
              F: cubie.colors.L,
              L: cubie.colors.B,
              B: cubie.colors.R,
              R: cubie.colors.F,
            };
          } else {
            nx = -cubie.z;
            nz = cubie.x;
            newColors = {
              ...cubie.colors,
              F: cubie.colors.R,
              R: cubie.colors.B,
              B: cubie.colors.L,
              L: cubie.colors.F,
            };
          }
        } else if (face === 'F') {
          if (clockwise) {
            nx = -cubie.y;
            ny = cubie.x;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.L,
              R: cubie.colors.U,
              D: cubie.colors.R,
              L: cubie.colors.D,
            };
          } else {
            nx = cubie.y;
            ny = -cubie.x;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.R,
              L: cubie.colors.U,
              D: cubie.colors.L,
              R: cubie.colors.D,
            };
          }
        } else if (face === 'B') {
          if (clockwise) {
            nx = cubie.y;
            ny = -cubie.x;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.R,
              L: cubie.colors.U,
              D: cubie.colors.L,
              R: cubie.colors.D,
            };
          } else {
            nx = -cubie.y;
            ny = cubie.x;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.L,
              R: cubie.colors.U,
              D: cubie.colors.R,
              L: cubie.colors.D,
            };
          }
        } else if (face === 'R') {
          if (clockwise) {
            ny = -cubie.z;
            nz = cubie.y;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.F,
              B: cubie.colors.U,
              D: cubie.colors.B,
              F: cubie.colors.D,
            };
          } else {
            ny = cubie.z;
            nz = -cubie.y;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.B,
              F: cubie.colors.U,
              D: cubie.colors.F,
              B: cubie.colors.D,
            };
          }
        } else if (face === 'L') {
          if (clockwise) {
            ny = cubie.z;
            nz = -cubie.y;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.B,
              F: cubie.colors.U,
              D: cubie.colors.F,
              B: cubie.colors.D,
            };
          } else {
            ny = -cubie.z;
            nz = cubie.y;
            newColors = {
              ...cubie.colors,
              U: cubie.colors.F,
              B: cubie.colors.U,
              D: cubie.colors.B,
              F: cubie.colors.D,
            };
          }
        }

        return {
          x: nx,
          y: ny,
          z: nz,
          colors: newColors,
        };
      });
    });
    setLastMove(`${face}${clockwise ? '' : "'"}`);
  }, []);

  // Scramble cube with 15 random turns
  const handleScramble = () => {
    const faces: Face[] = ['U', 'D', 'F', 'B', 'L', 'R'];
    for (let i = 0; i < 15; i++) {
      const randomFace = faces[Math.floor(Math.random() * faces.length)];
      const randomClockwise = Math.random() > 0.5;
      rotateFace(randomFace, randomClockwise);
    }
    setLastMove('Scrambled (15 random moves)');
  };

  const handleReset = () => {
    setCubies(createSolvedCube());
    setRotX(-25);
    setRotY(35);
    setLastMove('Reset to Solved');
  };

  const cubieSize = isModal ? 52 : 36;
  const halfSize = cubieSize / 2;
  const gap = 2;
  const step = cubieSize + gap;

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* 3D Viewport with Pointer Orbit Controls */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Click and drag anywhere to rotate 3D view"
        className={`w-full ${isModal ? 'h-[380px]' : 'h-[260px]'} flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden relative touch-none`}
        style={{ perspective: 900 }}
      >
        {/* Orbit helper overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-56 h-56 rounded-full border border-dashed border-zinc-400 dark:border-zinc-600" />
        </div>

        {/* The 3D Cube Cluster Container */}
        <div
          style={{
            width: step * 3,
            height: step * 3,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {cubies.map((cubie, idx) => {
            const tx = cubie.x * step;
            const ty = cubie.y * step;
            const tz = cubie.z * step;

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  width: cubieSize,
                  height: cubieSize,
                  left: '50%',
                  top: '50%',
                  marginLeft: -halfSize,
                  marginTop: -halfSize,
                  transformStyle: 'preserve-3d',
                  transform: `translate3d(${tx}px, ${ty}px, ${tz}px)`,
                }}
              >
                {/* 6 Faces of each Cubie */}
                {/* Front (Z = +halfSize) */}
                <div
                  style={{
                    position: 'absolute',
                    width: cubieSize,
                    height: cubieSize,
                    backgroundColor: cubie.colors.F || '#18181b',
                    border: '1.5px solid #09090b',
                    borderRadius: 4,
                    transform: `translateZ(${halfSize}px)`,
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
                  }}
                />
                {/* Back (Z = -halfSize) */}
                <div
                  style={{
                    position: 'absolute',
                    width: cubieSize,
                    height: cubieSize,
                    backgroundColor: cubie.colors.B || '#18181b',
                    border: '1.5px solid #09090b',
                    borderRadius: 4,
                    transform: `rotateY(180deg) translateZ(${halfSize}px)`,
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
                  }}
                />
                {/* Top / Up (Y = -halfSize) */}
                <div
                  style={{
                    position: 'absolute',
                    width: cubieSize,
                    height: cubieSize,
                    backgroundColor: cubie.colors.U || '#18181b',
                    border: '1.5px solid #09090b',
                    borderRadius: 4,
                    transform: `rotateX(90deg) translateZ(${halfSize}px)`,
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
                  }}
                />
                {/* Bottom / Down (Y = +halfSize) */}
                <div
                  style={{
                    position: 'absolute',
                    width: cubieSize,
                    height: cubieSize,
                    backgroundColor: cubie.colors.D || '#18181b',
                    border: '1.5px solid #09090b',
                    borderRadius: 4,
                    transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
                  }}
                />
                {/* Right (X = +halfSize) */}
                <div
                  style={{
                    position: 'absolute',
                    width: cubieSize,
                    height: cubieSize,
                    backgroundColor: cubie.colors.R || '#18181b',
                    border: '1.5px solid #09090b',
                    borderRadius: 4,
                    transform: `rotateY(90deg) translateZ(${halfSize}px)`,
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
                  }}
                />
                {/* Left (X = -halfSize) */}
                <div
                  style={{
                    position: 'absolute',
                    width: cubieSize,
                    height: cubieSize,
                    backgroundColor: cubie.colors.L || '#18181b',
                    border: '1.5px solid #09090b',
                    borderRadius: 4,
                    transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.4)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls & Layer Rotation Buttons */}
      <div className="w-full p-3.5 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-2.5">
        {/* Layer Buttons: Clockwise */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
              Clockwise Layer Turns
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Drag mouse to 3D Orbit
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('U', true); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 transition-colors shadow-xs"
              title="Top (U) - White"
            >
              U (Top)
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('D', true); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 transition-colors shadow-xs"
              title="Down (D) - Yellow"
            >
              D (Down)
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('F', true); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 transition-colors shadow-xs"
              title="Front (F) - Green"
            >
              F (Front)
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('B', true); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 transition-colors shadow-xs"
              title="Back (B) - Blue"
            >
              B (Back)
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('R', true); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 transition-colors shadow-xs"
              title="Right (R) - Red"
            >
              R (Right)
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('L', true); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 transition-colors shadow-xs"
              title="Left (L) - Orange"
            >
              L (Left)
            </button>
          </div>
        </div>

        {/* Layer Buttons: Counter-Clockwise (Prime) */}
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
            Counter-Clockwise (Prime &apos;) Turns
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('U', false); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Top Layer Counter-Clockwise"
            >
              U&apos;
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('D', false); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Bottom Layer Counter-Clockwise"
            >
              D&apos;
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('F', false); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Front Layer Counter-Clockwise"
            >
              F&apos;
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('B', false); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Back Layer Counter-Clockwise"
            >
              B&apos;
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('R', false); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Right Layer Counter-Clockwise"
            >
              R&apos;
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); rotateFace('L', false); }}
              className="py-1 px-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Left Layer Counter-Clockwise"
            >
              L&apos;
            </button>
          </div>
        </div>

        {/* Global Utilities */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleScramble(); }}
            className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random Scramble (15 Moves)</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            className="py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Solve & Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
