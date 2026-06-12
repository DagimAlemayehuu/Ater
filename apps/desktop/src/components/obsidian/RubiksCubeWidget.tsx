import React, { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'

interface RubiksCubeWidgetProps {
  payload: {
    title: string
    description?: string
    scramble?: string
    solution?: string // Space-separated moves list
  }
  dark: boolean
}

type CubeState = Record<string, string[]>

const INITIAL_CUBE = (): CubeState => ({
  U: Array(9).fill('W'),
  D: Array(9).fill('Y'),
  F: Array(9).fill('G'),
  B: Array(9).fill('B'),
  L: Array(9).fill('O'),
  R: Array(9).fill('R'),
})

// ─── MOVE ROTATION UTILITIES ──────────────────────────────────────────────────
function rotateFaceCW(face: string[]): string[] {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2],
  ]
}

function rotateFaceCCW(face: string[]): string[] {
  return rotateFaceCW(rotateFaceCW(rotateFaceCW(face)))
}

function applySingleMove(cube: CubeState, move: string): CubeState {
  const next = {
    U: [...cube.U],
    D: [...cube.D],
    F: [...cube.F],
    B: [...cube.B],
    L: [...cube.L],
    R: [...cube.R],
  }

  const m = move.trim()
  if (!m) return next

  switch (m) {
    case 'U': {
      next.U = rotateFaceCW(next.U)
      const temp = [next.F[0], next.F[1], next.F[2]]
      next.F[0] = next.R[0]; next.F[1] = next.R[1]; next.F[2] = next.R[2]
      next.R[0] = next.B[0]; next.R[1] = next.B[1]; next.R[2] = next.B[2]
      next.B[0] = next.L[0]; next.B[1] = next.L[1]; next.B[2] = next.L[2]
      next.L[0] = temp[0]; next.L[1] = temp[1]; next.L[2] = temp[2]
      break
    }
    case "U'": {
      next.U = rotateFaceCCW(next.U)
      const temp = [next.F[0], next.F[1], next.F[2]]
      next.F[0] = next.L[0]; next.F[1] = next.L[1]; next.F[2] = next.L[2]
      next.L[0] = next.B[0]; next.L[1] = next.B[1]; next.L[2] = next.B[2]
      next.B[0] = next.R[0]; next.B[1] = next.R[1]; next.B[2] = next.R[2]
      next.R[0] = temp[0]; next.R[1] = temp[1]; next.R[2] = temp[2]
      break
    }
    case 'D': {
      next.D = rotateFaceCW(next.D)
      const temp = [next.F[6], next.F[7], next.F[8]]
      next.F[6] = next.L[6]; next.F[7] = next.L[7]; next.F[8] = next.L[8]
      next.L[6] = next.B[6]; next.L[7] = next.B[7]; next.L[8] = next.B[8]
      next.B[6] = next.R[6]; next.B[7] = next.R[7]; next.B[8] = next.R[8]
      next.R[6] = temp[0]; next.R[7] = temp[1]; next.R[8] = temp[2]
      break
    }
    case "D'": {
      next.D = rotateFaceCCW(next.D)
      const temp = [next.F[6], next.F[7], next.F[8]]
      next.F[6] = next.R[6]; next.F[7] = next.R[7]; next.F[8] = next.R[8]
      next.R[6] = next.B[6]; next.R[7] = next.B[7]; next.R[8] = next.B[8]
      next.B[6] = next.L[6]; next.B[7] = next.L[7]; next.B[8] = next.L[8]
      next.L[6] = temp[0]; next.L[7] = temp[1]; next.L[8] = temp[2]
      break
    }
    case 'R': {
      next.R = rotateFaceCW(next.R)
      const temp = [next.U[2], next.U[5], next.U[8]]
      next.U[2] = next.F[2]; next.U[5] = next.F[5]; next.U[8] = next.F[8]
      next.F[2] = next.D[2]; next.F[5] = next.D[5]; next.F[8] = next.D[8]
      next.D[2] = next.B[6]; next.D[5] = next.B[3]; next.D[8] = next.B[0]
      next.B[6] = temp[0]; next.B[3] = temp[1]; next.B[0] = temp[2]
      break
    }
    case "R'": {
      next.R = rotateFaceCCW(next.R)
      const temp = [next.U[2], next.U[5], next.U[8]]
      next.U[2] = next.B[6]; next.U[5] = next.B[3]; next.U[8] = next.B[0]
      next.B[6] = next.D[2]; next.B[3] = next.D[5]; next.B[0] = next.D[8]
      next.D[2] = next.F[2]; next.D[5] = next.F[5]; next.D[8] = next.F[8]
      next.F[2] = temp[0]; next.F[5] = temp[1]; next.F[8] = temp[2]
      break
    }
    case 'L': {
      next.L = rotateFaceCW(next.L)
      const temp = [next.U[0], next.U[3], next.U[6]]
      next.U[0] = next.B[8]; next.U[3] = next.B[5]; next.U[6] = next.B[2]
      next.B[8] = next.D[0]; next.B[5] = next.D[3]; next.B[2] = next.D[6]
      next.D[0] = next.F[0]; next.D[3] = next.F[3]; next.D[6] = next.F[6]
      next.F[0] = temp[0]; next.F[3] = temp[1]; next.F[6] = temp[2]
      break
    }
    case "L'": {
      next.L = rotateFaceCCW(next.L)
      const temp = [next.U[0], next.U[3], next.U[6]]
      next.U[0] = next.F[0]; next.U[3] = next.F[3]; next.U[6] = next.F[6]
      next.F[0] = next.D[0]; next.F[3] = next.D[3]; next.F[6] = next.D[6]
      next.D[0] = next.B[8]; next.D[3] = next.B[5]; next.D[6] = next.B[2]
      next.B[8] = temp[0]; next.B[5] = temp[1]; next.B[2] = temp[2]
      break
    }
    case 'F': {
      next.F = rotateFaceCW(next.F)
      const temp = [next.U[6], next.U[7], next.U[8]]
      next.U[6] = next.L[8]; next.U[7] = next.L[5]; next.U[8] = next.L[2]
      next.L[8] = next.D[2]; next.L[5] = next.D[1]; next.L[2] = next.D[0]
      next.D[2] = next.R[0]; next.D[1] = next.R[3]; next.D[0] = next.R[6]
      next.R[0] = temp[0]; next.R[3] = temp[1]; next.R[6] = temp[2]
      break
    }
    case "F'": {
      next.F = rotateFaceCCW(next.F)
      const temp = [next.U[6], next.U[7], next.U[8]]
      next.U[6] = next.R[0]; next.U[7] = next.R[3]; next.U[8] = next.R[6]
      next.R[0] = next.D[2]; next.R[3] = next.D[1]; next.R[6] = next.D[0]
      next.D[2] = next.L[8]; next.D[1] = next.L[5]; next.D[0] = next.L[2]
      next.L[8] = temp[0]; next.L[5] = temp[1]; next.L[2] = temp[2]
      break
    }
    case 'B': {
      next.B = rotateFaceCW(next.B)
      const temp = [next.U[2], next.U[1], next.U[0]]
      next.U[2] = next.R[8]; next.U[1] = next.R[5]; next.U[0] = next.R[2]
      next.R[8] = next.D[6]; next.R[5] = next.D[7]; next.R[2] = next.D[8]
      next.D[6] = next.L[0]; next.D[7] = next.L[3]; next.D[8] = next.L[6]
      next.L[0] = temp[0]; next.L[3] = temp[1]; next.L[6] = temp[2]
      break
    }
    case "B'": {
      next.B = rotateFaceCCW(next.B)
      const temp = [next.U[2], next.U[1], next.U[0]]
      next.U[2] = next.L[0]; next.U[1] = next.L[3]; next.U[0] = next.L[6]
      next.L[0] = next.D[6]; next.L[3] = next.D[7]; next.L[6] = next.D[8]
      next.D[6] = next.R[8]; next.D[7] = next.R[5]; next.D[8] = next.R[2]
      next.R[8] = temp[0]; next.R[5] = temp[1]; next.R[2] = temp[2]
      break
    }
  }

  return next
}

