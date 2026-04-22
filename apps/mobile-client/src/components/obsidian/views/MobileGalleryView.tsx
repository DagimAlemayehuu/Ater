import React from 'react'
import { cn } from '../../../lib/utils'
import { FileText, Image as ImageIcon } from 'lucide-react'

interface MobileGalleryViewProps {
    rows: any[]
    schema: Record<string, any>
    hiddenProperties?: string[]
    onSelect: (row: any) => void
}

export function MobileGalleryView({ rows, schema, hiddenProperties = [], onSelect }: MobileGalleryViewProps) {
    const getImageField = (row: any) => {
        const keys = Object.keys(row)
        return keys.find(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('cover') || k.toLowerCase().includes('banner'))
    }

    return (
        <div className="grid grid-cols-2 gap-4 p-4 overflow-y-auto h-full custom-scrollbar bg-black/10">
            {rows.map((row, idx) => {
                const imageField = getImageField(row)
                const imageUrl = imageField ? row[imageField] : null

                return (
                    <div 
                        key={row.id || idx}
                        onClick={() => onSelect(row)}
                        className="flex flex-col bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all group"
                    >
                        {/* Preview Area */}
                        <div className="aspect-square bg-white/5 flex items-center justify-center relative overflow-hidden">
                            {imageUrl ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                                    <ImageIcon size={24} strokeWidth={1.5} />
                                    <span className="text-[8px] mt-2 font-black uppercase tracking-widest">Image Field</span>
                                </div>
                            ) : (
                                <FileText size={32} className="text-white/10 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                            )}
                            
                            {/* Status Badge Over Image */}
                            {row.status && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-foreground/80">{String(row.status)}</span>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-3">
                            <h3 className="text-[12px] font-bold text-foreground leading-tight line-clamp-2 min-h-[2.5em]">
                                {row.title || row.id?.replace('.md', '').replace(/_/g, ' ')}
                            </h3>
                            
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/50">
                                    {[row.course, row.category, row.status, 'Record']
                                        .filter(v => v && !hiddenProperties.includes(String(v)))[0]}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
            
            {/* Bottom spacer */}
            <div className="col-span-2 h-20" />
        </div>
    )
}
