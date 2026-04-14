import React from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GalleryViewProps {
    rows: any[]
    schema: Record<string, any>
    onSelectRow: (fileName: string) => void
}

export function GalleryView({
    rows,
    schema,
    onSelectRow
}: GalleryViewProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 h-full overflow-auto custom-scrollbar pb-10">
            {rows.map(row => (
                <div 
                    key={row.id}
                    onClick={() => onSelectRow(row.id)}
                    className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-400 transition-all cursor-pointer group shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                >
                    {/* Card Header / Image Placeholder */}
                    <div className="h-24 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                        {row.properties.cover ? (
                            <img src={row.properties.cover} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 opacity-10">
                                <ImageIcon size={24} />
                            </div>
                        )}
                        {row.properties.icon && (
                            <div className="absolute -bottom-3 left-4 text-2xl bg-background p-1 rounded-lg border border-gray-200 shadow-sm group-hover:scale-110 transition-transform">
                                {row.properties.icon}
                            </div>
                        )}
                    </div>

                    <div className="p-4 pt-6 flex flex-col gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider group-hover:text-primary transition-colors truncate">{row.title}</h4>
                        
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {Object.entries(row.properties).map(([key, val]) => {
                                if (['cover', 'icon', 'status'].includes(key)) return null;
                                if (!val || typeof val === 'object') return null;
                                
                                const type = schema[key];
                                return (
                                    <div key={key} className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-[8px] font-bold opacity-60">
                                        <span className="opacity-40">{key}:</span>
                                        <span className="truncate max-w-[80px]">{String(val)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
