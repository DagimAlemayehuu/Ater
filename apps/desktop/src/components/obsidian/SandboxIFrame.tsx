import { useMemo } from 'react'
import { buildSandboxSrcDoc } from '@/lib/artifacts/sandbox'
import { useTheme } from '@/context/theme-provider'

interface SandboxIFrameProps {
  code: string
  artifactId: string
  version: number
  shielded?: boolean
}

export function SandboxIFrame({ code, artifactId, version, shielded = false }: SandboxIFrameProps) {
  const { resolvedTheme } = useTheme()
  const srcDoc = useMemo(
    () => buildSandboxSrcDoc(code, { artifactId, version, theme: resolvedTheme }),
    [artifactId, code, version, resolvedTheme]
  )

  return (
    <div className="relative h-full min-h-[260px] bg-bento-bg">
      {shielded && <div className="absolute inset-0 z-10 cursor-col-resize bg-transparent" />}
      <iframe
        title="Interactive sandbox"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="h-full w-full border-0 bg-bento-bg"
      />
    </div>
  )
}

