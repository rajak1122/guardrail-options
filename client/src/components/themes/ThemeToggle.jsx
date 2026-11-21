import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../../context/ThemeProvider.jsx";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 transition hover:border-emerald-500/40 hover:text-emerald-400"
    >
      {isDark ? (
        <FiSun className="h-4 w-4" />
      ) : (
        <FiMoon className="h-4 w-4" />
      )}
    </button>
  );
}