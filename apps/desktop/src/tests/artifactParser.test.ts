import { describe, expect, it } from 'vitest'
import { extractArtifacts, stripArtifactMarkup } from '../lib/artifacts/parser'

describe('extractArtifacts', () => {
  it('extracts complete artifact chapters and sandbox code', () => {
    const result = extractArtifacts(`
Intro text.
<artifact title="Linear Motion">
  <chapter title="Position">
    Position changes over time.
    <sandbox>
      <div id="plot"></div><script>window.x = 1</script>
    </sandbox>
  </chapter>
</artifact>
`)

    expect(result.artifacts).toHaveLength(1)
    expect(result.artifacts[0]).toMatchObject({
      title: 'Linear Motion',
      versions: [
        {
          version: 1,
          chapters: [
            {
              title: 'Position',
              content: 'Position changes over time.',
              sandbox: '<div id="plot"></div><script>window.x = 1</script>',
            },
          ],
        },
      ],
    })
  })

  it('tolerates truncated streaming tags without throwing', () => {
    const result = extractArtifacts(`
<artifact title="Derivatives">
  <chapter title="Slope">A derivative measures local slope.
    <sandbox><div>Graph
`)

    expect(result.artifacts).toHaveLength(1)
    expect(result.artifacts[0].versions[0].chapters[0]).toMatchObject({
      title: 'Slope',
      content: 'A derivative measures local slope.',
      sandbox: '<div>Graph',
    })
  })

  it('extracts sandbox specs for two-stage generation and leaves lesson text renderable', () => {
    const source = 'Explain slope. <sandbox-spec>interactive secant line graph</sandbox-spec> Continue.'
    const result = extractArtifacts(source)

    expect(result.sandboxSpecs).toEqual([
      {
        prompt: 'interactive secant line graph',
        placeholderId: 'sandbox-spec-1',
      },
    ])
    expect(stripArtifactMarkup(source)).toContain('[Interactive sandbox: interactive secant line graph]')
  })

  it('decodes escaped XML entities in titles and chapter text', () => {
    const result = extractArtifacts(`
<artifact title="Solving A Rubik&apos;s Cube">
  <chapter title="Chapter 1: NOTATION &amp; ORIENTATION">
    Learn R &amp; U moves without breaking solved pieces.
  </chapter>
</artifact>
`)

    expect(result.artifacts[0].title).toBe("Solving A Rubik's Cube")
    expect(result.artifacts[0].versions[0].chapters[0].title).toBe('Chapter 1: NOTATION & ORIENTATION')
    expect(result.artifacts[0].versions[0].chapters[0].content).toContain('R & U moves')
  })

  it('attaches artifact-level sandbox specs as an interactive sandbox chapter', () => {
    const result = extractArtifacts(`
<artifact title="Rubik Lesson">
  <chapter title="Notation">Learn U and R turns.</chapter>
  <sandbox-spec>interactive Rubik's Cube stepper</sandbox-spec>
</artifact>
`)

    expect(result.sandboxSpecs).toEqual([])
    expect(result.artifacts[0].versions[0].chapters).toHaveLength(2)
    expect(result.artifacts[0].versions[0].chapters[1]).toMatchObject({
      title: 'Interactive Sandbox',
      sandboxSpec: "interactive Rubik's Cube stepper",
    })
  })

  it('dedents chapter content and sandbox specs', () => {
    const result = extractArtifacts(`
<artifact title="Indent Test">
  <chapter title="Intro">
    Line 1.
    Line 2.
    <sandbox-spec>
      Spec line 1.
      Spec line 2.
    </sandbox-spec>
  </chapter>
</artifact>
`)

    expect(result.artifacts[0].versions[0].chapters[0].content).toBe('Line 1.\nLine 2.')
    expect(result.artifacts[0].versions[0].chapters[0].sandboxSpec).toBe('Spec line 1.\nSpec line 2.')
  })
})
