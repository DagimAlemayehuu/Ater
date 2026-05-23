"use client";

import React, { useState, useEffect } from 'react';

export function TerminalAnimation() {
  const [linesVisible, setLinesVisible] = useState(0);
  
  useEffect(() => {
    const timeouts = [
      setTimeout(() => setLinesVisible(1), 500),
      setTimeout(() => setLinesVisible(2), 1500),
      setTimeout(() => setLinesVisible(3), 2200),
      setTimeout(() => setLinesVisible(4), 2800),
      setTimeout(() => setLinesVisible(5), 3500),
    ];
    
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="p-6 border border-outline-variant bg-surface text-[11px] leading-relaxed text-on-surface-variant relative overflow-hidden shadow-xl max-w-md w-full mx-auto">
      <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-3">
        <span className="text-primary font-bold">Study Assistant</span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-outline-variant/40" />
          <div className="w-2 h-2 rounded-full bg-outline-variant/40" />
          <div className="w-2 h-2 rounded-full bg-outline-variant/40" />
        </div>
      </div>
      <div className="space-y-2 h-[120px]">
        {linesVisible >= 1 && (
          <p className="text-primary font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
            Found new file: Algorithms Intro
          </p>
        )}
        {linesVisible >= 2 && (
          <p className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            Analyzing content... Briefing ready
          </p>
        )}
        {linesVisible >= 3 && (
          <p className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            Mapped 14 key concepts
          </p>
        )}
        {linesVisible >= 4 && (
          <p className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            Creating note: Algorithm Complexity
          </p>
        )}
        {linesVisible >= 5 && (
          <p className="text-primary font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
            Saved to your study folder<span className="animate-pulse">.</span>
          </p>
        )}
      </div>
    </div>
  );
}