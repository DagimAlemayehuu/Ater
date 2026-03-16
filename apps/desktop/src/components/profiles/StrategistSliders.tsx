import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { CustomSliderConfig } from '@/lib/config-types';
import {
    type SliderConfig,
    type SliderValues,
    STRATEGIST_SLIDERS,
    CREATOR_SLIDERS
} from '@/lib/slider-configs';

interface StrategistSlidersProps {
    value: string; // JSON string of slider values
    onChange: (newValue: string) => void;
    type?: 'strategist' | 'creator' | 'custom';
    customConfig?: CustomSliderConfig[];
}

const StrategistSliders: React.FC<StrategistSlidersProps> = ({
    value,
    onChange,
    type = 'strategist',
    customConfig
}) => {
    const activeSliders = type === 'custom' && customConfig
        ? customConfig
        : type === 'creator'
            ? CREATOR_SLIDERS
            : STRATEGIST_SLIDERS;

    const [sliders, setSliders] = useState<SliderValues>(() => {
        try {
            const parsed = JSON.parse(value || '{}');
            const defaults: SliderValues = {};
            activeSliders.forEach(s => {
                defaults[s.id] = parsed[s.id] !== undefined ? Number(parsed[s.id]) : s.default;
            });
            return defaults;
        } catch {
            const defaults: SliderValues = {};
            activeSliders.forEach(s => { defaults[s.id] = s.default; });
            return defaults;
        }
    });

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSyncedValue = useRef<string>(value);

    const handleChange = useCallback((id: string, val: number) => {
        setSliders(prev => {
            const next = { ...prev, [id]: val };
            const nextJson = JSON.stringify(next);
            lastSyncedValue.current = nextJson;
            
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onChange(nextJson);
            }, 400);
            return next;
        });
    }, [onChange]);

    // Sync from external changes
    useEffect(() => {
        if (value === lastSyncedValue.current) return;
        lastSyncedValue.current = value;

        try {
            const parsed = JSON.parse(value || '{}');
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSliders(prev => {
                const updated = { ...prev };
                let changed = false;
                activeSliders.forEach(s => {
                    const parsedVal = parsed[s.id];
                    if (parsedVal !== undefined && Number(parsedVal) !== prev[s.id]) {
                        updated[s.id] = Number(parsedVal);
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
        } catch { /* ignore */ }
    }, [value, activeSliders]);

    const getSliderColor = (val: number, max: number) => {
        const ratio = val / max;
        if (ratio <= 0.3) return 'bg-blue-500';
        if (ratio <= 0.6) return 'bg-primary';
        if (ratio <= 0.8) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-1 animate-in fade-in duration-300">
            {activeSliders.map((slider) => {
                const val = sliders[slider.id] ?? slider.default;
                const percentage = ((val - slider.min) / (slider.max - slider.min)) * 100;

                return (
                    <div
                        key={slider.id}
                        className="group p-4 rounded-lg hover:bg-muted/30 transition-all font-sans"
                    >
                        <div className="flex items-baseline justify-between mb-1">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-foreground tracking-tight">{slider.label}</span>
                                <span className="text-[10px] text-muted-foreground/80 font-medium">{slider.description}</span>
                            </div>
                            <span className="text-xs font-black text-primary tabular-nums bg-primary/10 px-1.5 py-0.5 rounded italic">
                                {val}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter w-16 text-right shrink-0">
                                {slider.leftLabel}
                            </span>

                            <div className="flex-1 relative h-6 flex items-center">
                                {/* Track background */}
                                <div className="absolute inset-x-0 h-[3px] bg-muted/50 rounded-full" />
                                {/* Active track */}
                                <div
                                    className={cn("absolute left-0 h-[3px] rounded-full transition-all duration-150", getSliderColor(val, slider.max))}
                                    style={{ width: `${percentage}%` }}
                                />
                                {/* Tick marks */}
                                <div className="absolute inset-x-0 flex justify-between px-0 pointer-events-none">
                                    {Array.from({ length: slider.max - slider.min + 1 }, (_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-[1px] h-1.5 transition-colors",
                                                i + slider.min <= val ? "bg-foreground/20" : "bg-muted-foreground/10"
                                            )}
                                        />
                                    ))}
                                </div>
                                {/* Input */}
                                <input
                                    type="range"
                                    min={slider.min}
                                    max={slider.max}
                                    value={val}
                                    onChange={(e) => handleChange(slider.id, parseInt(e.target.value))}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                />
                                {/* Thumb */}
                                <div
                                    className="absolute w-4 h-4 rounded-full bg-background border-[2.5px] border-primary shadow-[0_2px_4px_rgba(0,0,0,0.2)] pointer-events-none transition-all duration-150 group-hover:scale-110 z-20"
                                    style={{
                                        left: `calc(${percentage}% - 8px)`,
                                        boxShadow: `0 0 10px ${percentage > 50 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                                    }}
                                />
                            </div>

                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter w-16 shrink-0">
                                {slider.rightLabel}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-3 bg-primary rounded-full" />
                    <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Profile Architecture</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    {generatePersonalitySummary(sliders, type, activeSliders)}
                </p>
            </div>
        </div>
    );
};

function generatePersonalitySummary(sliders: SliderValues, type: string, config: SliderConfig[]): string {
    const parts: string[] = [];

    if (type === 'creator') {
        const innovation = sliders.innovation ?? 8;
        const collaboration = sliders.collaboration ?? 7;
        const polish = sliders.polish ?? 5;

        if (innovation >= 8) parts.push('Radically innovative');
        else if (innovation >= 5) parts.push('Creative but practical');
        else parts.push('Conservative and traditional');

        if (collaboration >= 8) parts.push('active co-creator');
        else if (collaboration >= 5) parts.push('collaborative help');
        else parts.push('obedient assistant');

        if (polish >= 7) parts.push('production-ready output');
        else if (polish >= 4) parts.push('refined draft output');
        else parts.push('raw concept output');
    } else if (type === 'strategist') {
        const directness = sliders.directness ?? 7;
        const brutality = sliders.brutality ?? 5;
        const proactiveness = sliders.proactiveness ?? 7;

        if (directness >= 8) parts.push('Unfiltered communicator');
        else if (directness >= 5) parts.push('Clear and direct');
        else parts.push('Gentle and diplomatic');

        if (brutality >= 8) parts.push('zero-tolerance focus');
        else if (brutality >= 5) parts.push('firm accountability');
        else parts.push('compassionate mentoring');

        if (proactiveness >= 8) parts.push('aggressive driver');
        else if (proactiveness >= 5) parts.push('regularly suggesting next steps');
        else parts.push('passive assistance');
    } else {
        // Generic summary for custom personas based on values
        const avg = Object.values(sliders).reduce((a, b) => a + b, 0) / config.length;
        if (avg >= 7.5) parts.push('Intense/Extreme calibration');
        else if (avg >= 4) parts.push('Balanced/Modular calibration');
        else parts.push('Reserved/Minimal calibration');

        parts.push(`custom tuned across ${config.length} parameters`);
    }

    return parts.length > 0 ? parts.join(' · ') + '.' : 'Standard configuration.';
}

export default StrategistSliders;
