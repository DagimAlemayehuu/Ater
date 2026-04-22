import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceRadial } from 'd3-force'
import { sidecarApi } from '@/lib/sidecarApi'
import { ZoomIn, ZoomOut, Maximize, Settings, X, Play, Target, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
    linkThickness: 1.5,
    centerForce: 0.6,
    repelForce: 200,
    linkDistance: 80,
    linkForce: 0.6,
    showArrows: false,
    textFadeThreshold: 3.0
}

export function ObsidianGraphView({ 
    onNodeClick,
    onClose 
}: { 
    onNodeClick?: (path: string) => void
    onClose?: () => void
}) {
    const [graphData, setGraphData] = useState<{ nodes: NodeData[], links: LinkData[] }>({ nodes: [], links: [] })
    const [isLoading, setIsLoading] = useState(true)
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
    const [settings, setSettings] = useState<GraphSettings>(DEFAULT_SETTINGS)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    
    const containerRef = useRef<HTMLDivElement>(null)
    const fgRef = useRef<any>(null)

    useEffect(() => {
        if (!fgRef.current) return;
        const fg = fgRef.current;
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        fg.d3Force('center', null);
        fg.d3Force('charge').strength(-settings.repelForce);
        fg.d3Force('link')
            .distance(settings.linkDistance)
            .strength(settings.linkForce);
        fg.d3Force('radial', forceRadial(20, centerX, centerY).strength(settings.centerForce));
        
        fg.d3AlphaTarget(0.3).restart();
        setTimeout(() => fg.d3AlphaTarget(0), 1000);
    }, [settings, dimensions.width, dimensions.height]);

    useEffect(() => {
        let mounted = true
        sidecarApi.getVaultGraph().then((data: { nodes: any[], links: any[] }) => {
            if (mounted) {
                const linkCounts: Record<string, number> = {}
                data.links.forEach((l: any) => {
                    linkCounts[l.source] = (linkCounts[l.source] || 0) + 1
                    linkCounts[l.target] = (linkCounts[l.target] || 0) + 1
                })

                const processedNodes = data.nodes.map((n: any) => ({
                    ...n,
                    val: Math.max(1, Math.min(10, (linkCounts[n.id] || 0) / 1.5))
                }))
                
                setGraphData({ nodes: processedNodes, links: data.links })
                setIsLoading(false)
            }
        }).catch((err: Error) => {
            console.error('Failed to load graph:', err)
            setIsLoading(false)
        })
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        const updateDims = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight })
        }
        window.addEventListener('resize', updateDims)
        return () => window.removeEventListener('resize', updateDims)
    }, [])

    const handleNodeClick = useCallback((node: any) => {
        if (onNodeClick) {
            onNodeClick(node.id)
        }
    }, [onNodeClick])

    const getColor = (group: string) => {
        if (group === "unresolved") return "rgba(209, 213, 235, 0.4)"
        if (group === "0-Bases" || group === "3-Database") return "#111827"
        if (group === "root") return "#9CA3AF"
        return "#4B5563"
    }

    const handleNodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const r = (node.val || 4) * (settings.nodeSize / 4); 
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = getColor(node.group);
        ctx.fill();

        if (globalScale > settings.textFadeThreshold) {
            const label = node.name;
            const fontSize = Math.max(10 / globalScale, 3);
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            const opacity = Math.min(1, (globalScale - settings.textFadeThreshold) / 1);
            ctx.fillStyle = `rgba(17, 24, 39, ${opacity})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y + r + fontSize / 1.5 + 1);
        }
    }

    return (
        <div ref={containerRef} className="fixed inset-0 z-[100] bg-background animate-in fade-in duration-500 overflow-hidden flex flex-col">
            <div className="h-20 border-b border-border/50 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl shrink-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Neural_Graph</span>
                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{graphData.nodes.length} Connected Clusters</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl h-12 w-12 bg-muted/20">
                    <X size={24} />
                </Button>
            </div>

            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <RefreshCw className="animate-spin text-primary/20" size={40} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Synthesizing Topology...</span>
                    </div>
                ) : (
                    <>
                        <ForceGraph2D
                            ref={fgRef}
                            width={dimensions.width}
                            height={dimensions.height - 80}
                            graphData={graphData}
                            nodeLabel="name"
                            nodeCanvasObject={handleNodeCanvasObject}
                            nodeCanvasObjectMode={() => 'replace'}
                            linkColor={() => 'rgba(229, 231, 235, 0.4)'}
                            linkWidth={settings.linkThickness}
                            onNodeClick={handleNodeClick}
                            backgroundColor="transparent"
                            d3AlphaDecay={0.03}
                            d3VelocityDecay={0.4}
                        />
                        
                        {/* Overlay Navigation Controls */}
                        <div className="absolute bottom-10 left-6 flex flex-col gap-4 z-10">
                            <button 
                                onClick={() => { fgRef.current?.centerAt(0, 0, 800); fgRef.current?.zoom(1.5, 800) }} 
                                className="w-14 h-14 bg-background/80 backdrop-blur-md border border-border rounded-2xl shadow-xl flex items-center justify-center text-primary active:scale-90 transition-all"
                            >
                                <Target size={24} />
                            </button>
                            <div className="flex flex-col bg-background/80 backdrop-blur-md border border-border rounded-2xl shadow-xl overflow-hidden">
                                <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 400)} className="w-14 h-14 flex items-center justify-center text-primary active:bg-muted transition-colors border-b border-border">
                                    <ZoomIn size={24} />
                                </button>
                                <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 400)} className="w-14 h-14 flex items-center justify-center text-primary active:bg-muted transition-colors">
                                    <ZoomOut size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Settings Trigger */}
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="absolute bottom-10 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all"
                        >
                            <Settings size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Settings Mobile Overlay */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 flex items-end">
                    <div className="w-full bg-background rounded-t-[3rem] p-10 pb-16 space-y-10 animate-in slide-in-from-bottom-full duration-500 shadow-2xl border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Simulation_Parameters</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center"><X size={18} /></button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Repel_Force</label>
                                    <span className="text-[10px] font-bold tabular-nums">{settings.repelForce}</span>
                                </div>
                                <input 
                                    type="range" min="50" max="1000" step="10"
                                    value={settings.repelForce} 
                                    onChange={e => setSettings({...settings, repelForce: parseInt(e.target.value)})}
                                    className="w-full accent-primary"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Link_Distance</label>
                                    <span className="text-[10px] font-bold tabular-nums">{settings.linkDistance}</span>
                                </div>
                                <input 
                                    type="range" min="30" max="300" step="10"
                                    value={settings.linkDistance} 
                                    onChange={e => setSettings({...settings, linkDistance: parseInt(e.target.value)})}
                                    className="w-full accent-primary"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                fgRef.current.d3AlphaTarget(0.5).restart();
                                setTimeout(() => fgRef.current.d3AlphaTarget(0), 1000);
                                setIsSettingsOpen(false);
                            }}
                            className="w-full py-8 bg-primary text-primary-foreground rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                        >
                            <Play size={16} fill="currentColor" /> Re-Animate Neural Flow
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
