import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts'
import { cn } from '@/lib/utils'
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Settings2 } from 'lucide-react'

interface ChartViewProps {
    rows: any[]
    schema: Record<string, any>
}

const COLORS = ['#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

export function ChartView({ rows, schema }: ChartViewProps) {
    const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
    const [xProp, setXProp] = useState<string>(() => Object.keys(schema).find(k => schema[k] === 'select' || k.toLowerCase() === 'status') || 'title');
    const [yProp, setYProp] = useState<string>('count');

    const data = useMemo(() => {
        if (yProp === 'count') {
            const counts: Record<string, number> = {};
            rows.forEach(r => {
                const val = String(r.properties[xProp] || 'Untitled');
                counts[val] = (counts[val] || 0) + 1;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        } else {
            // Group by X, Sum Y
            const groups: Record<string, number> = {};
            rows.forEach(r => {
                const xVal = String(r.properties[xProp] || 'Untitled');
                const yVal = Number(r.properties[yProp] || 0);
                groups[xVal] = (groups[xVal] || 0) + yVal;
            });
            return Object.entries(groups).map(([name, value]) => ({ name, value }));
        }
    }, [rows, xProp, yProp]);

    if (rows.length === 0) {
        return <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-gray-400">No data for chart</div>
    }

    const numberProps = Object.keys(schema).filter(k => schema[k] === 'number' || schema[k] === 'int' || schema[k] === 'float');

    return (
        <div className="h-full w-full bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
            {/* Chart Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white rounded-md border border-gray-200 p-0.5 shadow-sm">
                        <button onClick={() => setChartType('bar')} className={cn("p-1.5 rounded", chartType === 'bar' ? "bg-gray-100 text-[#111827]" : "text-gray-400 hover:text-gray-600")}><BarChart3 size={14} /></button>
                        <button onClick={() => setChartType('line')} className={cn("p-1.5 rounded", chartType === 'line' ? "bg-gray-100 text-[#111827]" : "text-gray-400 hover:text-gray-600")}><LineIcon size={14} /></button>
                        <button onClick={() => setChartType('pie')} className={cn("p-1.5 rounded", chartType === 'pie' ? "bg-gray-100 text-[#111827]" : "text-gray-400 hover:text-gray-600")}><PieIcon size={14} /></button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-gray-400">Axis</span>
                        <select 
                            value={xProp} 
                            onChange={(e) => setXProp(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold focus:ring-0 outline-none"
                        >
                            {['title', ...Object.keys(schema)].map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <span className="text-[9px] font-black uppercase text-gray-400">Value</span>
                        <select 
                            value={yProp} 
                            onChange={(e) => setYProp(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold focus:ring-0 outline-none"
                        >
                            <option value="count">Count (rows)</option>
                            {numberProps.map(k => <option key={k} value={k}>Sum of {k}</option>)}
                        </select>
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#111827]">
                    Analysis Dashboard
                </div>
            </div>

            <div className="flex-1 w-full p-8 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    ) : chartType === 'line' ? (
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                            <Line type="monotone" dataKey="value" stroke="#111827" strokeWidth={3} dot={{ fill: '#111827', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    ) : (
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    )
}
