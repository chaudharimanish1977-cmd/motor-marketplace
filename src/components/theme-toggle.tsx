"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Draggable sun/moon mode pill — fixed-position by default, repositionable
 * by the customer if it overlaps content on a particular page.
 *
 * Interaction model (pointer events, so works for mouse + touch):
 *   · Pointer-down on the pill records the start position
 *   · If pointer moves < 5px before release → treated as a tap
 *     → toggle theme (light ↔ dark)
 *   · If pointer moves ≥ 5px → treated as a drag, position updates
 *     live; on release the new position is saved to localStorage
 *
 * Persisted state:
 *   · `ro-theme` — "light" | "dark"
 *   · `ro-theme-pos` — JSON { x, y } in viewport pixels from top-left.
 *     Absent on first visit → fall back to default fixed position
 *     (top-right desktop / bottom-right mobile). Once dragged, the
 *     pinned pixel position takes over and stays in place across
 *     reloads. Position is clamped to viewport bounds on render so a
 *     resized window can't strand the pill off-screen.
 *
 * Print + PDF render hidden via `?print=1` exit.
 */

const POSITION_KEY = "ro-theme-pos";
const DRAG_THRESHOLD_PX = 5;

interface PinnedPos {
  x: number;
  y: number;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [pinned, setPinned] = useState<PinnedPos | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPinX: number;
    startPinY: number;
    moved: boolean;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const searchParams = useSearchParams();
  const isPrintMode = searchParams?.get("print") === "1";

  // ── Initial mount: pick up theme + saved position ─────────────────
  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(initial);
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PinnedPos;
        if (
          typeof parsed.x === "number" &&
          typeof parsed.y === "number"
        ) {
          setPinned(clampToViewport(parsed));
        }
      }
    } catch {
      // ignore — private mode, malformed json, etc.
    }
  }, []);

  // ── Re-clamp pinned position on window resize ─────────────────────
  useEffect(() => {
    if (!pinned) return;
    const onResize = () => {
      setPinned((cur) => (cur ? clampToViewport(cur) : cur));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pinned]);

  // ── Pointer move/up listeners (attached to window during drag) ────
  useEffect(() => {
    if (!isDragging) return;

    function onMove(e: PointerEvent) {
      const state = dragStateRef.current;
      if (!state) return;
      const dx = e.clientX - state.startClientX;
      const dy = e.clientY - state.startClientY;
      if (
        !state.moved &&
        Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX
      ) {
        state.moved = true;
      }
      if (state.moved) {
        e.preventDefault();
        // pin position based on pointer delta from drag start.
        const nextX = state.startPinX + dx;
        const nextY = state.startPinY + dy;
        setPinned(clampToViewport({ x: nextX, y: nextY }));
      }
    }

    function onUp() {
      const state = dragStateRef.current;
      dragStateRef.current = null;
      setIsDragging(false);
      if (state?.moved) {
        // Persist final position. setPinned has already updated, but
        // the latest is in state via React; we read from the actual
        // DOM ref to ensure we save the latest.
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const final = clampToViewport({ x: rect.left, y: rect.top });
          try {
            localStorage.setItem(POSITION_KEY, JSON.stringify(final));
          } catch {
            // ignore
          }
        }
      } else {
        // Treat as click → toggle theme.
        toggleTheme();
      }
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  // ── Theme flip ────────────────────────────────────────────────────
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("ro-theme", next);
    } catch {
      // ignore — private mode etc.
    }
  }

  // ── onPointerDown: start a potential drag ─────────────────────────
  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    // Ignore non-primary buttons on mouse so right-click etc. still work.
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    dragStateRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPinX: rect.left,
      startPinY: rect.top,
      moved: false,
    };
    setIsDragging(true);
  }

  // Hydration safety + print exit.
  if (theme === null) return null;
  if (isPrintMode) return null;

  const isDark = theme === "dark";

  // Default position via Tailwind classes (fixed bottom-right mobile,
  // top-right desktop). Once the user has dragged, switch to inline
  // pixel positioning anchored at top-left.
  const defaultClasses =
    "fixed bottom-4 right-4 md:bottom-auto md:top-4 md:right-4";
  const isPinned = pinned !== null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onPointerDown={onPointerDown}
      aria-label={
        isDark
          ? "Switch to light mode (drag to reposition)"
          : "Switch to dark mode (drag to reposition)"
      }
      title={
        isDark
          ? "Switch to light mode — drag to move"
          : "Switch to dark mode — drag to move"
      }
      className={`${
        isPinned ? "fixed" : defaultClasses
      } z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-brand-charcoal/30 bg-brand-offwhite text-brand-charcoal font-mono text-[10.5px] font-bold tracking-[0.1em] uppercase hover:border-brand-charcoal/60 transition-colors print:hidden shadow-sm md:shadow-none touch-none select-none ${
        isDragging ? "cursor-grabbing opacity-90 scale-[1.03]" : "cursor-grab"
      }`}
      style={
        isPinned
          ? { left: `${pinned!.x}px`, top: `${pinned!.y}px`, right: "auto", bottom: "auto" }
          : undefined
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isDark ? "bg-brand-plum" : "bg-brand-charcoal"
        }`}
        aria-hidden
      />
      {isDark ? "DARK" : "LIGHT"} · {isDragging ? "MOVING" : "TAP"}
    </button>
  );
}

/** Keep the pill inside the viewport, leaving a 4px breathing margin
 *  so the rounded corners aren't visually cropped. Uses a sensible
 *  estimate for the pill's footprint (88×26) since we can't measure
 *  before render. */
function clampToViewport({ x, y }: PinnedPos): PinnedPos {
  const W = typeof window === "undefined" ? 1200 : window.innerWidth;
  const H = typeof window === "undefined" ? 800 : window.innerHeight;
  const pillW = 88;
  const pillH = 26;
  const margin = 4;
  const cx = Math.max(margin, Math.min(W - pillW - margin, x));
  const cy = Math.max(margin, Math.min(H - pillH - margin, y));
  return { x: cx, y: cy };
}
