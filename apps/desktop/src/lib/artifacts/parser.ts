import type { ArtifactChapter, ExtractedArtifacts, InteractiveArtifact, SandboxSpec } from './types'

const attr = (tag: string, name: string): string | undefined => {
  if (!tag) return undefined
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))
  return match?.[2] ? decodeEntities(match[2]).trim() : undefined
}

const decodeEntities = (value: string): string => {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

const stripTags = (value: string): string => {
  return decodeEntities(value
    .replace(/<\/?(artifact|chapter|sandbox|sandbox-spec)\b[^>]*>/gi, ''))
}

const completeForParsing = (source: string): string => {
  let value = source
  const opens = (name: string) => (value.match(new RegExp(`<${name}\\b`, 'gi')) || []).length
  const closes = (name: string) => (value.match(new RegExp(`</${name}>`, 'gi')) || []).length

  for (const name of ['sandbox', 'chapter', 'artifact']) {
    const missing = opens(name) - closes(name)
    for (let index = 0; index < missing; index += 1) {
      value += `</${name}>`
    }
  }

  return value
}

const dedent = (text: string): string => {
  const lines = text.split('\n')
  let minIndent = Infinity
  for (const line of lines) {
    if (line.trim().length === 0) continue
    const match = line.match(/^(\s*)/)
    if (match) {
      const indent = match[1].length
      if (indent < minIndent) {
        minIndent = indent
      }
    }
  }

  let result = text
  if (minIndent !== Infinity && minIndent > 0) {
    result = lines
      .map((line) => {
        if (line.trim().length === 0) return ''
        let count = 0
        let i = 0
        while (i < line.length && count < minIndent) {
          if (line[i] === ' ' || line[i] === '\t') {
            count++
            i++
          } else {
            break
          }
        }
        return line.slice(i)
      })
      .join('\n')
  }
  return result.trim()
}

const extractSandbox = (chapterBody: string): { content: string; sandbox?: string; sandboxSpec?: string } => {
  const sandboxMatch = chapterBody.match(/<sandbox\b[^>]*>([\s\S]*?)<\/sandbox>/i)
  const sandboxSpecMatch = chapterBody.match(/<sandbox-spec\b[^>]*>([\s\S]*?)<\/sandbox-spec>/i)
  const withoutSandbox = chapterBody
    .replace(/<sandbox\b[^>]*>[\s\S]*?<\/sandbox>/gi, '')
    .replace(/<sandbox-spec\b[^>]*>[\s\S]*?<\/sandbox-spec>/gi, '')

  return {
    content: dedent(stripTags(withoutSandbox)),
    sandbox: sandboxMatch?.[1] ? dedent(sandboxMatch[1]) : undefined,
    sandboxSpec: sandboxSpecMatch?.[1] ? dedent(sandboxSpecMatch[1]) : undefined,
  }
}

const parseChapters = (artifactBody: string, artifactIndex: number): ArtifactChapter[] => {
  const chapters: ArtifactChapter[] = []
  const chapterRegex = /(<chapter\b[^>]*>)([\s\S]*?)<\/chapter>/gi
  let match: RegExpExecArray | null
  let bodyWithoutChapters = artifactBody

  while ((match = chapterRegex.exec(artifactBody)) !== null) {
    bodyWithoutChapters = bodyWithoutChapters.replace(match[0], '')
    const index = chapters.length + 1
    const title = attr(match[1], 'title') || `Chapter ${index}`
    const { content, sandbox, sandboxSpec } = extractSandbox(match[2])
    chapters.push({
      id: `artifact-${artifactIndex}-chapter-${index}`,
      title,
      content,
      sandbox,
      sandboxSpec,
      sandboxPlaceholderId: sandboxSpec ? `sandbox-spec-${artifactIndex}-${index}` : undefined,
    })
  }

  const artifactLevelSandbox = extractSandbox(bodyWithoutChapters)
  if (chapters.length > 0 && (artifactLevelSandbox.sandbox || artifactLevelSandbox.sandboxSpec)) {
    const index = chapters.length + 1
    chapters.push({
      id: `artifact-${artifactIndex}-chapter-${index}`,
      title: 'Interactive Sandbox',
      content: artifactLevelSandbox.content,
      sandbox: artifactLevelSandbox.sandbox,
      sandboxSpec: artifactLevelSandbox.sandboxSpec,
      sandboxPlaceholderId: artifactLevelSandbox.sandboxSpec ? `sandbox-spec-${artifactIndex}-${index}` : undefined,
    })
  }

  if (chapters.length === 0 && stripTags(artifactBody).trim()) {
    const { content, sandbox, sandboxSpec } = extractSandbox(artifactBody)
    chapters.push({
      id: `artifact-${artifactIndex}-chapter-1`,
      title: 'Chapter 1',
      content,
      sandbox,
      sandboxSpec,
      sandboxPlaceholderId: sandboxSpec ? `sandbox-spec-${artifactIndex}-1` : undefined,
    })
  }

  return chapters
}

export function extractArtifacts(source: string | null | undefined): ExtractedArtifacts {
  if (!source || typeof source !== 'string') {
    return { artifacts: [], sandboxSpecs: [] }
  }
  const completed = completeForParsing(source)
  const artifacts: InteractiveArtifact[] = []
  const artifactRegex = /(<artifact\b[^>]*>)([\s\S]*?)<\/artifact>/gi
  let match: RegExpExecArray | null
  let sourceWithoutArtifacts = completed

  while ((match = artifactRegex.exec(completed)) !== null) {
    sourceWithoutArtifacts = sourceWithoutArtifacts.replace(match[0], '')
    const index = artifacts.length + 1
    const title = attr(match[1], 'title') || `Artifact ${index}`
    const chapters = parseChapters(match[2], index)

    artifacts.push({
      id: `artifact-${index}`,
      title,
      versions: [
        {
          version: 1,
          chapters,
          raw: match[0],
        },
      ],
    })
  }

  const sandboxSpecs: SandboxSpec[] = []
  const specRegex = /<sandbox-spec\b[^>]*>([\s\S]*?)(?:<\/sandbox-spec>|$)/gi
  let specMatch: RegExpExecArray | null

  while ((specMatch = specRegex.exec(sourceWithoutArtifacts)) !== null) {
    const prompt = stripTags(specMatch[1])
    if (prompt) {
      sandboxSpecs.push({
        prompt,
        placeholderId: `sandbox-spec-${sandboxSpecs.length + 1}`,
      })
    }
  }

  return { artifacts, sandboxSpecs }
}

export function stripArtifactMarkup(source: string): string {
  let specIndex = 0
  return source
    .replace(/<artifact\b[^>]*>[\s\S]*?(?:<\/artifact>|$)/gi, '')
    .replace(/<sandbox-spec\b[^>]*>([\s\S]*?)(?:<\/sandbox-spec>|$)/gi, (_match, body) => {
      specIndex += 1
      const prompt = stripTags(body)
      return prompt ? `\n\n[Interactive sandbox: ${prompt}]\n\n` : `\n\n[Interactive sandbox ${specIndex}]\n\n`
    })
    .trim()
}