// ─── MONOCHROME COLOR MAPPINGS ──────────────────────────────────────────────
function getStickerColors(char: string, dark: boolean) {
  const map: Record<string, { bg: string; fg: string }> = dark
    ? {
        W: { bg: '#ffffff', fg: '#111113' },
        Y: { bg: '#3f3f46', fg: '#ffffff' },
        G: { bg: '#27272a', fg: '#e4e4e7' },
        B: { bg: '#09090b', fg: '#a1a1aa' },
        O: { bg: '#d4d4d8', fg: '#111113' },
        R: { bg: '#71717a', fg: '#ffffff' },
      }
    : {
        W: { bg: '#ffffff', fg: '#18181b' },
        Y: { bg: '#e4e4e7', fg: '#18181b' },
        G: { bg: '#71717a', fg: '#ffffff' },
        B: { bg: '#27272a', fg: '#ffffff' },
        O: { bg: '#fafafa', fg: '#18181b' },
        R: { bg: '#a1a1aa', fg: '#18181b' },
      }
  return map[char] || { bg: '#52525b', fg: '#ffffff' }
}

export default function RubiksCubeWidget({ payload, dark: darkProp }: RubiksCubeWidgetProps) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme ? resolvedTheme === 'dark' : darkProp
  const { title, description, scramble = '', solution = '' } = payload

  // Solution steps parsing
  const solutionMoves = useMemo(() => {
    return solution.split(/\s+/).filter(Boolean)
  }, [solution])

  const [cube, setCube] = useState<CubeState>(INITIAL_CUBE)
  const [stepIndex, setStepIndex] = useState(0)

  // Re-apply states up to step index
  const baseCubeState = useMemo(() => {
    let state = INITIAL_CUBE()
    if (scramble) {
      const scrambleMoves = scramble.split(/\s+/).filter(Boolean)
      scrambleMoves.forEach(m => {
        state = applySingleMove(state, m)
      })
    }
    return state
  }, [scramble])

  useEffect(() => {
    let state = baseCubeState
    for (let i = 0; i < stepIndex; i++) {
      if (solutionMoves[i]) {
        state = applySingleMove(state, solutionMoves[i])
      }
    }
    setCube(state)
  }, [baseCubeState, stepIndex, solutionMoves])

  const handleManualMove = (m: string) => {
    setCube(prev => applySingleMove(prev, m))
  }

  const resetAll = () => {
    setStepIndex(0)
    setCube(baseCubeState)
  }

  // ─── ISOMETRIC PROJECTION COORDINATES ─────────────────────────────────────────
  const S = 15 // Scale factor
  const project = (x: number, y: number, z: number) => {
    const screenX = 90 + S * 0.866 * (x - z)
    const screenY = 50 + S * (-y + 0.5 * (x + z))
    return `${screenX.toFixed(1)},${screenY.toFixed(1)}`
  }

  const drawSticker = React.useCallback((corners: [number, number, number][], colorCode: string) => {
    const points = corners.map(c => project(c[0], c[1], c[2])).join(' ')
    const style = getStickerColors(colorCode, dark)

    // Compute approximate center of the polygon for the letter placement
    const cx = corners.reduce((acc, c) => acc + c[0], 0) / 4
    const cy = corners.reduce((acc, c) => acc + c[1], 0) / 4
    const cz = corners.reduce((acc, c) => acc + c[2], 0) / 4
    const textCenter = project(cx, cy, cz).split(',')

    return (
      <g key={points}>
        <polygon
          points={points}
          fill={style.bg}
          stroke={dark ? '#242426' : '#d4d4d8'}
          strokeWidth="0.8"
        />
        <text
          x={textCenter[0]}
          y={parseFloat(textCenter[1]) + 2}
          textAnchor="middle"
          fontSize="5"
          fontWeight="bold"
          fill={style.fg}
          pointerEvents="none"
        >
          {colorCode}
        </text>
      </g>
    )
  }, [dark])

  // Generate faces polygons
  const stickersPolygons = useMemo(() => {
    const polys: React.ReactNode[] = []

    // 1. Up Face (U) stickers
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x0 = -1.5 + col
        const x1 = x0 + 1
        const z0 = -1.5 + row
        const z1 = z0 + 1
        const color = cube.U[row * 3 + col]

        const corners: [number, number, number][] = [
          [x0, 1.5, z0],
          [x1, 1.5, z0],
          [x1, 1.5, z1],
          [x0, 1.5, z1],
        ]
        polys.push(drawSticker(corners, color))
      }
    }

    // 2. Front Face (F) stickers
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x0 = -1.5 + col
        const x1 = x0 + 1
        const y0 = 1.5 - row
        const y1 = y0 - 1
        const color = cube.F[row * 3 + col]

        const corners: [number, number, number][] = [
          [x0, y0, 1.5],
          [x1, y0, 1.5],
          [x1, y1, 1.5],
          [x0, y1, 1.5],
        ]
        polys.push(drawSticker(corners, color))
      }
    }

    // 3. Right Face (R) stickers
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const z0 = 1.5 - col
        const z1 = z0 - 1
        const y0 = 1.5 - row
        const y1 = y0 - 1
        const color = cube.R[row * 3 + col]

        const corners: [number, number, number][] = [
          [1.5, y0, z0],
          [1.5, y0, z1],
          [1.5, y1, z1],
          [1.5, y1, z0],
        ]
        polys.push(drawSticker(corners, color))
      }
    }

    return polys
  }, [cube, dark, drawSticker])

  const borderClass = 'border-border'
  const panelClass = 'bg-bento-panel'
  const innerClass = 'bg-bento-bg'

  return (
    <div className={cn('rounded-[8px] border p-4 space-y-4 max-w-xl mx-auto', borderClass, panelClass)}>
      <div>
        <h4 className="text-[12px] font-black uppercase tracking-wider text-foreground">{title}</h4>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
        {/* Isometric SVG Render */}
        <div className={cn('border rounded-[6px] p-2 flex items-center justify-center min-w-[200px]', innerClass, borderClass)}>
          <svg width="180" height="120" viewBox="0 0 180 120" className="overflow-visible select-none">
            {stickersPolygons}
          </svg>
        </div>

        {/* Stepper Controls */}
        <div className="flex-1 space-y-3 w-full">
          {solutionMoves.length > 0 && (
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground block">Interactive Stepper</span>
              <div className={cn('p-2.5 rounded-[4px] border flex flex-wrap gap-1 items-center justify-center min-h-[36px]', innerClass, borderClass)}>
                {solutionMoves.map((m, idx) => {
                  const active = idx === stepIndex - 1
                  const completed = idx < stepIndex
                  return (
                    <span
                      key={idx}
                      className={cn(
                        'px-1.5 py-0.5 text-[9px] font-black tracking-wide rounded-[3px] border transition-all',
                        active
                          ? 'bg-foreground text-background border-foreground'
                          : completed
                          ? 'opacity-40 border-muted-foreground'
                          : cn('opacity-20', borderClass)
                      )}
                    >
                      {m}
                    </span>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                  disabled={stepIndex === 0}
                  className={cn(
                    'flex-1 py-1.5 border border-border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all',
                    stepIndex === 0
                      ? 'opacity-20 cursor-not-allowed text-muted-foreground/30'
                      : 'hover:border-foreground text-foreground bg-transparent hover:bg-foreground/5'
                  )}
                >
                  Prev Step
                </button>
                <button
                  onClick={() => setStepIndex(prev => Math.min(solutionMoves.length, prev + 1))}
                  disabled={stepIndex === solutionMoves.length}
                  className={cn(
                    'flex-1 py-1.5 border text-[9px] font-black uppercase tracking-widest rounded-[4px] transition-all',
                    stepIndex === solutionMoves.length
                      ? 'opacity-20 cursor-not-allowed border-border text-muted-foreground/30'
                      : 'bg-foreground text-background border-foreground hover:bg-transparent hover:text-foreground'
                  )}
                >
                  Next Step
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 border border-border text-[9px] font-black uppercase tracking-widest rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Manual Input Buttons */}
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground block">Manual Rotation Sandbox</span>
            <div className="grid grid-cols-6 gap-1">
              {['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"].map(move => (
                <button
                  key={move}
                  onClick={() => handleManualMove(move)}
                  className="py-1 border border-border bg-bento-card text-foreground hover:border-foreground hover:bg-foreground/5 rounded-[3px] transition-all"
                >
                  {move}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
