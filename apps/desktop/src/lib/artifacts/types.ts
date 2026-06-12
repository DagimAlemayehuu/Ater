export interface ArtifactChapter {
  id: string
  title: string
  content: string
  sandbox?: string
  sandboxSpec?: string
  sandboxPlaceholderId?: string
}

export interface ArtifactVersion {
  version: number
  chapters: ArtifactChapter[]
  raw: string
}

export interface InteractiveArtifact {
  id: string
  title: string
  versions: ArtifactVersion[]
}

export interface SandboxSpec {
  prompt: string
  placeholderId: string
}

export interface ExtractedArtifacts {
  artifacts: InteractiveArtifact[]
  sandboxSpecs: SandboxSpec[]
}

export interface SandboxRuntimeError {
  artifactId: string
  version: number
  message: string
  source?: string
  lineno?: number
  colno?: number
  stack?: string
}
