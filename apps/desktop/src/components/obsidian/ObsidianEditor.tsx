import React, { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, drawSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { autocompletion } from '@codemirror/autocomplete'

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

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        drawSelection(),
        EditorView.lineWrapping,
        markdown(),
        oneDark,
        autocompletion({ override: [wikilinkCompletionSource] }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            backgroundColor: "#151517",
            color: "#ebebeb"
          },
          ".cm-scroller": {
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "14px",
            lineHeight: "1.7",
            padding: "20px"
          },
          ".cm-content": {
            caretColor: "#ebebeb"
          },
          "&.cm-focused .cm-cursor": {
            borderLeftColor: "#ebebeb"
          },
          "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
            backgroundColor: "rgba(255, 255, 255, 0.1) !important"
          },
          ".cm-gutters": {
            backgroundColor: "#151517",
            color: "#404040",
            border: "none"
          }
        }, { dark: true })
      ]
    })

    const view = new EditorView({
      state,
      parent: containerRef.current
    })
    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [noteList])

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
      className="w-full h-[600px] border border-[#242426] rounded-[4px] overflow-hidden focus-within:ring-1 focus-within:ring-white/20 transition-all"
    />
  )
}
