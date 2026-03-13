/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
export type ThemeColor = "teal" | "blue" | "purple" | "amber" | "rose";

export interface ThemeTokens {
  accent: string; // primary buttons, toggles, active states
  accentLight: string; // subtle backgrounds, badges, chips
  header: string; // page headers / nav bars
  headerDark: string; // gradient end / darker header variant
}

export const THEME_COLORS: Record<ThemeColor, ThemeTokens> = {
  teal: {
    accent: "#00a884",
    accentLight: "#e8faf4",
    header: "#008069",
    headerDark: "#005c4b",
  },
  blue: {
    accent: "#0284c7",
    accentLight: "#e0f2fe",
    header: "#0369a1",
    headerDark: "#075985",
  },
  purple: {
    accent: "#7c3aed",
    accentLight: "#ede9fe",
    header: "#6d28d9",
    headerDark: "#4c1d95",
  },
  amber: {
    accent: "#d97706",
    accentLight: "#fef3c7",
    header: "#b45309",
    headerDark: "#92400e",
  },
  rose: {
    accent: "#e11d48",
    accentLight: "#ffe4e6",
    header: "#be123c",
    headerDark: "#9f1239",
  },
};

export const THEME_OPTIONS: { key: ThemeColor; label: string }[] = [
  { key: "teal", label: "Teal (Default)" },
  { key: "blue", label: "Ocean Blue" },
  { key: "purple", label: "Violet" },
  { key: "amber", label: "Amber" },
  { key: "rose", label: "Rose" },
];

/* ─────────────────────────────────────────
   Storage keys
───────────────────────────────────────── */
const LS_THEME_COLOR = "app:themeColor";
const LS_DARK_MODE = "app:darkMode";

/* ─────────────────────────────────────────
   CSS variable injection
   Sets --theme-accent, --theme-accent-light,
         --theme-header, --theme-header-dark
   on :root so any CSS / inline style can use them.
───────────────────────────────────────── */
function injectCSSVars(tokens: ThemeTokens, dark: boolean) {
  const root = document.documentElement;
  root.style.setProperty("--theme-accent", tokens.accent);
  root.style.setProperty("--theme-accent-light", tokens.accentLight);
  root.style.setProperty("--theme-header", tokens.header);
  root.style.setProperty("--theme-header-dark", tokens.headerDark);
  root.classList.toggle("dark", dark);
}

/* ─────────────────────────────────────────
   Context
───────────────────────────────────────── */
interface ThemeContextValue {
  color: ThemeColor;
  tokens: ThemeTokens;
  darkMode: boolean;
  setColor: (c: ThemeColor) => void;
  setDark: (v: boolean) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ─────────────────────────────────────────
   Provider — wrap your app root with this
───────────────────────────────────────── */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>(() => {
    const stored = localStorage.getItem(LS_THEME_COLOR) as ThemeColor | null;
    return stored && stored in THEME_COLORS ? stored : "teal";
  });

  const [darkMode, setDarkState] = useState<boolean>(() => {
    return localStorage.getItem(LS_DARK_MODE) === "true";
  });

  const tokens = THEME_COLORS[color];

  // Sync CSS vars + dark class whenever either setting changes
  useEffect(() => {
    injectCSSVars(tokens, darkMode);
  }, [tokens, darkMode]);

  const setColor = (c: ThemeColor) => {
    localStorage.setItem(LS_THEME_COLOR, c);
    setColorState(c);
  };

  const setDark = (v: boolean) => {
    localStorage.setItem(LS_DARK_MODE, String(v));
    setDarkState(v);
  };

  const toggleDark = () => setDark(!darkMode);

  return (
    <ThemeContext.Provider
      value={{ color, tokens, darkMode, setColor, setDark, toggleDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* ─────────────────────────────────────────
   Hook — use anywhere in the component tree
───────────────────────────────────────── */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
