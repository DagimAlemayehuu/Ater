"use client";

import React from "react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

interface MacbookMockupProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  priority?: boolean;
}

/**
 * A full MacBook Mockup with a keyboard base and support for theme cross-fading.
 */
export function MacbookMockup({
  lightSrc,
  darkSrc,
  alt,
  priority = false,
}: MacbookMockupProps) {
  const { theme } = useTheme();

  return (
    <div className="w-full max-w-[min(650px,75vw,48vh)] flex flex-col items-center">
      {/* Lid / Screen */}
      <div
        className="w-[85%] aspect-[2560/1664] bg-[#1A1A1A] border-x border-t border-white/10 relative flex flex-col shadow-[0_80px_160px_-30px_rgba(0,0,0,0.4)]"
        style={{ borderTopLeftRadius: "3%", borderTopRightRadius: "3%", padding: "0.4%" }}
      >
        <div
          className="flex-1 bg-[#000] overflow-hidden relative flex flex-col"
          style={{ borderTopLeftRadius: "2.6%", borderTopRightRadius: "2.6%", padding: "1.2%" }}
        >
          {/* M2 Notch */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[4%] bg-[#000] z-30 flex items-center justify-center pointer-events-none"
            style={{ borderBottomLeftRadius: "6px", borderBottomRightRadius: "6px" }}
          >
            <div className="w-[4%] aspect-square rounded-full bg-[#111] border border-white/10 flex items-center justify-center mt-0.5">
              <div className="w-[40%] aspect-square rounded-full bg-blue-500/40" />
            </div>
          </div>

          <div
            className="flex-1 bg-[#131313] overflow-hidden relative shadow-inner"
            style={{ borderTopLeftRadius: "1.5%", borderTopRightRadius: "1.5%" }}
          >
            {/* Light Mode Screenshot */}
            <div
              className="absolute inset-0 transition-opacity duration-500 ease-in-out"
              style={{
                opacity: theme === "light" ? 1 : 0,
                zIndex: theme === "light" ? 10 : 0,
              }}
            >
              <Image
                src={lightSrc}
                alt={`${alt} (Light Mode)`}
                fill
                unoptimized
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority={priority}
              />
            </div>

            {/* Dark Mode Screenshot */}
            <div
              className="absolute inset-0 transition-opacity duration-500 ease-in-out"
              style={{
                opacity: theme === "dark" ? 1 : 0,
                zIndex: theme === "dark" ? 10 : 0,
              }}
            >
              <Image
                src={darkSrc}
                alt={`${alt} (Dark Mode)`}
                fill
                unoptimized
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority={priority}
              />
            </div>

            {/* Subtle Screen Glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-20" />
          </div>
        </div>
      </div>

      {/* Base / Keyboard Area */}
      <div
        className="w-full aspect-[800/14] bg-[#1A1A1A] border-x border-b border-white/10 shadow-xl relative"
        style={{ borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}
      >
        {/* Thumb Indentation */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[40%] bg-black/40 shadow-inner"
          style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}
        />
      </div>
    </div>
  );
}

/**
 * Just the MacBook Screen Lid component, designed to scale bottom-aligned (proportional split hero).
 */
export function MacbookLidMockup({
  lightSrc,
  darkSrc,
  alt,
  priority = false,
}: MacbookMockupProps) {
  const { theme } = useTheme();

  return (
    <div
      className="w-full h-full bg-[#1A1A1A] border-x border-t border-white/10 relative flex flex-col shadow-[0_80px_160px_-30px_rgba(0,0,0,0.4),0_40px_80px_-20px_rgba(0,0,0,0.3)]"
      style={{ borderTopLeftRadius: "3%", borderTopRightRadius: "3%", padding: "0.4%" }}
    >
      <div
        className="flex-1 bg-[#000] overflow-hidden relative flex flex-col"
        style={{ borderTopLeftRadius: "2.6%", borderTopRightRadius: "2.6%", padding: "1.2%" }}
      >
        {/* M2 Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[4%] bg-[#000] z-30 flex items-center justify-center pointer-events-none"
          style={{ borderBottomLeftRadius: "6px", borderBottomRightRadius: "6px" }}
        >
          <div className="w-[4%] aspect-square rounded-full bg-[#111] border border-white/10 flex items-center justify-center mt-0.5">
            <div className="w-[40%] aspect-square rounded-full bg-blue-500/40" />
          </div>
        </div>

        <div
          className="flex-1 bg-[#131313] overflow-hidden relative shadow-inner"
          style={{ borderTopLeftRadius: "1.5%", borderTopRightRadius: "1.5%" }}
        >
          {/* Light Mode Screenshot */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-in-out"
            style={{
              opacity: theme === "light" ? 1 : 0,
              zIndex: theme === "light" ? 10 : 0,
            }}
          >
            <Image
              src={lightSrc}
              alt={`${alt} (Light Mode)`}
              fill
              unoptimized
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority={priority}
            />
          </div>

          {/* Dark Mode Screenshot */}
          <div
            className="absolute inset-0 transition-opacity duration-500 ease-in-out"
            style={{
              opacity: theme === "dark" ? 1 : 0,
              zIndex: theme === "dark" ? 10 : 0,
            }}
          >
            <Image
              src={darkSrc}
              alt={`${alt} (Dark Mode)`}
              fill
              unoptimized
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority={priority}
            />
          </div>

          {/* Subtle Screen Glare */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-20" />
        </div>
      </div>
    </div>
  );
}
