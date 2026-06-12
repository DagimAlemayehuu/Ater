import { useMemo } from 'react'
import { buildSandboxSrcDoc } from '@/lib/artifacts/sandbox'

interface SandboxIFrameProps {
  code: string
  artifactId: string
  version: number
  shielded?: boolean
}

export function SandboxIFrame({ code, artifactId, version, shielded = false }: SandboxIFrameProps) {
  const srcDoc = useMemo(() => buildSandboxSrcDoc(code, { artifactId, version }), [artifactId, code, version])

  return (
    <div className="relative h-full min-h-[260px] bg-[#101012]">
      {shielded && <div className="absolute inset-0 z-10 cursor-col-resize bg-transparent" />}
      <iframe
        title="Interactive sandbox"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="h-full w-full border-0 bg-[#101012]"
      />
    </div>
  )
}

