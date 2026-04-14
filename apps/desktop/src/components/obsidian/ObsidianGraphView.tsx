import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { sidecarApi } from '@/lib/sidecarApi'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'

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
    const containerRef = useRef<HTMLDivElement>(null)
    const fgRef = useRef<any>(null)

    useEffect(() => {
        let mounted = true
        sidecarApi.getVaultGraph().then(data => {
            if (mounted) {
                // Ensure nodes have links tracking for weighting
                const linkCounts: Record<string, number> = {}
                data.links.forEach(l => {
                    linkCounts[l.source] = (linkCounts[l.source] || 0) + 1
                    linkCounts[l.target] = (linkCounts[l.target] || 0) + 1
                })

                const processedNodes = data.nodes.map(n => ({
                    ...n,
                    val: Math.max(1, Math.min(10, (linkCounts[n.id] || 0) / 2)) // Scale log or linearly
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
        // Center at node
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000)
            fgRef.current.zoom(8, 2000)
        }
    }, [onNodeClick])

    // Minimalist monochrome aesthetic coloring
    const getColor = (group: string) => {
        if (group === "unresolved") return "#D1D5DB" // Light gray for ghosts
        if (group === "0-Bases" || group === "3-Database") return "#111827" // Darker for databases
        if (group === "root") return "#9CA3AF"
        return "#4B5563"
    }

    const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 400)
    const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 400)
    const handleCenter = () => { fgRef.current?.centerAt(0, 0, 400); fgRef.current?.zoom(1, 400) }

    const handleNodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        ctx.beginPath();
        const r = node.val || 4; 
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = getColor(node.group);
        ctx.fill();

        if (globalScale > 1.5) {
            const label = node.name;
            const fontSize = Math.max(12 / globalScale, 2);
            ctx.font = `${fontSize}px Sans-Serif`;
            const opacity = Math.min(1, (globalScale - 1.5) / 0.5);
            ctx.fillStyle = `rgba(17, 24, 39, ${opacity})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y + r + fontSize / 2 + 1);
        }
    }

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#F9FAFB] overflow-hidden">
            {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-[#9CA3AF]">Loading Graph...</span>
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
                        linkWidth={1}
                        onNodeClick={handleNodeClick}
                        backgroundColor="#F9FAFB"
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        warmupTicks={100}
                        cooldownTicks={200}
                    />
                    
                    {/* Overlay Controls */}
                    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
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
                </>
            )}
        </div>
    )
}
