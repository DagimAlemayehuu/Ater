export function shouldShowArtifactReopenButton(artifactCount: number, isPanelOpen: boolean): boolean {
  return artifactCount > 0 && !isPanelOpen
}
