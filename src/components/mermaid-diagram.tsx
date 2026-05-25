"use client";

import { useEffect, useRef, useState } from "react";

/**
 * MermaidDiagram — client-side renderer for Mermaid flowcharts.
 *
 * Dynamically imports the mermaid package on mount so the ~80kb
 * bundle never lands in routes that don't use it. Renders into a div;
 * the div height auto-fits the SVG.
 *
 * Theme: a custom config that maps Mermaid's node fills + edge colours
 * to the brand palette (plum primary, sage secondary, charcoal body,
 * slate muted). Dark mode hooks into the same theme variables.
 *
 * Pass the diagram source as the `chart` prop. ID is auto-generated
 * to avoid collisions when multiple diagrams render on the same page.
 */
interface Props {
  /** Mermaid diagram source. e.g. `flowchart TB\n  A --> B` */
  chart: string;
  /** Optional caption shown below the diagram in italic editorial style. */
  caption?: string;
}

let counter = 0;

export function MermaidDiagram({ chart, caption }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [id] = useState(() => `mermaid-${++counter}`);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        // Detect dark mode via the html.dark class (set by ThemeToggle).
        const isDark =
          typeof document !== "undefined" &&
          document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            // Editorial brand palette mapped to Mermaid variables.
            // See https://mermaid.js.org/config/theming.html#theme-variables
            background: isDark ? "#0e0a10" : "#ffffff",
            primaryColor: isDark ? "#241522" : "#f7f4f7",
            primaryTextColor: isDark ? "#f3eef0" : "#1a1218",
            primaryBorderColor: isDark ? "#c485c9" : "#3a1e3d",
            lineColor: isDark ? "#9a8f98" : "#6b6571",
            secondaryColor: isDark ? "#1a2118" : "#eef2ec",
            secondaryTextColor: isDark ? "#f3eef0" : "#1a1218",
            secondaryBorderColor: isDark ? "#a8baa0" : "#8b9d80",
            tertiaryColor: isDark ? "#1E293B" : "#fafafa",
            tertiaryTextColor: isDark ? "#f3eef0" : "#1a1218",
            tertiaryBorderColor: isDark ? "#475569" : "#e6e4e8",
            fontFamily:
              "var(--font-newsreader), Newsreader, Georgia, serif",
            fontSize: "13.5px",
          },
          flowchart: {
            curve: "basis",
            padding: 14,
            nodeSpacing: 32,
            rankSpacing: 44,
            useMaxWidth: true,
          },
          securityLevel: "loose",
        });

        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[mermaid] render failed:", err);
          setError(
            err instanceof Error ? err.message : "Diagram render failed"
          );
        }
      }
    }
    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <figure className="my-8">
      <div
        ref={ref}
        className="overflow-x-auto rounded-2xl border border-brand-light-gray dark:border-slate-700 bg-brand-offwhite p-5 md:p-7 [&_svg]:max-w-full [&_svg]:h-auto"
        aria-label={caption ?? "Architecture diagram"}
      />
      {error && (
        <p className="mt-2 font-mono text-[11px] text-brand-alert">
          {error}
        </p>
      )}
      {caption && (
        <figcaption className="mt-3 font-serif italic text-[13px] text-brand-slate leading-[1.55] text-center max-w-2xl mx-auto">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
