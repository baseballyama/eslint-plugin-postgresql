/**
 * Theme controller. Persists the user's choice in localStorage and reflects
 * it on `<html data-theme="…">`. The corresponding CSS in `app.css` reads
 * that attribute (plus `prefers-color-scheme` for the `auto` fallback).
 */
import { browser } from "$app/environment";

export type Theme = "auto" | "light" | "dark";

const STORAGE_KEY = "theme";

const apply = (theme: Theme): void => {
  if (!browser) return;
  document.documentElement.setAttribute("data-theme", theme);
};

const read = (): Theme => {
  if (!browser) return "auto";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" || raw === "auto" ? raw : "auto";
};

const write = (theme: Theme): void => {
  if (!browser) return;
  localStorage.setItem(STORAGE_KEY, theme);
};

export const createThemeStore = () => {
  let value = $state<Theme>(read());

  $effect(() => {
    apply(value);
    write(value);
  });

  return {
    get value() {
      return value;
    },
    set(next: Theme) {
      value = next;
    },
    cycle() {
      // auto → light → dark → auto
      value = value === "auto" ? "light" : value === "light" ? "dark" : "auto";
    },
  };
};
