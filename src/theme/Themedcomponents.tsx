/**
 * Themed UI primitives
 *
 * Every component here reads from useTheme() so they automatically
 * reflect the active accent color without any extra props.
 *
 * Usage:
 *   import { PrimaryButton, ThemedToggle, ThemedBadge, PageHeader } from "../theme/ThemedComponents";
 */

import { ArrowLeft } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useTheme } from "./ThemeContext";

/* ─────────────────────────────────────────
   PrimaryButton
   Replaces any button that previously used hard-coded bg-[#00a884]
───────────────────────────────────────── */
export const PrimaryButton = ({
  children,
  className = "",
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { tokens } = useTheme();
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{ background: tokens.accent, ...rest.style }}
      className={`flex items-center justify-center gap-2 rounded-xl text-white text-sm font-bold transition-opacity disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────
   ThemedToggle
───────────────────────────────────────── */
export const ThemedToggle = ({
  on,
  toggle,
}: {
  on: boolean;
  toggle: () => void;
}) => {
  const { tokens } = useTheme();
  return (
    <button
      onClick={toggle}
      style={{ background: on ? tokens.accent : undefined }}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${on ? "" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${on ? "translate-x-6" : ""}`}
      />
    </button>
  );
};

/* ─────────────────────────────────────────
   ThemedBadge  — e.g. "Active" chip
───────────────────────────────────────── */
export const ThemedBadge = ({ children }: { children: ReactNode }) => {
  const { tokens } = useTheme();
  return (
    <span
      style={{ background: tokens.accentLight, color: tokens.accent }}
      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
    >
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────
   ThemedDot  — small colored circle (color swatches, bullet list)
───────────────────────────────────────── */
export const ThemedDot = ({ size = 8 }: { size?: number }) => {
  const { tokens } = useTheme();
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: tokens.accent }}
    />
  );
};

/* ─────────────────────────────────────────
   ThemedSpinner  — Loader2 substitute
───────────────────────────────────────── */
export const ThemedSpinner = ({ size = 24 }: { size?: number }) => {
  const { tokens } = useTheme();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tokens.accent}
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
};

/* ─────────────────────────────────────────
   PageHeader  — top nav bar used on every sub-screen
   Props mirror what CrewView / DriversView need
───────────────────────────────────────── */
export const PageHeader = ({
  title,
  subtitle,
  onBack,
  right,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
}) => {
  const { tokens } = useTheme();
  return (
    <div className="text-white shrink-0" style={{ background: tokens.header }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex-1">
          <h1 className="font-bold text-[18px] tracking-tight">{title}</h1>
          {subtitle && <p className="text-[12px] text-white/65">{subtitle}</p>}
        </div>
        {right}
      </div>

      {searchValue !== undefined && onSearchChange && (
        <div className="px-4 pb-4">
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(0,0,0,0.15)" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-white/60 shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
            />
            {searchValue && (
              <button onClick={() => onSearchChange("")}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="text-white/60"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   ThemedLink  — underline text link
───────────────────────────────────────── */
export const ThemedLink = ({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) => {
  const { tokens } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{ color: tokens.accent }}
      className={`text-sm font-bold hover:underline ${className}`}
    >
      {children}
    </button>
  );
};

/* ─────────────────────────────────────────
   ThemedFocusInput
   Input whose focus ring uses the accent color
───────────────────────────────────────── */
export const ThemedFocusInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
}) => {
  const { tokens } = useTheme();
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={
        {
          "--focus-color": tokens.accent,
        } as React.CSSProperties
      }
      className={`w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent text-[15px] text-gray-900 placeholder-gray-400
        focus:outline-none focus:bg-white transition-all
        [&:focus]:border-[var(--focus-color)] [&:focus]:ring-2 [&:focus]:ring-[var(--focus-color)]/15 ${className}`}
    />
  );
};
