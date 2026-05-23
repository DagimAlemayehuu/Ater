"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const transitionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("theme") as Theme;
      const nextTheme = savedTheme || "dark";
      setTheme(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    document.documentElement.classList.add("theme-switching");

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    transitionTimeoutRef.current = setTimeout(() => {
      document.documentElement.classList.remove("theme-switching");
      transitionTimeoutRef.current = null;
    }, 500);
  };


  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
