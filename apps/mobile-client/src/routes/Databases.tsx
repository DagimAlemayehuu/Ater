import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { Plus, ChevronRight, Search, Database as DatabaseIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Databases() {
  const [databases, setDatabases] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sidecarApi.listVaultDatabases()
        setDatabases(res.databases)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredDbs = databases.filter(db => 
    db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.area?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col p-6 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <span className="label-sm">Sector</span>
        <h1 className="display-md uppercase">Core<br/><span className="text-muted-foreground/30 text-3xl">Databases</span></h1>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
        <input 
          type="text"
          placeholder="SEARCH MODULES..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 bg-accent/30 border-none rounded-md px-12 text-[11px] font-black tracking-widest focus:ring-1 focus:ring-primary transition-all outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-accent/20 animate-pulse rounded-md" />
          ))
        ) : (
          filteredDbs.map(db => (
            <button 
              key={db.id}
                                          onClick={() => window.location.href = `/databases/${db.id}`}
              className="flex flex-col p-6 bg-accent/20 border border-border/10 rounded-md hover:bg-accent/40 transition-all text-left group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="label-sm text-muted-foreground/40">{db.area || 'GLOBAL'}</span>
                  <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                    {db.name}
                  </h3>
                </div>
                <div className="p-2 bg-background rounded-sm">
                  <DatabaseIcon size={14} className="text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">
                  Active Sub-Sector
                </span>
                <ChevronRight size={14} className="text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
              </div>
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
            </button>
          ))
        )}
        
        <button className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/20 rounded-md hover:border-primary/30 hover:bg-accent/10 transition-all gap-2">
          <Plus size={20} className="text-muted-foreground" />
          <span className="label-sm">Initialize New Module</span>
        </button>
      </div>
    </div>
  )
}
