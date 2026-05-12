import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { readTable, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  PolicyReport,
  Transaction,
  User,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const TO = "chaudharimanish1977@gmail.com";
const FROM = "RightOffer Reports <hello@rightoffer.in>";

/**
 * Hourly activity digest, fired by Vercel Cron at the top of each hour.
 * Counts last-hour vs all-time across the key tables and emails a tidy HTML
 * summary to the founder inbox.
 *
 * Vercel Cron hits us with header `Authorization: Bearer <CRON_SECRET>`, so
 * we reject anything else to keep this private. Without that, anyone could
 * spam-trigger the digest.
 */
export async function GET(request: NextRequest) {
  // Auth: Vercel Cron + a CRON_SECRET env var
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    const [policies, reports, users, transactions] = await Promise.all([
      readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
      readTable<PolicyReport>(Tables.REPORTS),
      readTable<User>(Tables.USERS),
      readTable<Transaction>(Tables.TRANSACTIONS),
    ]);

    const lastHourPolicies = policies.filter(
      (p) => new Date(p.uploadedAt).getTime() >= hourAgo
    );
    const lastHourReports = reports.filter(
      (r) => new Date(r.generatedAt).getTime() >= hourAgo
    );
    const lastHourUsers = users.filter(
      (u) => new Date(u.createdAt).getTime() >= hourAgo
    );
    const lastHourTransactions = transactions.filter(
      (t) => new Date(t.createdAt).getTime() >= hourAgo
    );

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured" },
        { status: 500 }
      );
    }
    const resend = new Resend(apiKey);

    const istNow = new Date(now).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
    const istHourAgo = new Date(hourAgo).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const subject = `RightOffer · ${lastHourPolicies.length} polic${lastHourPolicies.length === 1 ? "y" : "ies"} processed — ${istNow.split(",")[1]?.trim() ?? ""}`;

    const html = renderHtml({
      windowFrom: istHourAgo,
      windowTo: istNow,
      lastHourPolicies,
      lastHourReports,
      lastHourUsers,
      lastHourTransactions,
      cumulative: {
        policies: policies.length,
        reports: reports.length,
        users: users.length,
        transactions: transactions.length,
      },
    });

    const text = renderText({
      windowFrom: istHourAgo,
      windowTo: istNow,
      lastHourPolicies,
      lastHourReports,
      lastHourUsers,
      lastHourTransactions,
      cumulative: {
        policies: policies.length,
        reports: reports.length,
        users: users.length,
        transactions: transactions.length,
      },
    });

    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[cron/hourly-digest] Resend error:", error);
      return NextResponse.json(
        { error: `Resend failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sentTo: TO,
      counts: {
        policies: lastHourPolicies.length,
        reports: lastHourReports.length,
        users: lastHourUsers.length,
        transactions: lastHourTransactions.length,
      },
    });
  } catch (err) {
    console.error("[cron/hourly-digest] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// Email body renderers
// ============================================================================

interface DigestData {
  windowFrom: string;
  windowTo: string;
  lastHourPolicies: ParsedPolicy[];
  lastHourReports: PolicyReport[];
  lastHourUsers: User[];
  lastHourTransactions: Transaction[];
  cumulative: {
    policies: number;
    reports: number;
    users: number;
    transactions: number;
  };
}

function renderHtml(d: DigestData): string {
  const vehicleList =
    d.lastHourPolicies
      .slice(0, 20)
      .map(
        (p) =>
          `<li>${escape(p.vehicle.make)} ${escape(p.vehicle.model)} · ${escape(p.vehicle.registrationNumber || "—")} · ${escape(p.owner?.name || "—")}</li>`
      )
      .join("") || "<li><em>No policies parsed this hour.</em></li>";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8F9FA;font-family:Inter,system-ui,sans-serif;color:#2D3436;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F9FA;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#0A2463,#247BA0);padding:20px 24px;color:#fff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">RightOffer · Hourly digest</div>
          <div style="font-size:18px;font-weight:700;margin-top:4px;">${escape(d.windowFrom)} → ${escape(d.windowTo)} IST</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
            <tr>
              <td width="50%" valign="top" style="padding-right:8px;">
                <div style="background:#F8F9FA;border-radius:12px;padding:14px;">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#636e72;">Past hour</div>
                  <div style="margin-top:10px;font-size:15px;line-height:1.7;">
                    <div><strong>${d.lastHourPolicies.length}</strong> polic${d.lastHourPolicies.length === 1 ? "y" : "ies"} parsed</div>
                    <div><strong>${d.lastHourReports.length}</strong> report${d.lastHourReports.length === 1 ? "" : "s"} generated</div>
                    <div><strong>${d.lastHourUsers.length}</strong> customer${d.lastHourUsers.length === 1 ? "" : "s"} captured</div>
                    <div><strong>${d.lastHourTransactions.length}</strong> transaction${d.lastHourTransactions.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
              </td>
              <td width="50%" valign="top" style="padding-left:8px;">
                <div style="background:#F8F9FA;border-radius:12px;padding:14px;">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#636e72;">All-time</div>
                  <div style="margin-top:10px;font-size:15px;line-height:1.7;">
                    <div><strong>${d.cumulative.policies}</strong> polic${d.cumulative.policies === 1 ? "y" : "ies"}</div>
                    <div><strong>${d.cumulative.reports}</strong> report${d.cumulative.reports === 1 ? "" : "s"}</div>
                    <div><strong>${d.cumulative.users}</strong> customer${d.cumulative.users === 1 ? "" : "s"}</div>
                    <div><strong>${d.cumulative.transactions}</strong> transaction${d.cumulative.transactions === 1 ? "" : "s"}</div>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#636e72;margin-bottom:8px;">Vehicles processed this hour</div>
          <ul style="margin:0 0 0 18px;padding:0;font-size:13px;line-height:1.7;color:#2D3436;">
            ${vehicleList}
          </ul>
        </td></tr>
        <tr><td style="padding:14px 24px;background:#F8F9FA;border-top:1px solid #E9ECEF;font-size:11px;color:#636e72;text-align:center;">
          RightOffer · automated hourly digest
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText(d: DigestData): string {
  const lines: string[] = [
    `RightOffer · Hourly digest`,
    `${d.windowFrom} → ${d.windowTo} IST`,
    ``,
    `Past hour:`,
    `  ${d.lastHourPolicies.length} policies parsed`,
    `  ${d.lastHourReports.length} reports generated`,
    `  ${d.lastHourUsers.length} customers captured`,
    `  ${d.lastHourTransactions.length} transactions`,
    ``,
    `All-time:`,
    `  ${d.cumulative.policies} policies`,
    `  ${d.cumulative.reports} reports`,
    `  ${d.cumulative.users} customers`,
    `  ${d.cumulative.transactions} transactions`,
    ``,
  ];
  if (d.lastHourPolicies.length > 0) {
    lines.push("Vehicles this hour:");
    d.lastHourPolicies.slice(0, 20).forEach((p) => {
      lines.push(
        `  - ${p.vehicle.make} ${p.vehicle.model} · ${p.vehicle.registrationNumber || "—"} · ${p.owner?.name || "—"}`
      );
    });
  }
  return lines.join("\n");
}

function escape(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
