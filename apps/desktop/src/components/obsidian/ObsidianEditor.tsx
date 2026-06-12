import React, { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, drawSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { autocompletion } from '@codemirror/autocomplete'
import { useTheme } from '@/context/theme-provider'

interface ObsidianEditorProps {
  value: string
  onChange: (v: string) => void
  noteList?: string[]
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

export function ObsidianEditor({ value, onChange, noteList = [], onKeyDown }: ObsidianEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const { resolvedTheme } = useTheme()

  // Keep the onChange reference fresh to avoid re-initializing CodeMirror
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    // Autocomplete Source for Wikilinks: [[Note_Name]]
    const wikilinkCompletionSource = (context: any) => {
      // Find matches for [[ followed by non-bracket characters
      const word = context.matchBefore(/\[\[([^\]]*)/)
      if (!word) return null

      // Fetch possible matches based on search term
      const searchStr = word.text.slice(2).toLowerCase()
      const filteredNotes = noteList.filter(name => 
        name.toLowerCase().includes(searchStr)
      )

      return {
        from: word.from + 2, // Complete starting after the [[ brackets
        options: filteredNotes.map(name => ({
          label: name,
          type: "keyword",
          detail: "Note link"
        }))
      }
    }

    const extensions = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      drawSelection(),
      EditorView.lineWrapping,
      markdown(),
      autocompletion({ override: [wikilinkCompletionSource] }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--foreground))"
        },
        ".cm-scroller": {
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "14px",
          lineHeight: "1.7",
          padding: "20px"
        },
        ".cm-content": {
          caretColor: "hsl(var(--foreground))"
        },
        "&.cm-focused .cm-cursor": {
          borderLeftColor: "hsl(var(--foreground))"
        },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
          backgroundColor: "rgba(128, 128, 128, 0.2) !important"
        },
        ".cm-gutters": {
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--muted-foreground))",
          border: "none"
        }
      }, { dark: resolvedTheme === 'dark' })
    ]

    if (resolvedTheme === 'dark') {
      extensions.push(oneDark)
    }

    const state = EditorState.create({
      doc: value,
      extensions
    })

    const view = new EditorView({
      state,
      parent: containerRef.current
    })
    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [noteList, resolvedTheme])

  // Sync value changes from parent if they diverge from the local state
  useEffect(() => {
    const view = viewRef.current
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value }
      })
    }
  }, [value])

  return (
    <div 
      ref={containerRef} 
      onKeyDown={onKeyDown}
      className="w-full h-[600px] border border-border rounded-[4px] overflow-hidden focus-within:ring-1 focus-within:ring-white/20 transition-all"
    />
  )
}
