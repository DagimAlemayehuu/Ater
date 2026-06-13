import { UnifiedSandboxViewer } from './UnifiedSandboxViewer'

interface ArtifactViewerProps {
  shielded?: boolean
}

export function ArtifactViewer({ shielded = false }: ArtifactViewerProps) {
  return <UnifiedSandboxViewer shielded={shielded} />
}
