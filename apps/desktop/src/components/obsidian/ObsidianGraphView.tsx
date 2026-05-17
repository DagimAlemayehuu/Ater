import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import * as d3 from 'd3-force'
import { sidecarApi } from '@/lib/sidecarApi'
import { ZoomIn, ZoomOut, Maximize, Settings, X, Play, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'

interface NodeData {
    id: string
    name: string
    val: number
    group: string
    x?: number
    y?: number
}

interface LinkData {
    source: string
    target: string
}

interface GraphSettings {
    nodeSize: number
    linkThickness: number
    centerForce: number
    repelForce: number
    linkDistance: number
    linkForce: number
    showArrows: boolean
    textFadeThreshold: number
}

const DEFAULT_SETTINGS: GraphSettings = {
    nodeSize: 4,
    linkThickness: 1,
    centerForce: 0.5,
    repelForce: 300,
    linkDistance: 100,
    linkForce: 0.5,
    showArrows: false,
    textFadeThreshold: 2.0
}

export function ObsidianGraphView({ 
    onNodeClick,
    onClose 
}: { 
    onNodeClick?: (path: string) => void
    onClose?: () => void
}) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    // Theme-aware colors
    const colors = useMemo(() => {
        if (isDark) {
            return {
                background: '#0a0a0a', // Matches --background: 0 0% 4%
                link: '#262626',       // Matches --border or muted
                nodeRoot: '#ffffff',
                nodeUnresolved: '#404040',
                nodeDefault: '#a3a3a3',
                text: '#f5f5f5',
                textOpacity: 'rgba(245, 245, 245, '
            }
        }
        return {
            background: '#ffffff',
            link: '#e5e5e5',
            nodeRoot: '#111827',
            nodeUnresolved: '#d1d5db',
            nodeDefault: '#4b5563',
            text: '#111827',
            textOpacity: 'rgba(17, 24, 39, '
        }
    }, [isDark])

    const [graphData, setGraphData] = useState<{ nodes: NodeData[], links: LinkData[] }>({ nodes: [], links: [] })
    const [isLoading, setIsLoading] = useState(true)
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const [settings, setSettings] = useState<GraphSettings>(DEFAULT_SETTINGS)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    
    const containerRef = useRef<HTMLDivElement>(null)
    const fgRef = useRef<any>(null)

    // Apply forces whenever dimensions or settings change
    useEffect(() => {
        if (!fgRef.current) return;
        
        const fg = fgRef.current;
        const centerX = 0;
        const centerY = 0;

        // 1. Center force: Pulls every atomic note to the center of the canvas
        fg.d3Force('x', d3.forceX(centerX).strength(settings.centerForce));
        fg.d3Force('y', d3.forceY(centerY).strength(settings.centerForce));
        
        // 2. Repel force: Pushes atomic notes from each other
        fg.d3Force('charge', d3.forceManyBody().strength(-settings.repelForce));
        
        // 3. Link force: Pulls atomic notes to other notes
        // 4. Link distance: The length of the lines
        fg.d3Force('link', d3.forceLink()
            .id((d: any) => d.id)
            .distance(settings.linkDistance)
            .strength(settings.linkForce));

        // 5. Collision prevention (Implicitly part of repel/proper feel)
        fg.d3Force('collide', d3.forceCollide().radius((node: any) => {
            return (node.val || 4) * (settings.nodeSize / 3) + 2;
        }));

        fg.d3AlphaTarget?.(0.1);
        setTimeout(() => fg.d3AlphaTarget?.(0), 500);
    }, [settings]);

    useEffect(() => {
        let mounted = true
        sidecarApi.getVaultGraph().then(data => {
            if (mounted) {
                const linkCounts: Record<string, number> = {}
                data.links.forEach((l: LinkData) => {
                    linkCounts[l.source] = (linkCounts[l.source] || 0) + 1
                    linkCounts[l.target] = (linkCounts[l.target] || 0) + 1
                })

                const processedNodes = data.nodes.map((n: NodeData) => {
                    const count = linkCounts[n.id] || 0;
                    // Obsidian uses a subtle scale. log(count + 1) or similar.
                    // Range: 1 to 3 effectively for the base value.
                    return {
                        ...n,
                        val: 1 + Math.log10(count + 1) * 2
                    }
                })
                
                setGraphData({ nodes: processedNodes, links: data.links })
                setIsLoading(false)
            }
        }).catch(err => {
            console.error('Failed to load graph:', err)
            setIsLoading(false)
        })
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        const updateDims = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                })
            }
        }
        updateDims()
        window.addEventListener('resize', updateDims)
        return () => window.removeEventListener('resize', updateDims)
    }, [])

    const handleNodeClick = useCallback((node: any) => {
        if (onNodeClick) {
            onNodeClick(node.id)
        }
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 0)
            fgRef.current.zoom(8, 0)
        }
    }, [onNodeClick])

    const getNodeColor = (group: string) => {
        if (group === "unresolved") return colors.nodeUnresolved
        if (group === "0-Bases" || group === "Database" || group === "root") return colors.nodeRoot
        return colors.nodeDefault
    }

    const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 0)
    const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 0)
    const handleCenter = () => { fgRef.current?.centerAt(0, 0, 0); fgRef.current?.zoom(1, 0) }

    const handleNodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const r = (node.val || 4) * (settings.nodeSize / 3); 
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = getNodeColor(node.group);
        ctx.fill();

        if (globalScale > settings.textFadeThreshold) {
            const label = node.name;
            const fontSize = Math.max(12 / globalScale, 2);
            ctx.font = `${fontSize}px Sans-Serif`;
            const opacity = Math.min(1, (globalScale - settings.textFadeThreshold) / 0.5);
            ctx.fillStyle = `${colors.textOpacity}${opacity})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y + r + fontSize / 2 + 1);
        }
    }

    return (
        <div ref={containerRef} className="w-full h-full relative bg-background overflow-hidden flex">
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground ">Initializing Neural Graph...</span>
                    </div>
                ) : (
                    <>
                        <ForceGraph2D
                            ref={fgRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            graphData={graphData}
                            nodeLabel="name"
                            nodeCanvasObject={handleNodeCanvasObject}
                            nodeCanvasObjectMode={() => 'replace'}
                            linkColor={() => colors.link}
                            linkWidth={settings.linkThickness}
                            linkDirectionalArrowLength={settings.showArrows ? 3 : 0}
                            linkDirectionalArrowRelPos={1}
                            onNodeClick={handleNodeClick}
                            backgroundColor={colors.background}
                            d3AlphaDecay={0.02}
                            d3VelocityDecay={0.3}
                            warmupTicks={100}
                            cooldownTicks={200}
                        />
                        
                        {/* Overlay Navigation Controls */}
                        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
                            <button onClick={handleCenter} className="p-2 bg-background border border-border rounded-none shadow-sm hover:bg-accent text-muted-foreground " title="Center Graph">
                                <Maximize size={16} />
                            </button>
                            <div className="flex flex-col bg-background border border-border rounded-none shadow-sm overflow-hidden">
                                <button onClick={handleZoomIn} className="p-2 hover:bg-accent text-muted-foreground border-b border-border " title="Zoom In">
                                    <ZoomIn size={16} />
                                </button>
                                <button onClick={handleZoomOut} className="p-2 hover:bg-accent text-muted-foreground " title="Zoom Out">
                                    <ZoomOut size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Settings Toggle */}
                        <button 
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="absolute top-6 right-6 p-2 bg-background border border-border rounded-none shadow-sm hover:bg-accent text-muted-foreground  z-20"
                        >
                            <Settings size={18} className={cn(isSettingsOpen && "text-foreground")} />
                        </button>
                    </>
                )}
            </div>

            {/* Settings Side Panel */}
            {isSettingsOpen && (
                <div className="absolute top-4 right-4 w-72 bg-background border border-border rounded-none shadow-2xl flex flex-col z-30 transition-none">
                    <div className="px-4 py-3 border-b border-border/10 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground/80">Graph settings</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="text-muted-foreground hover:text-foreground transition-none" title="Reset settings">
                                <RefreshCw size={14} />
                            </button>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-muted-foreground hover:text-foreground transition-none">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar flex flex-col gap-1">
                        {/* Accordion Style Sections */}
                        <SettingsSection title="Filters" isOpen={false} />
                        <SettingsSection title="Groups" isOpen={false} />
                        <SettingsSection title="Display" isOpen={false} />
                        
                        <div className="flex flex-col">
                            <button className="flex items-center gap-2 py-2 text-[11px] font-bold text-foreground/70 hover:text-foreground transition-none w-full text-left group">
                                <ChevronDown size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground" />
                                Forces
                            </button>
                            
                            <div className="pl-6 flex flex-col gap-6 py-4 border-l border-border/10 ml-1.5">
                                <ForceSlider 
                                    label="Center force" 
                                    value={settings.centerForce} 
                                    min={0} max={1} step={0.01}
                                    onChange={v => setSettings({...settings, centerForce: v})} 
                                />
                                <ForceSlider 
                                    label="Repel force" 
                                    value={settings.repelForce} 
                                    min={0} max={1000} step={10}
                                    onChange={v => setSettings({...settings, repelForce: v})} 
                                />
                                <ForceSlider 
                                    label="Link force" 
                                    value={settings.linkForce} 
                                    min={0} max={1} step={0.01}
                                    onChange={v => setSettings({...settings, linkForce: v})} 
                                />
                                <ForceSlider 
                                    label="Link distance" 
                                    value={settings.linkDistance} 
                                    min={30} max={500} step={5}
                                    onChange={v => setSettings({...settings, linkDistance: v})} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SettingsSection({ title, isOpen }: { title: string, isOpen: boolean }) {
    return (
        <button className="flex items-center gap-2 py-2 text-[11px] font-bold text-foreground/40 hover:text-foreground/60 transition-none w-full text-left">
            <ChevronRight size={14} className="text-muted-foreground/20" />
            {title}
        </button>
    )
}

function ForceSlider({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) {
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-foreground/60">{label}</label>
            </div>
            <div className="relative flex items-center group">
                <input 
                    type="range" 
                    min={min} max={max} step={step}
                    value={value} 
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-muted-foreground/10 rounded-none appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-none"
                />
            </div>
        </div>
    )
}
