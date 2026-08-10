"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getPreferenceSnapshot(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function getResolvedSnapshot(): ResolvedTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Minimal theme store backed by a `dark` class on <html> + localStorage, shared
 * across every useTheme() consumer via useSyncExternalStore (so the nav toggle
 * and the Settings selector never drift out of sync with each other). Deliberately
 * not using next-themes: its internal no-flash <script> render trips React 19's
 * "script tag inside a component" warning on this stack — the equivalent no-flash
 * inline script lives directly in the root layout's <head> instead (a Server
 * Component, so it never goes through that path). "system" is represented by the
 * *absence* of a stored preference, matching that init script's fallback to
 * prefers-color-scheme.
 */
export function useTheme() {
  const preference = useSyncExternalStore(subscribe, getPreferenceSnapshot, () => "system" as ThemePreference);
  const resolvedTheme = useSyncExternalStore(subscribe, getResolvedSnapshot, () => "light" as ResolvedTheme);
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const setTheme = useCallback((next: ThemePreference) => {
    const resolved: ResolvedTheme = next === "system" ? (systemPrefersDark() ? "dark" : "light") : next;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private browsing, etc.) — preference just won't persist.
    }
    for (const listener of listeners) listener();
  }, []);

  return { preference, resolvedTheme, setTheme, mounted };
}
