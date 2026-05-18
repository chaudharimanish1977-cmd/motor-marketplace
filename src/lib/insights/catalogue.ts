/**
 * Insight catalogue — the full set of authored insights, statically
 * imported at build time.
 *
 * Adding a new insight: drop a new TypeScript module in
 * src/content/insights/<slug>.ts that default-exports a typed Insight
 * object, then add the import + entry below. The matcher reads from
 * here at every /me/insights and /report/[id] render.
 *
 * Why a hand-maintained index instead of a glob: keeps the build
 * deterministic, makes it obvious to a reviewer which insights are
 * live, and provides a single place to enforce schema validation if
 * we add it later.
 */

import type { Insight } from "@/lib/insights/types";
import monsoonEngineProtect2026 from "@/content/insights/monsoon-engine-protect-2026";
import ncbProtectionClaims2026 from "@/content/insights/ncb-protection-claims-2026";
import premiumTrendQ12026 from "@/content/insights/premium-trend-q1-2026";

export const INSIGHT_CATALOGUE: Insight[] = [
  monsoonEngineProtect2026,
  ncbProtectionClaims2026,
  premiumTrendQ12026,
];
