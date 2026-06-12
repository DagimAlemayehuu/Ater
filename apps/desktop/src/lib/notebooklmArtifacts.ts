export interface NotebookLMArtifactLike {
  artifact_id?: string
  artifactId?: string
  id?: string
  artifact_type?: string
  artifactType?: string
  type?: string
  kind?: string
  status?: string
  title?: string
  name?: string
}

const ARTIFACT_LABELS: Record<string, string> = {
  audio: 'Audio Overview',
  video: 'Video Overview',
  report: 'Report',
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  mind_map: 'Mind Map',
  mindmap: 'Mind Map',
  slide_deck: 'Slide Deck',
  slides: 'Slide Deck',
  infographic: 'Infographic',
  data_table: 'Data Table',
  'data-table': 'Data Table',
}

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const getNotebookLMArtifactId = (artifact: NotebookLMArtifactLike) =>
  normalizeText(artifact.artifact_id) || normalizeText(artifact.artifactId) || normalizeText(artifact.id)

export const getNotebookLMArtifactType = (artifact: NotebookLMArtifactLike) =>
  normalizeText(artifact.artifact_type) ||
  normalizeText(artifact.artifactType) ||
  normalizeText(artifact.type) ||
  normalizeText(artifact.kind) ||
  'unknown'

export const getNotebookLMArtifactTitle = (artifact: NotebookLMArtifactLike) =>
  normalizeText(artifact.title) || normalizeText(artifact.name)

export const getNotebookLMArtifactLabel = (artifactOrType: NotebookLMArtifactLike | string | undefined | null) => {
  if (typeof artifactOrType === 'string') {
    const type = normalizeText(artifactOrType)
    return ARTIFACT_LABELS[type] || type.replace(/[-_]/g, ' ') || 'Artifact'
  }

  const artifact = artifactOrType || {}
  const title = getNotebookLMArtifactTitle(artifact)
  if (title) return title

  const type = getNotebookLMArtifactType(artifact)
  return ARTIFACT_LABELS[type] || type.replace(/[-_]/g, ' ') || 'Artifact'
}

export const getNotebookLMDownloadFormat = (
  artifact: NotebookLMArtifactLike,
  selectedFormats: Record<string, string>,
) => {
  const id = getNotebookLMArtifactId(artifact)
  const selected = selectedFormats[id]
  const type = getNotebookLMArtifactType(artifact)
  if (selected) return selected
  if (type === 'quiz' || type === 'flashcards') return 'json'
  if (type === 'slide_deck' || type === 'slides') return 'pdf'
  return ''
}
