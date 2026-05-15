"use client";

import Link, { useLinkStatus } from "next/link";
import type { LinkProps } from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * Per-link loading feedback using Next.js 15's built-in `useLinkStatus`.
 * Drop-in replacement for `<Link>` — same API. While the navigation is
 * pending, a small orange spinner overlays the link (positioned via
 * `spinnerPosition` so it doesn't interfere with the link's normal
 * layout). Stays visible for a minimum of 300ms so fast / prefetched
 * navigations still register visually.
 *
 * Implementation notes:
 *   - The link itself gets `position: relative` so the spinner can
 *     overlay via `absolute`. Children render unchanged — no wrapper
 *     span that would break `block` layouts (cards) or `inline-flex`
 *     layouts (buttons).
 *   - Each LoadingLink owns its own pending state via `useLinkStatus`.
 *     No global event listener, no `usePathname` subscription, no DOM
 *     surgery — defensive against the kind of edge-case crash that
 *     `nextjs-toploader` and the prior global TopLoader hit.
 */
interface Props extends Omit<LinkProps, "children"> {
  children: ReactNode;
  className?: string;
  /** Where the spinner sits within the link's relative box. */
  spinnerPosition?: "top-right" | "right" | "center";
  "aria-label"?: string;
}

export function LoadingLink({
  children,
  className,
  spinnerPosition = "top-right",
  ...rest
}: Props) {
  return (
    <Link {...rest} className={clsx("relative", className)}>
      {children}
      <PendingSpinner position={spinnerPosition} />
    </Link>
  );
}

function PendingSpinner({
  position,
}: {
  position: "top-right" | "right" | "center";
}) {
  const { pending } = useLinkStatus();
  const [show, setShow] = useState(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (pending) {
      startRef.current = performance.now();
      setShow(true);
      return;
    }
    if (!show) return;
    // Keep visible for a minimum of 300ms so users actually see it on
    // fast (prefetched) navigations.
    const elapsed = performance.now() - (startRef.current ?? 0);
    const remaining = Math.max(0, 300 - elapsed);
    const t = setTimeout(() => setShow(false), remaining);
    return () => clearTimeout(t);
  }, [pending, show]);

  if (!show) return null;

  const positionClass =
    position === "top-right"
      ? "top-2 right-2"
      : position === "right"
        ? "top-1/2 right-3 -translate-y-1/2"
        : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <span
      aria-hidden
      className={clsx(
        "absolute pointer-events-none inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin opacity-90",
        positionClass,
      )}
    />
  );
}
