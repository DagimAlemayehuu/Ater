type HtmlLessonViewerProps = {
  content: string
  title: string
}

export function HtmlLessonViewer({ content, title }: HtmlLessonViewerProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[8px] border border-border bg-bento-bg">
      <div className="shrink-0 border-b border-border bg-bento-panel px-4 py-3">
        <p className="truncate text-[11px] font-black uppercase tracking-widest text-foreground">{title}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Interactive HTML Lesson</p>
      </div>
      <iframe
        title={title}
        srcDoc={content}
        sandbox="allow-scripts allow-forms"
        className="min-h-[720px] flex-1 w-full bg-background"
      />
    </div>
  )
}
