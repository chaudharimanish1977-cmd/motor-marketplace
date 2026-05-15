"use client";

import Link, { useLinkStatus } from "next/link";
import type { LinkProps } from "next/link";
import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * Per-link loading feedback using Next.js 15's built-in `useLinkStatus`
 * hook. Drop-in replacement for `<Link>` — same API. When the click is
 * pending (navigation in flight), the link content dims slightly and
 * a small orange spinner overlays the right edge so the user sees
 * "yes, I clicked, something is happening".
 *
 * No global event listener, no `usePathname` subscription, no DOM
 * surgery outside the link's own element. Each instance owns its own
 * pending state via `useLinkStatus`.
 */
interface Props extends Omit<LinkProps, "children"> {
  children: ReactNode;
  className?: string;
  /** Optional CSS class applied while the link is pending. */
  pendingClassName?: string;
  /** Hide the built-in spinner overlay if you want to handle it yourself. */
  hideSpinner?: boolean;
  /** Forwarded as the rendered <a>'s aria-label. */
  "aria-label"?: string;
}

export function LoadingLink({
  children,
  className,
  pendingClassName,
  hideSpinner,
  ...rest
}: Props) {
  return (
    <Link {...rest} className={className}>
      <LoadingInner pendingClassName={pendingClassName} hideSpinner={hideSpinner}>
        {children}
      </LoadingInner>
    </Link>
  );
}

function LoadingInner({
  children,
  pendingClassName,
  hideSpinner,
}: {
  children: ReactNode;
  pendingClassName?: string;
  hideSpinner?: boolean;
}) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={clsx(
        "relative inline-flex items-center gap-2 transition-opacity",
        pending && "opacity-75",
        pending && pendingClassName,
      )}
    >
      {children}
      {pending && !hideSpinner && (
        <span
          aria-hidden
          className="inline-block w-3.5 h-3.5 border-2 border-current border-r-transparent rounded-full animate-spin shrink-0"
        />
      )}
    </span>
  );
}
