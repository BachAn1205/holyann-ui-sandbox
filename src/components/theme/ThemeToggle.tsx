"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeOptional } from "@/contexts/ThemeContext";

type ThemeToggleVariant = "icon" | "full" | "dropdown";

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
  onToggle?: () => void;
  className?: string;
}

export function ThemeToggle({
  variant = "full",
  onToggle,
  className = "",
}: ThemeToggleProps) {
  const ctx = useThemeOptional();

  if (!ctx) {
    return null;
  }

  const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = ctx;

  const handleClick = () => {
    toggleTheme();
    onToggle?.();
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground opacity-50 ${className}`}
        aria-label="Chế độ hiển thị"
        disabled
      >
        <Monitor className="h-4 w-4" />
        {variant === "full" && <span>Hệ thống</span>}
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center justify-center rounded-full transition-colors ${className}`}
        title={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
        aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      >
        {isDark ? (
          <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors ${className}`}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 shrink-0" />
          {variant === "full" && "Chế độ sáng"}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0" />
          {variant === "full" && "Chế độ tối"}
        </>
      )}
    </button>
  );
}

export function ThemeSelector({
  onSelect,
  className = "",
}: {
  onSelect?: () => void;
  className?: string;
}) {
  const ctx = useThemeOptional();
  if (!ctx) return null;

  const { theme, setTheme, mounted } = ctx;

  const handleSelect = (t: "light" | "dark" | "system") => {
    setTheme(t);
    onSelect?.();
  };

  if (!mounted) return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => handleSelect("light")}
        className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted ${
          theme === "light" ? "bg-muted" : ""
        }`}
      >
        <Sun className="h-4 w-4" />
        Chế độ sáng
      </button>
      <button
        type="button"
        onClick={() => handleSelect("dark")}
        className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted ${
          theme === "dark" ? "bg-muted" : ""
        }`}
      >
        <Moon className="h-4 w-4" />
        Chế độ tối
      </button>
      <button
        type="button"
        onClick={() => handleSelect("system")}
        className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted ${
          theme === "system" ? "bg-muted" : ""
        }`}
      >
        <Monitor className="h-4 w-4" />
        Theo hệ thống
      </button>
    </div>
  );
}
