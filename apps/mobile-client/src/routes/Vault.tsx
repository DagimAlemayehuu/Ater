import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { File, Folder, ChevronRight, Search, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Vault() {
  const [files, setFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sidecarApi.listObsidianFiles()
        setFiles(res.files)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col p-6 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <span className="label-sm">Knowledge Base</span>
        <h1 className="display-md uppercase">The<br/><span className="text-muted-foreground/30 text-3xl">Vault</span></h1>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
        <input 
          type="text"
          placeholder="SEARCH ASSETS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 bg-accent/30 border-none rounded-md px-12 text-[11px] font-black tracking-widest focus:ring-1 focus:ring-primary transition-all outline-none"
        />
      </div>

      <div className="space-y-px bg-border/5 rounded-md overflow-hidden border border-border/10">
        {isLoading ? (
          Array(10).fill(0).map((_, i) => <div key={i} className="h-14 bg-accent/10 animate-pulse" />)
        ) : (
          filteredFiles.slice(0, 50).map((file, i) => (
            <Link
              key={i}
              to={file.is_dir ? '#' : `/note/${encodeURIComponent(file.path)}`}
              className={cn(
                "flex items-center justify-between p-4 bg-background transition-all border-b border-border/5 last:border-0",
                file.is_dir ? "opacity-50" : "hover:bg-accent/5"
              )}
            >
              <div className="flex items-center gap-3">
                {file.is_dir ? (
                  <Folder size={16} className="text-muted-foreground/50" />
                ) : (
                    file.name.endsWith('.pdf') ? <File size={16} className="text-primary/50" /> : <FileText size={16} className="text-muted-foreground" />
                )}
                <div>
                  <p className="text-[11px] font-black uppercase truncate max-w-[240px]">{file.name}</p>
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase truncate max-w-[240px]">
                    {file.path}
                  </p>
                </div>
              </div>
              {!file.is_dir && <ChevronRight size={14} className="text-muted-foreground/20" />}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
