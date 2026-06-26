import React, { useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@/context/theme-provider'

type HtmlLessonViewerProps = {
  content: string
  title: string
  activePath?: string | null
  tree?: any[]
  onNavigate?: (path: string) => void
  files?: any[]
}

export function HtmlLessonViewer({ 
  content, 
  title,
  activePath = null,
  tree = [],
  onNavigate,
  files = []
}: HtmlLessonViewerProps) {
  const { resolvedTheme } = useTheme()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const processedContent = useMemo(() => {
    if (!content) return content
    if (content.includes('<html')) {
      return content.replace('<html', `<html class="${resolvedTheme}"`)
    }
    return content
  }, [content, resolvedTheme])
  useEffect(() => {
    if (!onNavigate || !activePath) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEXT_NOTE') {
        // 1. Try to navigate using tree
        if (tree && tree.length > 0) {
          const flattened: any[] = []
          const traverse = (nodes: any[]) => {
            for (const node of nodes) {
              if (node.target) flattened.push(node)
              if (node.children && node.children.length > 0) traverse(node.children)
            }
          }
          traverse(tree)

          const activeNoteName = activePath.split(/[/\\]/).pop()?.replace('.md', '').replace('.html', '').replace('.pdf', '') || ''

          const currentIndex = flattened.findIndex(n => {
            if (!n.target) return false
            const targetName = n.target.split(/[/\\]/).pop()?.replace('.md', '').replace('.html', '') || n.target
            return targetName === activeNoteName || n.target === activePath
          })

          const nextNode = currentIndex < flattened.length - 1 && currentIndex !== -1 ? flattened[currentIndex + 1] : null
          if (nextNode && nextNode.target) {
            onNavigate(nextNode.target)
            return
          }
        }

        // 2. Sibling file fallback: if tree is empty or doesn't resolve, advance
        // from the exact current file in sorted sibling order.
        if (files && files.length > 0) {
          const currentPath = activePath.replace(/\\/g, '/');
          const parts = currentPath.split('/');
          parts.pop();
          const parentDir = parts.join('/');

          const siblingLessons = files
            .filter((f: any) => {
              const fPath = f.path.replace(/\\/g, '/');
              const fParent = fPath.split('/').slice(0, -1).join('/');
              return fParent === parentDir && (f.name.endsWith('.md') || f.name.endsWith('.html'));
            })
            .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          const currentIndex = siblingLessons.findIndex((f: any) => f.path.replace(/\\/g, '/') === currentPath);
          const nextFile = currentIndex >= 0 ? siblingLessons[currentIndex + 1] : null;
          if (nextFile) {
            onNavigate(nextFile.path);
            return;
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [tree, activePath, onNavigate, files])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const updateTheme = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc && doc.documentElement) {
          if (resolvedTheme === 'dark') {
            doc.documentElement.classList.add('dark')
            doc.documentElement.classList.remove('light')
          } else {
            doc.documentElement.classList.add('light')
            doc.documentElement.classList.remove('dark')
          }
        }
      } catch (e) {
        console.error('Failed to apply theme to iframe', e)
      }
    }

    updateTheme()
    iframe.addEventListener('load', updateTheme)
    return () => {
      iframe.removeEventListener('load', updateTheme)
    }
  }, [resolvedTheme])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bento-panel">
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={processedContent}
        sandbox="allow-scripts allow-forms"
        className="flex-1 w-full bg-bento-panel border-none"
      />
    </div>
  )
}
