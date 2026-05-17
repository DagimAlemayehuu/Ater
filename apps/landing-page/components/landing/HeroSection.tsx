"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { IndustrialButton } from '@/components/IndustrialButton';

export function HeroSection() {
  const [demoMessage, setDemoMessage] = React.useState("");

  const handleWatchDemo = () => {
    setDemoMessage("DEMO ON THE WAY");
    setTimeout(() => setDemoMessage(""), 3000);
  };

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#features") {
      const el = document.getElementById("features");
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <section className="relative md:sticky md:top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full overflow-hidden border-b border-outline-variant pt-16">
      <div className="industrial-container flex flex-col items-center justify-center gap-8 w-full py-12 md:py-20 flex-1">
        <div className="flex flex-col items-start justify-center gap-6 w-full">
          <motion.h1 
            className="text-display-hero border-b border-outline-variant pb-4 text-left w-full uppercase flex font-mono font-black"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {Array.from("EVER HATED STUDYING?").map((char, index) => (
              <motion.span 
                key={index}
                variants={{
                  hidden: { opacity: 0, filter: "blur(4px)" },
                  visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.4, ease: "easeOut" } }
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>
        </div>

        {/* Integrated Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl relative origin-center flex items-center justify-center"
        >
            <FullMacbookMockup />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col items-center justify-center gap-2 mt-4 w-full"
        >
          <IndustrialButton onClick={handleWatchDemo} className="w-full sm:w-auto h-14 px-12">
            WATCH DEMO
          </IndustrialButton>
          {demoMessage && (
            <span className="font-mono text-[10px] text-primary animate-pulse tracking-widest mt-2">
              {demoMessage}
            </span>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function FullMacbookMockup() {
  return (
    <div className="w-[75%] sm:w-[80%] md:w-[90%] max-w-[800px] flex flex-col items-center">
      {/* Lid / Screen */}
      <div 
        className="w-[85%] aspect-[2560/1664] bg-[#1A1A1A] border-x border-t border-white/10 relative flex flex-col shadow-[0_80px_160px_-30px_rgba(0,0,0,0.4)]"
        style={{ borderTopLeftRadius: '3%', borderTopRightRadius: '3%', padding: '0.4%' }}
      >
        <div 
          className="flex-1 bg-[#000] overflow-hidden relative flex flex-col"
          style={{ borderTopLeftRadius: '2.6%', borderTopRightRadius: '2.6%', padding: '1.2%' }}
        >
          {/* M2 Notch */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[4%] bg-[#000] z-30 flex items-center justify-center"
            style={{ borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' }}
          >
            <div className="w-[4%] aspect-square rounded-full bg-[#111] border border-white/10 flex items-center justify-center mt-0.5">
              <div className="w-[40%] aspect-square rounded-full bg-blue-500/40" />
            </div>
          </div>
          
          <div 
            className="flex-1 bg-[#131313] overflow-hidden relative shadow-inner"
            style={{ borderTopLeftRadius: '1.5%', borderTopRightRadius: '1.5%' }}
          >
            <Image 
              src="/dashboard.png" 
              alt="Ater Dashboard" 
              fill 
              className="object-cover object-top" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority
            />
            {/* Subtle Screen Glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-20" />
          </div>
        </div>
      </div>
      
      {/* Base / Keyboard Area */}
      <div 
        className="w-full aspect-[800/14] bg-[#1A1A1A] border-x border-b border-white/10 shadow-xl relative"
        style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}
      >
        {/* Thumb Indentation */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[40%] bg-black/40 shadow-inner" 
          style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}
        />
      </div>
    </div>
  );
}
