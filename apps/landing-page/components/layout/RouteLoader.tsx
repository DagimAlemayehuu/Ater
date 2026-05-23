"use client";

import React, { useEffect, useState } from "react";
import { useLoading } from "@/context/LoadingContext";

export function RouteLoader() {
  const { isLoading } = useLoading();
  const [shouldRender, setShouldRender] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Wait for fade-out animation to complete
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div
      className={`route-loader-overlay ${
        isLoading ? "animate-loader-fade-in" : "animate-loader-fade-out"
      }`}
      aria-hidden="true"
    >
      <div className="text-2xl md:text-3xl font-black tracking-tighter text-on-background uppercase font-inter select-none">
        ATER <span className="text-on-surface-variant font-bold normal-case opacity-40">አጠር</span>
      </div>
    </div>
  );
}
