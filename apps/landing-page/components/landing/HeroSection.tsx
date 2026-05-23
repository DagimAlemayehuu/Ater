"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { IndustrialButton } from '@/components/IndustrialButton';

import { MacbookMockup } from '@/components/MacbookMockup';

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
    <section className="stack-section relative md:sticky md:top-0 z-10 bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full overflow-hidden border-b border-outline-variant pt-12 md:pt-16">
      <div className="industrial-container flex flex-col items-center justify-center gap-4 sm:gap-6 w-full py-6 md:py-8 flex-1">
        <div className="flex flex-col items-start justify-center gap-4 w-full">
          <motion.h1 
            className="text-display-hero border-b border-outline-variant pb-2 text-left w-full uppercase flex font-black"
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
            <MacbookMockup 
              lightSrc="/dashboard-light.png" 
              darkSrc="/dashboard-dark.png" 
              alt="Ater Dashboard"
              priority
            />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col items-center justify-center gap-2 mt-2 w-full"
        >
          <IndustrialButton onClick={handleWatchDemo} className="w-full sm:w-auto h-12 md:h-14 px-10 md:px-12">
            WATCH DEMO
          </IndustrialButton>
          {demoMessage && (
            <span className="text-[10px] text-primary animate-pulse tracking-widest mt-2">
              {demoMessage}
            </span>
          )}
        </motion.div>
      </div>
    </section>
  );
}

