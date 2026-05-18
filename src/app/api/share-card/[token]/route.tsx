import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { findById, findOne, Tables } from "@/lib/db";
import { computeCoverageScore } from "@/lib/coverage-score";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import { formatINR } from "@/lib/format";
import type {
  ParsedPolicy,
  PolicyReport,
  ShareToken,
} from "@/lib/types";

/**
 * GET /api/share-card/[token] — public 1200×630 OG image for the
 * /share/[token] page (Phase 7d.3 unfurl polish).
 *
 * Unlike /api/report-card/[id] (which is gated by session for the
 * customer's own use), this route is PUBLIC. It's referenced by the
 * share page's openGraph.images metadata, so when the share link is
 * forwarded on WhatsApp / LinkedIn / Twitter, the platform scraper
 * resolves this URL and produces a rich preview card.
 *
 * Depersonalised — no owner name, plate, email, mobile, or address.
 * Only the depersonalised facts the share page itself displays:
 *   · Vehicle make + model + year
 *   · Verdict label
 *   · At-risk total
 *   · "Free review · 2 minutes · rightoffer.in" footer
 *
 * 1200×630 is the OG standard — fits cleanly in WhatsApp, Twitter
 * summary_large_image, LinkedIn, Slack. Square 1080×1080 is reserved
 * for the customer's own report-card download.
 *
 * Revoked tokens fall through to a generic "RightOffer audit" card
 * instead of 404'ing — the unfurl shouldn't be broken just because
 * the link was revoked after sharing.
 */

export const runtime = "nodejs";

interface Params {
  params: Promise<{ token: string }>;
}

// 1200×630 — standard OG image dimensions.
const SIZE = { width: 1200, height: 630 };

export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const shareToken = await findById<ShareToken>(Tables.SHARE_TOKENS, token);

  // Revoked / missing tokens → render a generic brand card. Better
  // than a 404 unfurl, which would look like a dead link.
  if (!shareToken || shareToken.revoked) {
    return new ImageResponse(<GenericCard />, SIZE);
  }

  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    shareToken.parsedPolicyId
  );
  if (!parsedPolicy) {
    return new ImageResponse(<GenericCard />, SIZE);
  }

  const report = await findOne<PolicyReport>(
    Tables.REPORTS,
    (r) => r.parsedPolicyId === shareToken.parsedPolicyId
  );

  // Derived figures — same logic the /share/[token] page uses.
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
    "A car";
  const yearLabel = parsedPolicy.vehicle.yearOfManufacture
    ? `${parsedPolicy.vehicle.yearOfManufacture}`
    : "";
  const verdict = verdictLabel(coverage.score);
  const atRiskBig = moneyAtRisk.total > 0 ? formatINR(moneyAtRisk.total) : "—";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FDFBF6", // brand-offwhite
          display: "flex",
          padding: "60px 76px",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#2A2640", // brand-charcoal
          position: "relative",
        }}
      >
        {/* Plum left-rule running the full height — same editorial
            vocabulary as the on-site share page. */}
        <div
          style={{
            width: 6,
            background: "#6B4F8A", // brand-plum
            marginRight: 40,
            display: "flex",
          }}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Top kicker — mono uppercase, sage */}
          <div
            style={{
              fontSize: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#7A8B7A", // brand-sage
              fontWeight: 700,
              fontFamily: "Menlo, monospace",
              display: "flex",
            }}
          >
            · A friend shared their RightOffer audit ·
          </div>

          {/* Vehicle headline — large serif, italic plum year */}
          <div
            style={{
              marginTop: 28,
              fontSize: 78,
              lineHeight: 1,
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
                  marginLeft: 20,
                  fontStyle: "italic",
                  color: "#6B4F8A",
                  fontWeight: 500,
                }}
              >
                ({yearLabel})
              </span>
            ) : null}
          </div>

          {/* Verdict line */}
          <div
            style={{
              marginTop: 14,
              fontSize: 28,
              fontStyle: "italic",
              color: verdictColor(coverage.score),
              fontWeight: 500,
              display: "flex",
            }}
          >
            {verdict}
          </div>

          {/* At-risk hero — large coral number */}
          {moneyAtRisk.total > 0 && (
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "#E17055", // brand-alert
                  fontWeight: 700,
                  fontFamily: "Menlo, monospace",
                  display: "flex",
                }}
              >
                · At risk today, if a claim happens ·
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 104,
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
                  fontSize: 24,
                  fontStyle: "italic",
                  color: "#666377",
                  display: "flex",
                }}
              >
                out-of-pocket across {moneyAtRisk.count}{" "}
                {moneyAtRisk.count === 1 ? "gap" : "gaps"}.
              </div>
            </div>
          )}

          {/* Footer brand + CTA */}
          <div
            style={{
              marginTop: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 22,
              borderTop: "2px solid rgba(42, 38, 64, 0.15)",
            }}
          >
            <div
              style={{
                fontSize: 28,
                color: "#2A2640",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 700 }}>right</span>
              <span
                style={{
                  fontWeight: 700,
                  color: "#6B4F8A",
                  fontStyle: "italic",
                }}
              >
                offer
              </span>
              <span style={{ color: "#666377", marginLeft: 4 }}>.in</span>
            </div>
            <div
              style={{
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#928BB6",
                fontWeight: 700,
                fontFamily: "Menlo, monospace",
                display: "flex",
              }}
            >
              · Free review · 2 minutes · Yours up next ·
            </div>
          </div>
        </div>
      </div>
    ),
    SIZE
  );
}

/** Fallback card for revoked / missing tokens — keeps the unfurl
 *  branded rather than showing a dead-link preview. */
function GenericCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#FDFBF6",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 76px",
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: "#2A2640",
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#7A8B7A",
          fontWeight: 700,
          fontFamily: "Menlo, monospace",
          display: "flex",
        }}
      >
        · RightOffer · Motor insurance review ·
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 78,
          lineHeight: 1.05,
          letterSpacing: -2,
          fontWeight: 500,
          textAlign: "center",
          display: "flex",
        }}
      >
        Audit your car insurance
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 38,
          fontStyle: "italic",
          color: "#6B4F8A",
          display: "flex",
        }}
      >
        in under 2 minutes.
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 22,
          color: "#666377",
          display: "flex",
        }}
      >
        Free. Independent. No sales calls.
      </div>
    </div>
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
  if (score >= 70) return "#00B894";
  if (score >= 50) return "#6B4F8A";
  return "#E17055";
}

// Suppress unused-var lint on the Next.js helper export.
void NextResponse;
