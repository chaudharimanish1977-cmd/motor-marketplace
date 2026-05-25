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

        // Brand palette tuned for both themes. The CRITICAL ones for
        // legibility: primaryColor (default node fill) + primaryTextColor
        // must contrast. In dark mode we use a mid-plum fill with cream
        // text; in light mode we use a near-white fill with charcoal
        // text. Mermaid's default styling for things like classDef
        // overrides these — we removed those classDefs from each chart
        // so theme variables actually win.
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            background: "transparent",
            // Primary nodes — most boxes in our flowcharts
            primaryColor: isDark ? "#3a1e3d" : "#f7f4f7",
            primaryTextColor: isDark ? "#f3eef0" : "#1a1218",
            primaryBorderColor: isDark ? "#c485c9" : "#3a1e3d",
            // Edges / arrows
            lineColor: isDark ? "#c485c9" : "#3a1e3d",
            // Subgraph / cluster styling
            clusterBkg: isDark ? "rgba(60,30,63,0.18)" : "rgba(247,244,247,0.5)",
            clusterBorder: isDark ? "#c485c9" : "#3a1e3d",
            titleColor: isDark ? "#f3eef0" : "#1a1218",
            // Secondary nodes — sage accent (less used but defined for completeness)
            secondaryColor: isDark ? "#5a6b50" : "#eef2ec",
            secondaryTextColor: isDark ? "#f3eef0" : "#1a1218",
            secondaryBorderColor: isDark ? "#a8baa0" : "#8b9d80",
            // Tertiary — slate utility
            tertiaryColor: isDark ? "#334155" : "#fafafa",
            tertiaryTextColor: isDark ? "#f3eef0" : "#1a1218",
            tertiaryBorderColor: isDark ? "#9a8f98" : "#6b6571",
            // Notes / text in misc places
            noteBkgColor: isDark ? "#3a1e3d" : "#fef3c7",
            noteTextColor: isDark ? "#f3eef0" : "#1a1218",
            noteBorderColor: isDark ? "#c485c9" : "#92400e",
            fontFamily:
              "var(--font-newsreader), Newsreader, Georgia, serif",
            fontSize: "14px",
          },
          flowchart: {
            curve: "basis",
            padding: 18,
            nodeSpacing: 38,
            rankSpacing: 52,
            useMaxWidth: true,
            htmlLabels: true,
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
    <figure className="my-4">
      <div
        ref={ref}
        className="w-full overflow-x-auto py-3 [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
        aria-label={caption ?? "Architecture diagram"}
      />
      {error && (
        <p className="mt-2 font-mono text-[11px] text-brand-alert">
          {error}
        </p>
      )}
      {caption && (
        <figcaption className="mt-4 font-serif italic text-[13.5px] text-brand-slate leading-[1.55] max-w-3xl">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
