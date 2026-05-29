import React, { useState } from 'react'
import { 
  FileText, Calendar, Hash, Link as LinkIcon, List, Info, CheckSquare, GraduationCap, Network, Circle, X, Plus 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotePropertiesProps {
  metadata: Record<string, any>
  onNavigate: (link: string, page?: number) => void
  onAddProperty: (name: string, type: string) => void
  onUpdateProperty: (name: string, value: any) => void
  onDeleteProperty: (name: string) => void
}

export const NoteProperties = React.memo(({
  metadata, 
  onNavigate,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty
}: NotePropertiesProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedType, setSelectedType] = useState('text')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const safeMetadata = metadata || {}

  // Filter out common internal keys that shouldn't be displayed as "properties"
  const displayMetadata = Object.entries(safeMetadata).filter(([key]) => 
    !['title', 'position', 'frontmatter'].includes(key.toLowerCase())
  )

  const typeOptions = [
    {id: 'text', label: 'Text', icon: <FileText size={11} />},
    {id: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={11} />},
    {id: 'date', label: 'Date', icon: <Calendar size={11} />},
    {id: 'number', label: 'Number', icon: <Hash size={11} />},
    {id: 'link', label: 'Link', icon: <LinkIcon size={11} />},
    {id: 'list', label: 'List', icon: <List size={11} />}
  ]

  const getPropertyType = (key: string, value: any) => {
    const k = key.toLowerCase()
    if (['hub', 'source'].includes(k)) return 'link'
    if (['read', 'generated'].includes(k) || typeof value === 'boolean') return 'checkbox'
    if (k === 'type') return 'text'
    if (typeof value === 'number' || k.includes('unit')) return 'number'
    if (k.includes('date') || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) return 'date'
    if (Array.isArray(value)) return 'list'
    return 'text'
  }

  const getPropertyIcon = (key: string, value: any) => {
    const type = getPropertyType(key, value)
    const k = key.toLowerCase()
    
    if (k.includes('course')) return <GraduationCap size={14} />
    if (k.includes('hub')) return <Network size={14} />
    if (type === 'link') return <LinkIcon size={14} />
    if (type === 'checkbox') return <CheckSquare size={14} />
    if (type === 'date' || k.includes('semester')) return <Calendar size={14} />
    if (type === 'number') return <Hash size={14} />
    if (type === 'list') return <List size={14} />
    if (k.includes('status')) return <Circle size={14} />
    return <Info size={14} />
  }
  
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'Empty'
    if (Array.isArray(val)) {
      if (val.every(item => typeof item === 'number' || typeof item === 'string')) {
        return val.join(', ')
      }
      return JSON.stringify(val)
    }
    return String(val)
  }

  const handleValueSubmit = (key: string) => {
    const type = getPropertyType(key, safeMetadata[key])
    let finalVal: any = editValue
    
    if (type === 'list') {
      try {
        finalVal = JSON.parse(editValue)
        if (!Array.isArray(finalVal)) finalVal = [editValue]
      } catch {
        finalVal = editValue.split(',').map(s => s.trim()).filter(s => s.length > 0)
      }
    } else if (editValue.toLowerCase() === 'true') {
      finalVal = true
    } else if (editValue.toLowerCase() === 'false') {
      finalVal = false
    } else if (!isNaN(Number(editValue)) && editValue.trim() !== '' && type === 'number') {
      finalVal = Number(editValue)
    }
    
    onUpdateProperty(key, finalVal)
    setEditingKey(null)
  }

  const renderPropertyValue = (key: string, value: any) => {
    const k = key.toLowerCase()
    const type = getPropertyType(key, value)
    const valStr = formatValue(value)

    if (type === 'checkbox') {
      return (
        <input 
          type="checkbox"
          checked={!!value}
          onChange={(e) => onUpdateProperty(key, e.target.checked)}
          className="h-3.5 w-3.5 shrink-0 appearance-none border border-[#242426] bg-[#1a1a1c] rounded-[4px] checked:bg-foreground/10 checked:border-foreground/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[4px] after:top-[0.5px] after:w-[3px] after:h-[7px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 cursor-pointer transition-all hover:border-foreground/20"
        />
      )
    }

    // Source and Page Waypoint navigation
    const sourceKey = Object.keys(safeMetadata).find(mk => mk.toLowerCase() === 'source')
    const sourcePagesPattern = /source[ _-]pages|page|pages/
    const isSourcePagesKey = sourcePagesPattern.test(k)
    
    if (sourceKey && (k === 'source' || isSourcePagesKey)) {
      const sourceVal = safeMetadata[sourceKey]
      const sourcePagesKey = Object.keys(safeMetadata).find(mk => sourcePagesPattern.test(mk.toLowerCase()))
      
      const extractPageNumber = (v: any): number | undefined => {
        if (v === null || v === undefined) return undefined
        if (Array.isArray(v)) {
          const first = v.find(item => !isNaN(Number(item)))
          return first !== undefined ? Number(first) : undefined
        }
        const match = String(v).match(/\d+/)
        return match ? parseInt(match[0], 10) : undefined
      }
      
      const pageNum = sourcePagesKey ? extractPageNumber(safeMetadata[sourcePagesKey]) : undefined
      let cleanSource = ''
      if (Array.isArray(sourceVal) && sourceVal.length > 0) {
        const first = sourceVal[0]
        if (typeof first === 'string') {
          cleanSource = first.replace(/[\[\]]/g, '').split('|')[0].trim()
        }
      } else if (typeof sourceVal === 'string') {
        cleanSource = sourceVal.replace(/[\[\]]/g, '').split('|')[0].trim()
      }

      if (cleanSource) {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(cleanSource, pageNum)
            }}
            className="text-primary hover:underline underline-offset-4 decoration-primary/30 text-left font-bold truncate max-w-full"
          >
            {valStr}
          </button>
        )
      }
    }

    if (type === 'link' || valStr.includes('[[')) {
      const isExplicitLink = valStr.includes('[[')
      const links = isExplicitLink ? (valStr.match(/\[\[(.*?)\]\]/g) || []) : (type === 'link' ? [`[[${value}]]`] : [])
      
      if (links.length === 0) return <span className="w-full truncate">{valStr}</span>

      return (
        <div className="flex flex-wrap gap-1">
          {links.map((link, i) => {
            const clean = link.replace(/[\[\]]/g, '').split('|')[0].trim()
            if (!clean) return null
            const label = link.replace(/[\[\]]/g, '').split('|')[1] || clean.split(/[/\\]/).pop()
            return (
              <button 
                key={i}
                onClick={(e) => {e.stopPropagation(); if (clean) onNavigate(clean);}}
                className="text-primary hover:underline underline-offset-4 decoration-primary/30 truncate text-left font-bold"
              >
                {label}
              </button>
            )
          })}
        </div>
      )
    }

    if (key.toLowerCase() === 'status') {
      return (
        <span className={cn(
          "px-1.5 py-0.5 rounded-[6px] text-[9px] uppercase font-bold tracking-widest",
          String(value).toLowerCase().includes('complete') ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-muted border border-border text-muted-foreground'
        )}>{valStr}</span>
      )
    }

    return <span className="w-full truncate">{valStr}</span>
  }

  return (
    <div className="flex flex-col gap-4 mb-12 ">
      <div className="grid grid-cols-1 gap-y-1.5 py-6" data-purpose="note-metadata">
        {displayMetadata.map(([key, value]) => (
          <div key={key} className="flex items-center gap-3 group/prop hover:bg-muted/10 px-2 py-1 -mx-2 rounded-[6px] ">
            <div className="w-4 flex justify-center text-muted-foreground/30 group-hover/prop:text-primary ">
              {getPropertyIcon(key, value)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
              <div className="text-[12px] font-medium text-foreground truncate min-h-[18px] flex items-center">
                {editingKey === key ? (
                  <input 
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleValueSubmit(key)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValueSubmit(key)}
                    className="w-full bg-transparent border-none p-0 text-[12px] focus:ring-0 text-primary font-bold"
                  />
                ) : (
                  <div 
                    className="cursor-text w-full truncate"
                    onClick={() => {
                      const type = getPropertyType(key, value);
                      if (type !== 'checkbox' && !String(value).includes('[[')) {
                        setEditingKey(key); 
                        setEditValue(String(value)); 
                      }
                    }}
                  >
                    {renderPropertyValue(key, value)}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => onDeleteProperty(key)}
              className="opacity-0 group-hover/prop:opacity-100 p-1 hover:text-destructive "
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border/10">
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 hover:text-primary  py-2"
          >
            <Plus size={10} /> Add Property
          </button>
        ) : (
          <div className="flex items-center gap-4 py-2 ">
            <input 
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="NAME"
              className="w-32 bg-transparent border-b border-border/50 text-[10px] font-black uppercase tracking-widest placeholder:text-muted-foreground/10 focus:border-primary focus:ring-0 "
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName) {
                  onAddProperty(newName, selectedType)
                  setNewName('')
                  setIsAdding(false)
                }
                if (e.key === 'Escape') setIsAdding(false)
              }}
            />
            <div className="flex items-center gap-1.5">
              {typeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedType(opt.id)}
                  title={opt.label}
                  className={cn(
                    "p-1.5 rounded-[6px] transition-none",
                    selectedType === opt.id ? "bg-foreground/10 text-foreground" : "text-muted-foreground/20 hover:text-foreground"
                  )}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button onClick={() => setIsAdding(false)} className="text-[9px] font-bold text-muted-foreground/30 hover:text-foreground uppercase">Cancel</button>
              <button 
                onClick={() => {if(newName) {onAddProperty(newName, selectedType); setNewName(''); setIsAdding(false);}}}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-[6px] text-[9px] font-bold uppercase tracking-widest"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

NoteProperties.displayName = 'NoteProperties'
