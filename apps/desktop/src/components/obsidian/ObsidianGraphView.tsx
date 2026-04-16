import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import * as d3 from 'd3-force'
import { sidecarApi } from '@/lib/sidecarApi'
import { ZoomIn, ZoomOut, Maximize, Settings, X, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    nodeSize: 3,
    linkThickness: 1,
    centerForce: 0.5,
    repelForce: 150,
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
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        // Custom Radial Force for the "Circle" effect requested
        // This pulls nodes towards a circle of a specific radius
        fg.d3Force('center', null); // Remove default center to avoid conflicts
        
        // Repel force
        fg.d3Force('charge').strength(-settings.repelForce);
        
        // Link dynamics
        fg.d3Force('link')
            .distance(settings.linkDistance)
            .strength(settings.linkForce);

        // Radial force to create that circular "cluster" look from the screenshot
        // We use a small radius to pull them towards the center, creating a dense circular core
        fg.d3Force('radial', d3.forceRadial(10, centerX, centerY).strength(settings.centerForce));
        
        // Re-heat simulation if forces change
        fg.d3AlphaTarget(0.3).restart();
        setTimeout(() => fg.d3AlphaTarget(0), 1000);
    }, [settings, dimensions.width, dimensions.height]);

    useEffect(() => {
        let mounted = true
        sidecarApi.getVaultGraph().then(data => {
            if (mounted) {
                const linkCounts: Record<string, number> = {}
                data.links.forEach(l => {
                    linkCounts[l.source] = (linkCounts[l.source] || 0) + 1
                    linkCounts[l.target] = (linkCounts[l.target] || 0) + 1
                })

                const processedNodes = data.nodes.map(n => ({
                    ...n,
                    val: Math.max(1, Math.min(10, (linkCounts[n.id] || 0) / 2))
                }))
                
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
            fgRef.current.centerAt(node.x, node.y, 1000)
            fgRef.current.zoom(8, 2000)
        }
    }, [onNodeClick])

    const getColor = (group: string) => {
        if (group === "unresolved") return "#D1D5DB"
        if (group === "0-Bases" || group === "3-Database") return "#111827"
        if (group === "root") return "#9CA3AF"
        return "#4B5563"
    }

    const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 400)
    const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 400)
    const handleCenter = () => { fgRef.current?.centerAt(0, 0, 400); fgRef.current?.zoom(1, 400) }

    const handleNodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const r = (node.val || 4) * (settings.nodeSize / 3); 
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = getColor(node.group);
        ctx.fill();

        if (globalScale > settings.textFadeThreshold) {
            const label = node.name;
            const fontSize = Math.max(12 / globalScale, 2);
            ctx.font = `${fontSize}px Sans-Serif`;
            const opacity = Math.min(1, (globalScale - settings.textFadeThreshold) / 0.5);
            ctx.fillStyle = `rgba(17, 24, 39, ${opacity})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y + r + fontSize / 2 + 1);
        }
    }

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#F9FAFB] overflow-hidden flex">
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs uppercase tracking-widest text-[#9CA3AF] animate-pulse">Initializing Neural Graph...</span>
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
                            linkColor={() => '#E5E5E5'}
                            linkWidth={settings.linkThickness}
                            linkDirectionalArrowLength={settings.showArrows ? 3 : 0}
                            linkDirectionalArrowRelPos={1}
                            onNodeClick={handleNodeClick}
                            backgroundColor="#F9FAFB"
                            d3AlphaDecay={0.02}
                            d3VelocityDecay={0.3}
                            warmupTicks={100}
                            cooldownTicks={200}
                        />
                        
                        {/* Overlay Navigation Controls */}
                        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
                            <button onClick={handleCenter} className="p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-600 transition-colors" title="Center Graph">
                                <Maximize size={16} />
                            </button>
                            <div className="flex flex-col bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                                <button onClick={handleZoomIn} className="p-2 hover:bg-gray-50 text-gray-600 border-b border-gray-200 transition-colors" title="Zoom In">
                                    <ZoomIn size={16} />
                                </button>
                                <button onClick={handleZoomOut} className="p-2 hover:bg-gray-50 text-gray-600 transition-colors" title="Zoom Out">
                                    <ZoomOut size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Settings Toggle */}
                        <button 
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="absolute top-6 right-6 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 text-gray-600 transition-colors z-20"
                        >
                            <Settings size={18} className={cn(isSettingsOpen && "rotate-90 transition-transform")} />
                        </button>
                    </>
                )}
            </div>

            {/* Settings Side Panel */}
            {isSettingsOpen && (
                <div className="w-72 bg-white border-l border-gray-200 h-full flex flex-col z-30 animate-in slide-in-from-right duration-300">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#111827]">Graph Settings</span>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-auto px-5 py-6 custom-scrollbar flex flex-col gap-8">
                        {/* Filters Section */}
                        <section className="flex flex-col gap-4 pb-4 border-b border-gray-100">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Filters</span>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-gray-600">Orphans</label>
                                <input 
                                    type="checkbox" 
                                    checked={true} // Fixed for now as per screenshot 3
                                    className="accent-[#111827]"
                                    readOnly
                                />
                            </div>
                        </section>

                        {/* Display Section */}
                        <section className="flex flex-col gap-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Display</span>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-gray-600">Arrows</label>
                                <input 
                                    type="checkbox" 
                                    checked={settings.showArrows} 
                                    onChange={e => setSettings({...settings, showArrows: e.target.checked})}
                                    className="accent-[#111827]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-bold text-gray-600">Node size</label>
                                    <span className="text-[10px] text-gray-400">{settings.nodeSize}</span>
                                </div>
                                <input 
                                    type="range" min="1" max="15" step="0.5"
                                    value={settings.nodeSize} 
                                    onChange={e => setSettings({...settings, nodeSize: parseFloat(e.target.value)})}
                                    className="accent-[#111827] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-bold text-gray-600">Link thickness</label>
                                    <span className="text-[10px] text-gray-400">{settings.linkThickness}</span>
                                </div>
                                <input 
                                    type="range" min="1" max="5" step="0.5"
                                    value={settings.linkThickness} 
                                    onChange={e => setSettings({...settings, linkThickness: parseFloat(e.target.value)})}
                                    className="accent-[#111827] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-bold text-gray-600">Text fade</label>
                                    <span className="text-[10px] text-gray-400">{settings.textFadeThreshold}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="5" step="0.1"
                                    value={settings.textFadeThreshold} 
                                    onChange={e => setSettings({...settings, textFadeThreshold: parseFloat(e.target.value)})}
                                    className="accent-[#111827] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </section>

                        {/* Forces Section */}
                        <section className="flex flex-col gap-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Forces</span>
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-bold text-gray-600">Center force</label>
                                    <span className="text-[10px] text-gray-400">{settings.centerForce}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.centerForce} 
                                    onChange={e => setSettings({...settings, centerForce: parseFloat(e.target.value)})}
                                    className="accent-[#111827] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-bold text-gray-600">Repel force</label>
                                    <span className="text-[10px] text-gray-400">{settings.repelForce}</span>
                                </div>
                                <input 
                                    type="range" min="50" max="1000" step="10"
                                    value={settings.repelForce} 
                                    onChange={e => setSettings({...settings, repelForce: parseInt(e.target.value)})}
                                    className="accent-[#111827] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-bold text-gray-600">Link force</label>
                                    <span className="text-[10px] text-gray-400">{settings.linkForce}</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="2" step="0.1"
                                    value={settings.linkForce} 
                                    onChange={e => setSettings({...settings, linkForce: parseFloat(e.target.value)})}
                                    className="accent-[#111827] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[11px] font-bold text-gray-600">Link distance</label>
                                    <span className="text-[10px] text-gray-400">{settings.linkDistance}</span>
                                </div>
                                <input 
                                    type="range" min="30" max="300" step="10"
                                    value={settings.linkDistance} 
                                    onChange={e => setSettings({...settings, linkDistance: parseInt(e.target.value)})}
                                    className="accent-[#111827] h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <button 
                                onClick={() => {
                                    fgRef.current.d3AlphaTarget(0.5).restart();
                                    setTimeout(() => fgRef.current.d3AlphaTarget(0), 1000);
                                }}
                                className="mt-4 flex items-center justify-center gap-2 py-2.5 bg-[#111827] text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                            >
                                <Play size={12} fill="currentColor" />
                                Re-Animate
                            </button>
                        </section>
                    </div>
                </div>
            )}
        </div>
    )
}

