import { describe, expect, it } from 'vitest'
import { buildSandboxSrcDoc, injectLoopGuardToJS, preprocessSandboxCode } from '../lib/artifacts/sandbox'

describe('buildSandboxSrcDoc', () => {
  it('injects Tailwind, Outfit, theme variables, and user code', () => {
    const srcDoc = buildSandboxSrcDoc('<main>Hello</main>')

    expect(srcDoc).toContain('https://cdn.tailwindcss.com')
    expect(srcDoc).toContain('fonts.googleapis.com/css2?family=Outfit')
    expect(srcDoc).toContain('--background')
    expect(srcDoc).toContain('<main>Hello</main>')
  })

  it('forwards runtime errors to the host frame', () => {
    const srcDoc = buildSandboxSrcDoc('<script>throw new Error("bad")</script>', {
      artifactId: 'artifact-1',
      version: 2,
    })

    expect(srcDoc).toContain('window.onerror')
    expect(srcDoc).toContain('window.parent.postMessage')
    expect(srcDoc).toContain('"ater:sandbox-error"')
    expect(srcDoc).toContain('"artifact-1"')
    expect(srcDoc).toContain('"version":2')
  })
})

describe('Loop-Guard Preprocessor', () => {
  it('injects guard variables and limits into infinite while loops', () => {
    const originalJs = `
      let x = 0;
      while (true) {
        x++;
      }
    `
    const guardedJs = injectLoopGuardToJS(originalJs)

    expect(guardedJs).toContain('let __guard_1 = 0;')
    expect(guardedJs).toContain('if (++__guard_1 > 1000000) throw new Error("Infinite loop detected: exceeded 1,000,000 iterations");')

    // Verify it halts at runtime and throws
    const fn = new Function(guardedJs)
    expect(() => fn()).toThrow('Infinite loop detected: exceeded 1,000,000 iterations')
  })

  it('injects guard variables and limits into infinite for loops', () => {
    const originalJs = `
      let y = 0;
      for (;;) {
        y++;
      }
    `
    const guardedJs = injectLoopGuardToJS(originalJs)

    expect(guardedJs).toContain('let __guard_1 = 0;')
    expect(guardedJs).toContain('if (++__guard_1 > 1000000) throw new Error("Infinite loop detected: exceeded 1,000,000 iterations");')

    // Verify it halts at runtime and throws
    const fn = new Function(guardedJs)
    expect(() => fn()).toThrow('Infinite loop detected: exceeded 1,000,000 iterations')
  })

  it('allows normal finite loops to run to completion', () => {
    const originalJs = `
      let sum = 0;
      for (let i = 0; i < 100; i++) {
        sum += i;
      }
      return sum;
    `
    const guardedJs = injectLoopGuardToJS(originalJs)
    const fn = new Function(guardedJs)
    expect(fn()).toBe(4950)
  })

  it('preprocesses script blocks inside HTML structure', () => {
    const htmlCode = `
      <div>Layout</div>
      <script>
        while (true) { console.log('infinite'); }
      </script>
      <script src="external.js"></script>
    `
    const preprocessed = preprocessSandboxCode(htmlCode)
    
    expect(preprocessed).toContain('let __guard_1 = 0;')
    expect(preprocessed).toContain('while (true)')
    expect(preprocessed).toContain('src="external.js"') // External scripts remain untouched
  })
})

