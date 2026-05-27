/**
 * ExplainSidebar — thin wrapper that maps the legacy props API onto
 * the new AterExplainDialog component. All callers (MarkdownViewer,
 * PdfViewer) keep the same import/prop surface.
 */
import React from 'react'
import { AterExplainDialog, makeExplainSidebarFetchers } from './AterExplainDialog'

export interface ExplainSidebarProps {
  isOpen: boolean
  onClose: () => void
  selection: string
  path?: string
  page?: number
  noteMode?: string
  noteTitle?: string
  noteCourse?: string
  scope?: 'selection' | 'page' | 'note'
  sourceKind?: 'markdown' | 'pdf'
  selectionContext?: string
}

export function ExplainSidebar({
  isOpen,
  onClose,
  selection,
  path = '',
  page,
  noteMode,
  noteTitle,
  noteCourse,
  scope = 'selection',
  sourceKind,
  selectionContext = '',
}: ExplainSidebarProps) {
  const { initialFetcher, followUpFetcher } = makeExplainSidebarFetchers({
    path,
    selection,
    page,
    scope,
    sourceKind,
    selectionContext,
    noteMode,
    noteTitle,
    noteCourse,
  })

  const subLabel = noteTitle
    ? noteTitle.replace(/_/g, ' ')
    : sourceKind === 'pdf'
    ? `PDF page ${page ?? 1}`
    : undefined

  return (
    <AterExplainDialog
      isOpen={isOpen}
      onClose={onClose}
      contextLabel={
        scope === 'page'
          ? `Page ${page ?? 1} — ${selection.slice(0, 120)}`
          : selection.slice(0, 180)
      }
      subLabel={subLabel}
      initialFetcher={initialFetcher}
      followUpFetcher={followUpFetcher}
    />
  )
}
