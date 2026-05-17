import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { findById, findOne, Tables } from "@/lib/db";
import { computeCoverageScore } from "@/lib/coverage-score";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import { formatINR } from "@/lib/format";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";

/**
 * GET /api/report-card/[id] — generates a WhatsApp-shareable summary
 * card (PNG, 1080×1080 square) for the report (Phase 7d.2).
 *
 * Single editorial composition:
 *   · top — RightOffer wordmark + "RightOffer Reading Room · No. XXXX"
 *   · middle — vehicle line + verdict label, with the verdict's smiley
 *     rating expressed as a single big number (1-5)
 *   · centre — "At risk today · ₹X" hero, the strongest social-proof beat
 *   · bottom — "Free review · 2 minutes · rightoffer.in" CTA + 4-digit
 *     issue number for editorial consistency with the on-screen cover
 *
 * Generated via next/og's ImageResponse — same engine the brand's
 * sitewide OG image already uses, so the visual language stays consistent.
 *
 * Auth gate matches /api/report-pdf — verified session OR upload-session
 * that owns this doc.
 */

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

// 1080×1080 — WhatsApp's preferred square for forwarded images.
const SIZE = { width: 1080, height: 1080 };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    id
  );
  if (!parsedPolicy) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Same gating as the PDF + /report/[id] surfaces — any verified
  // session can render the card. See report-pdf/[id] for why we keep
  // this lenient rather than enforcing a strict email match.
  const [fullSessionEmail, uploadSession] = await Promise.all([
    getSession(),
    getUploadSession(),
  ]);
  const fullSessionOk = !!fullSessionEmail;
  const uploadSessionOk =
    !!uploadSession && uploadSession.docs.includes(id);
  if (!fullSessionOk && !uploadSessionOk) {
    return NextResponse.json(
      { error: "Sign in at /me/login to generate the summary card." },
      { status: 401 }
    );
  }

  const report = await findOne<PolicyReport>(
    Tables.REPORTS,
    (r) => r.parsedPolicyId === id
  );

  // Derived figures
  const vehicleAge = Math.max(
    0,
    new Date().getFullYear() - (parsedPolicy.vehicle.yearOfManufacture || 0)
  );
  const moneyAtRisk = totalMoneyAtRisk(
    report?.keyGaps.items.map((g) => g.title) ?? [],
    parsedPolicy.idv,
    vehicleAge
  );
  const coverage = computeCoverageScore(parsedPolicy, report ?? undefined);
  const vehicleLabel =
    `${parsedPolicy.vehicle.make} ${parsedPolicy.vehicle.model}`.trim() ||
    "Your car";
  const yearLabel = parsedPolicy.vehicle.yearOfManufacture
    ? `${parsedPolicy.vehicle.yearOfManufacture}`
    : "";
  const verdict = verdictLabel(coverage.score);
  const issueNo = issueNumberFor(id);
  const atRiskBig = moneyAtRisk.total > 0 ? formatINR(moneyAtRisk.total) : "—";
  const gapsCount = report?.keyGaps.items.length ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FDFBF6", // brand-offwhite
          display: "flex",
          flexDirection: "column",
          padding: "72px 76px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#2A2640", // brand-charcoal
          position: "relative",
        }}
      >
        {/* ─── Masthead ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#7A8B7A", // brand-sage
            fontWeight: 700,
          }}
        >
          <span>· RightOffer · Reading Room ·</span>
          <span style={{ color: "#928BB6" /* slate */ }}>No. {issueNo}</span>
        </div>

        {/* Hairline */}
        <div
          style={{
            width: "100%",
            height: 2,
            background: "rgba(42, 38, 64, 0.15)",
            marginTop: 16,
          }}
        />

        {/* ─── Vehicle + verdict ────────────────────────────────── */}
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#928BB6",
              fontWeight: 700,
              fontFamily: "Menlo, monospace",
            }}
          >
            · The audit ·
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: -2,
              fontWeight: 500,
              color: "#2A2640",
              display: "flex",
            }}
          >
            {vehicleLabel}
            {yearLabel ? (
              <span
                style={{
                  marginLeft: 18,
                  fontStyle: "italic",
                  color: "#6B4F8A" /* brand-plum */,
                  fontWeight: 500,
                }}
              >
                ({yearLabel})
              </span>
            ) : null}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 36,
              fontStyle: "italic",
              color: verdictColor(coverage.score),
              fontWeight: 500,
              display: "flex",
            }}
          >
            {verdict}
          </div>
        </div>

        {/* ─── At-risk hero ─────────────────────────────────────── */}
        <div
          style={{
            marginTop: 64,
            paddingLeft: 28,
            borderLeft: "6px solid #E17055" /* brand-alert */,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#E17055",
              fontWeight: 700,
              fontFamily: "Menlo, monospace",
            }}
          >
            · At risk today, if a claim happens ·
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 132,
              fontWeight: 700,
              letterSpacing: -3,
              color: "#2A2640",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              display: "flex",
            }}
          >
            {atRiskBig}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 28,
              fontStyle: "italic",
              color: "#666377",
              display: "flex",
            }}
          >
            out-of-pocket across{" "}
            {moneyAtRisk.count} {moneyAtRisk.count === 1 ? "gap" : "gaps"}
            {gapsCount > moneyAtRisk.count
              ? ` (${gapsCount} reviewed)`
              : ""}
          </div>
        </div>

        {/* ─── Footer CTA + issue caption ──────────────────────── */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 32,
            borderTop: "2px solid rgba(42, 38, 64, 0.15)",
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: "#2A2640",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700 }}>right</span>
            <span style={{ fontWeight: 700, color: "#6B4F8A", fontStyle: "italic" }}>
              offer
            </span>
            <span style={{ color: "#666377", marginLeft: 4 }}>.in</span>
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#928BB6",
              fontWeight: 700,
              fontFamily: "Menlo, monospace",
            }}
          >
            · Free review · 2 minutes · Yours up next ·
          </div>
        </div>
      </div>
    ),
    SIZE
  );
}

function verdictLabel(score: number): string {
  if (score >= 85) return "Excellent — strong cover across the board.";
  if (score >= 70) return "Good — solid base with a couple of opportunities.";
  if (score >= 50) return "Decent — meaningful gaps worth closing.";
  if (score >= 30) return "Gaps to watch — claim-time exposure is real.";
  return "Critical — major gaps in current cover.";
}

function verdictColor(score: number): string {
  if (score >= 70) return "#00B894"; // brand-success teal
  if (score >= 50) return "#6B4F8A"; // brand-plum
  return "#E17055"; // brand-alert coral
}

/** Deterministic 4-digit issue number — mirrors report-cover's helper
 *  so the saved card and the on-screen cover quote the same edition. */
function issueNumberFor(id: string): string {
  let h = 5_381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  }
  const n = 42 + (Math.abs(h) % 9958);
  return n.toString().padStart(4, "0");
}
