"use client";

import { useState, useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const themeToApply = savedTheme || systemPreference;

    setTheme(themeToApply);
    document.documentElement.setAttribute("data-theme", themeToApply);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div>
      <header className="p-4">
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded bg-primary text-white"
        >
          Toggle Theme
        </button>
      </header>
      {children}
    </div>
  );
}
