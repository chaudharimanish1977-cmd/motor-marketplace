"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Top progress bar that animates during route changes — instant "did I
 * click?" feedback site-wide. Brand-orange, ~3px tall, soft glow.
 *
 * Implementation: intercepts `<a>`/`<Link>` clicks (same-origin nav) and
 * starts a trickle animation. Stops + completes when the pathname
 * changes (i.e. the navigation actually happened). A 7-second max
 * fallback timer fades the bar if a click doesn't result in a pathname
 * change (hash navigation, same-route query change, blocked nav, etc.).
 *
 * Zero external deps. We avoid `useSearchParams` here on purpose — it
 * triggers Next 15's Suspense-boundary requirement at the root, which
 * would force the entire layout to bail out of static rendering.
 */
export function TopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0); // 0..100
  const [visible, setVisible] = useState(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start the bar when a same-origin link is clicked.
  useEffect(() => {
    const start = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      setVisible(true);
      setProgress(8);
      if (trickleRef.current) clearInterval(trickleRef.current);
      trickleRef.current = setInterval(() => {
        setProgress((p) => {
          // Trickle toward 90 with diminishing increments — never reaches 100
          // until the navigation completes.
          if (p >= 90) return p;
          const remaining = 90 - p;
          return Math.min(90, p + Math.max(0.5, remaining * 0.06));
        });
      }, 180);
      // Safety: if 7s pass without a pathname change (hash nav, blocked
      // navigation, etc.), fade the bar out so it never gets stuck.
      maxTimerRef.current = setTimeout(() => {
        if (trickleRef.current) {
          clearInterval(trickleRef.current);
          trickleRef.current = null;
        }
        setVisible(false);
        setTimeout(() => setProgress(0), 300);
      }, 7000);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      // Skip downloads, external links, target=_blank, hash-only links.
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Same URL — no navigation, no bar.
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash === ""
        ) {
          return;
        }
      } catch {
        return;
      }
      start();
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true } as never);
    };
  }, []);

  // Complete the bar whenever the pathname changes.
  useEffect(() => {
    if (!visible) return;
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    setProgress(100);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setProgress(0), 300);
    }, 200);
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
    // We deliberately depend only on `pathname` so a navigation finishing
    // always advances the bar to 100. `visible` is read at the top to
    // skip work when the bar isn't active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Clean up timers on unmount.
  useEffect(() => {
    return () => {
      if (trickleRef.current) clearInterval(trickleRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: 3,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 280ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          backgroundColor: "#ff5a30",
          boxShadow: "0 0 8px #ff5a30, 0 0 4px #ff5a30",
          transition: "width 220ms ease-out",
        }}
      />
    </div>
  );
}
