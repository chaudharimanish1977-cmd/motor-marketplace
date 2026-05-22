/**
 * Resend wrapper for sending the policy review email.
 *
 * The send is lazy-initialised (Resend client only created when the function
 * actually runs) so the module loads cleanly during Next.js build steps that
 * don't have RESEND_API_KEY available.
 *
 * Both an HTML body AND a PDF attachment are sent. The HTML is a tiny
 * branded summary + a link back to the live report; the PDF is the offline
 * archive the customer can keep / forward / send over WhatsApp later.
 */

import { Resend } from "resend";

const REPLY_TO = "hello@rightoffer.in";

// OTP emails use a personal-sounding From name so Gmail is more likely to
// classify them as Primary rather than the Updates tab (where heavily-
// branded transactional emails usually land). The mailbox stays the same.
// Format is "Brand Buddy First-Name" so the customer sees both the brand
// (RightOffer) and a human (Aryan) in the same line.
const OTP_FROM = "RightOffer Buddy Aryan <hello@rightoffer.in>";

// Renewal-reminder mail is sent as if from a human at RightOffer (Aryan).
// Gmail's Promotions classifier weighs sender-name shape heavily — bare
// brand names land Promotions, person-shaped names land Primary. Different
// suffix from OTP_FROM so the two streams don't share a classifier
// fingerprint inside Gmail's per-sender model.
const REMINDER_FROM = "Aryan from RightOffer <hello@rightoffer.in>";

// Report-delivery mail follows the same person-shape pattern. Distinct
// from OTP_FROM and REMINDER_FROM so Gmail's per-sender classifier
// learns each stream independently. Subject + body are factual /
// editorial, not marketing-y.
const REPORT_FROM = "Aryan at RightOffer <hello@rightoffer.in>";

// Inbound-forward replies — when a customer forwards a policy to
// review@rightoffer.in, this is the From we use in the reply. The
// sending domain stays rightoffer.in (already DKIM/SPF-verified at
// Resend), but the local-part shifts to review@ so the stream
// builds its own reputation independent of OTP/reminder/report-
// delivery. Reply-To stays hello@ so any human reply lands in the
// real mailbox (not the auto-processing webhook).
const INBOUND_REPLY_FROM = "Aryan at the Review Desk <review@rightoffer.in>";

let cached: Resend | null = null;
function client(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  cached = new Resend(key);
  return cached;
}

interface SendArgs {
  to: string;
  vehicleLabel: string;
  reportUrl: string;
  pdf: Buffer;
  /** Customer's display name (Google OAuth profile / typed at OTP).
   *  Optional — falls back to "there" if missing. */
  firstName?: string;
}

export async function sendReportEmail({
  to,
  vehicleLabel,
  reportUrl,
  pdf,
  firstName,
}: SendArgs): Promise<void> {
  // Subject is factual, no marketing punctuation — keeps Gmail's
  // Promotions classifier off the scent. Matches the renewal-reminder
  // pattern.
  const subject = `Your motor insurance review — ${vehicleLabel}`;
  const html = renderHtml({ vehicleLabel, reportUrl, firstName });
  const text = renderText({ vehicleLabel, reportUrl, firstName });

  const { error } = await client().emails.send({
    from: REPORT_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: "rightoffer-motor-insurance-review.pdf",
        content: pdf,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
}

function renderHtml({
  vehicleLabel,
  reportUrl,
  firstName,
}: {
  vehicleLabel: string;
  reportUrl: string;
  firstName?: string;
}): string {
  // Editorial treatment matches the renewal-reminder email:
  //   · No gradient header
  //   · No colored CTA button — plain underlined link
  //   · No card chrome / box shadow
  //   · Georgia serif body, mono kicker, italic plum accent
  //   · Signed by Aryan (the analyst character on /about)
  //   · Hairline rule before PS lines
  //
  // Hex values mirror the brand tokens in globals.css:
  //   #1a1218 brand-charcoal · #3a1e3d brand-plum
  //   #6b6571 brand-slate · #8b9d80 brand-sage
  //   #e6e4e8 brand-light-gray
  const greeting = (firstName ?? "").trim() || "there";
  return `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Your motor insurance review for ${escape(vehicleLabel)} is attached. Yours to keep, forward, or print.
  </div>
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Your motor insurance review &middot;
    </div>

    <p style="margin:0 0 18px;">Hi ${escape(greeting)},</p>

    <p style="margin:0 0 18px;">
      Here&rsquo;s the full review of your <em style="font-style:italic;color:#3a1e3d;">${escape(vehicleLabel)}</em> — attached as a PDF you can keep, forward, or print. The live version stays at the link below if you&rsquo;d rather read it on screen.
    </p>

    <p style="margin:0 0 18px;"><a href="${escape(reportUrl)}" style="color:#3a1e3d;">${escape(reportUrlLabel(reportUrl))}</a></p>

    <p style="margin:0 0 18px;font-style:italic;color:#6b6571;">Spot something off, or just have a question? Reply to this email — we read every one and come back to you.</p>

    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>

    <hr style="margin:36px 0 22px;border:none;border-top:1px solid #e6e4e8;" />

    <p style="margin:0 0 14px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PS &middot; Details and analysis as of today. If your policy changes, drop the new one at <strong style="color:#1a1218;">rightoffer.in/upload</strong> and I&rsquo;ll re-audit.
    </p>
    <p style="margin:0;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PPS &middot; A term you don&rsquo;t recognise? Plain-English definitions live at <a href="https://rightoffer.in/glossary" style="color:#6b6571;">rightoffer.in/glossary</a>.
    </p>
  </div>
</body></html>`;
}

function renderText({
  vehicleLabel,
  reportUrl,
  firstName,
}: {
  vehicleLabel: string;
  reportUrl: string;
  firstName?: string;
}): string {
  const greeting = (firstName ?? "").trim() || "there";
  return [
    `· RightOffer · Your motor insurance review ·`,
    ``,
    `Hi ${greeting},`,
    ``,
    `Here's the full review of your ${vehicleLabel} — attached as a PDF you can keep, forward, or print. The live version stays at the link below if you'd rather read it on screen.`,
    ``,
    reportUrl,
    ``,
    `Spot something off, or just have a question? Reply to this email — we read every one and come back to you.`,
    ``,
    `— Aryan`,
    ``,
    `———`,
    ``,
    `PS · Details and analysis as of today. If your policy changes, drop the new one at rightoffer.in/upload and I'll re-audit.`,
    ``,
    `PPS · A term you don't recognise? Plain-English definitions live at https://rightoffer.in/glossary`,
  ].join("\n");
}

/** Strip the protocol prefix from a URL for a cleaner display in
 *  the email body — "https://rightoffer.in/report/abc" reads worse
 *  than "rightoffer.in/report/abc" in editorial copy. */
function reportUrlLabel(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================================
// OTP delivery
// ============================================================================

export async function sendOtpEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}): Promise<void> {
  // Subject is intentionally code-first so Gmail's inbox preview surfaces
  // the code without the user having to open the email at all. Nods to
  // the plate-style OTP input on the page ("plate code") so the email
  // subject + the visual on the page reinforce the same metaphor.
  const subject = `Your 4-digit plate code · ${code}`;

  // Plain-text-feel HTML. No gradient header, no card chrome, no marketing
  // footer — those are the patterns Gmail learns to bucket into "Updates".
  // Stripe / Slack / GitHub login codes look like this. The PRE-HEADER
  // (first hidden line) repeats the code so even when Gmail collapses the
  // preview it stays visible.
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#202124;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Your RightOffer code is ${escape(code)} — valid for 10 minutes.
  </div>
  <div style="max-width:560px;">
    <p style="margin:0 0 16px;">Hi,</p>
    <p style="margin:0 0 16px;">Your RightOffer verification code is:</p>
    <p style="margin:0 0 16px;font-size:30px;font-weight:bold;letter-spacing:0.12em;color:#202124;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escape(code)}</p>
    <p style="margin:0 0 16px;color:#5f6368;font-size:14px;">This code expires in 10 minutes. If you didn&rsquo;t ask for it, you can ignore this email.</p>
    <p style="margin:24px 0 0;">&mdash; Aryan</p>
  </div>
</body></html>`;

  const text = [
    `Hi,`,
    ``,
    `Your RightOffer verification code is:`,
    ``,
    code,
    ``,
    `This code expires in 10 minutes. If you didn't ask for it, you can ignore this email.`,
    ``,
    `— Aryan`,
  ].join("\n");

  const { error } = await client().emails.send({
    from: OTP_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend (OTP) failed: ${error.message}`);
  }
}

// ============================================================================
// Magic-link sign-in
// ============================================================================

interface MagicLinkArgs {
  to: string;
  url: string;
}

/**
 * Sign-in email. Same plain-text-feel as OTP so Gmail treats it as a
 * personal/transactional message rather than marketing — that keeps it
 * out of the Updates tab where login mail is useless.
 *
 * Magic-link only (no 6-digit code shown). Single CTA, short body,
 * standard "didn't ask for this?" disclaimer.
 */
export async function sendMagicLinkEmail({
  to,
  url,
}: MagicLinkArgs): Promise<void> {
  const subject = `Sign in to RightOffer`;
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#202124;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Tap the link to sign in to RightOffer. Valid for 15 minutes.
  </div>
  <div style="max-width:560px;">
    <p style="margin:0 0 16px;">Hi,</p>
    <p style="margin:0 0 16px;">Tap the button below to sign in to RightOffer:</p>
    <p style="margin:0 0 20px;">
      <a href="${escape(url)}" style="display:inline-block;background:#1a3470;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:15px;">Sign in to RightOffer</a>
    </p>
    <p style="margin:0 0 16px;color:#5f6368;font-size:13px;">Or paste this URL into your browser:<br/><span style="color:#5f6368;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escape(url)}</span></p>
    <p style="margin:0 0 16px;color:#5f6368;font-size:14px;">This link expires in 15 minutes. If you didn&rsquo;t ask to sign in, you can ignore this email.</p>
    <p style="margin:24px 0 0;">&mdash; Aryan</p>
  </div>
</body></html>`;

  const text = [
    `Hi,`,
    ``,
    `Tap the link below to sign in to RightOffer:`,
    ``,
    url,
    ``,
    `This link expires in 15 minutes. If you didn't ask to sign in, you can ignore this email.`,
    ``,
    `— Aryan`,
  ].join("\n");

  const { error } = await client().emails.send({
    from: OTP_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend (magic-link) failed: ${error.message}`);
  }
}

// ============================================================================
// Renewal reminder
// ============================================================================

/**
 * Snapshot of the customer's last audit, included in renewal +
 * anniversary emails so the message acts as a "re-audit reminder"
 * rather than a bare "drop the quote back here" nudge.
 *
 * Optional — when absent (e.g. no PolicyReport exists for this
 * subscription's policy), the email falls back to the original
 * factual reminder copy.
 */
export interface PreviousAuditSnapshot {
  /** "Decent — meaningful gaps worth closing.", etc. */
  verdictLabel: string;
  /** 0–100 coverage score from computeCoverageScore. */
  coverageScore: number;
  /** Pre-formatted INR, e.g. "₹2.4L". Empty string if no money at risk. */
  atRiskInr: string;
  /** Count of gaps contributing to atRiskInr. */
  atRiskCount: number;
  /** Up to 3 key-gap titles, in display order. */
  topGapTitles: string[];
  /** Deep-link to the saved /report/[id] page (requires session). */
  reportUrl: string;
}

interface ReminderArgs {
  to: string;
  firstName: string;
  vehicleLabel: string;
  /** Formatted human-readable date, e.g. "15 Feb 2027". */
  expiryDate: string;
  /** Whole days remaining until policy expires (positive integer). */
  daysUntilExpiry: number;
  /** Where customers click to start their renewal review. */
  reviewUrl: string;
  /** One-click unsubscribe URL (signed token). */
  unsubscribeUrl: string;
  /** Optional carry-forward of the last audit's headline findings.
   *  When present, the email renders an "what your last audit found"
   *  block so the reminder reads as a re-audit nudge. */
  previousAudit?: PreviousAuditSnapshot;
}

/**
 * Renewal nudge email. Triggered by the daily cron when a subscription
 * hits one of its `daysBefore` checkpoints (e.g. 60 / 30 / 7 days out),
 * or fired manually as a preview via /api/me/reminders/[id]/test.
 *
 * Design intent: read as a personal note from Aryan (a human at
 * RightOffer), not a marketing blast. The previous gradient-header /
 * orange-button / branded-footer version landed in Gmail's Promotions
 * tab — confirmed live. This version mirrors the OTP email pattern
 * (which lands Primary): system fonts, no gradient, no card chrome,
 * a plain underlined link instead of a colored button, and a "PS"
 * line for the unsubscribe link instead of a footer block.
 *
 * Compliance:
 *   - `List-Unsubscribe` + `List-Unsubscribe-Post` headers — RFC 8058
 *     + Feb 2024 Gmail sender requirements. Required for bulk sender
 *     reputation regardless of body design. Gmail still respects them
 *     for one-click unsubscribe in the UI.
 *   - Visible unsubscribe link in the body (the PS line) as the
 *     human fallback.
 *
 * Copy intent: warm, factual, non-pushy. "Heads up about your renewal,
 * want a free review?" — not "Buy now! Save big! Limited time!"
 */
export async function sendRenewalReminderEmail({
  to,
  firstName,
  vehicleLabel,
  expiryDate,
  daysUntilExpiry,
  reviewUrl,
  unsubscribeUrl,
  previousAudit,
}: ReminderArgs): Promise<void> {
  const dayWord = daysUntilExpiry === 1 ? "day" : "days";
  // Factual subject — no em-dash sales hook, no "quick review?" tail.
  // Gmail's classifier reads punctuation patterns; "X in N days" reads
  // informational, "X — quick review?" reads marketing.
  const subject = `${vehicleLabel} renewal in ${daysUntilExpiry} ${dayWord}`;

  const html = renderReminderHtml({
    firstName,
    vehicleLabel,
    expiryDate,
    daysUntilExpiry,
    reviewUrl,
    unsubscribeUrl,
    previousAudit,
  });
  const text = renderReminderText({
    firstName,
    vehicleLabel,
    expiryDate,
    daysUntilExpiry,
    reviewUrl,
    unsubscribeUrl,
    previousAudit,
  });

  const { error } = await client().emails.send({
    from: REMINDER_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
    headers: {
      // Gmail/Yahoo one-click compliance (RFC 8058).
      "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) {
    throw new Error(`Resend (reminder) failed: ${error.message}`);
  }
}

function renderReminderHtml({
  firstName,
  vehicleLabel,
  expiryDate,
  daysUntilExpiry,
  reviewUrl,
  unsubscribeUrl,
  previousAudit,
}: Omit<ReminderArgs, "to">): string {
  const dayWord = daysUntilExpiry === 1 ? "day" : "days";
  const auditBlock = previousAudit
    ? renderPreviousAuditHtml(previousAudit)
    : "";

  // Editorial treatment — but still:
  //   · no gradient header
  //   · no colored CTA button
  //   · no card chrome / box shadow
  //   · plain underlined link instead of a button
  //   · PS/PPS lines as the unsubscribe + Promotions tip
  // ...so the Gmail Promotions classifier still reads this as a
  // personal letter rather than a campaign. The typography upgrade is
  // safe: serif body fonts + a small mono kicker are common in
  // newsletters that land Primary (Stratechery, The Atlantic, etc.).
  //
  // Hex values mirror the brand tokens defined in globals.css:
  //   #1a1218 = brand-charcoal (light-mode body text)
  //   #3a1e3d = brand-plum     (accent, italic + link)
  //   #6b6571 = brand-slate    (muted body, PS lines)
  //   #8b9d80 = brand-sage     (top kicker)
  //   #e6e4e8 = brand-light-gray (hairline rule)
  return `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escape(vehicleLabel)} renewal in ${daysUntilExpiry} ${dayWord}. A free, independent review when the quote arrives.
  </div>
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Renewal reminder &middot;
    </div>

    <p style="margin:0 0 18px;">Hi ${escape(firstName)},</p>

    <p style="margin:0 0 18px;">Quick note &mdash; your <em style="font-style:italic;color:#3a1e3d;">${escape(vehicleLabel)}</em> insurance is up for renewal on <strong>${escape(expiryDate)}</strong>, which is ${daysUntilExpiry} ${dayWord} away.</p>

    ${auditBlock}

    <p style="margin:0 0 18px;">When your renewal quote arrives, drop it back here and I&rsquo;ll re-run the audit on the new cover &mdash; what changed, what&rsquo;s worth keeping, and what to ask your insurer for.</p>

    <p style="margin:0 0 18px;"><a href="${escape(reviewUrl)}" style="color:#3a1e3d;">${escape(reviewUrl)}</a></p>

    <p style="margin:0 0 18px;font-style:italic;color:#6b6571;">Under two minutes. Free. No sales calls.</p>

    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>

    <hr style="margin:36px 0 22px;border:none;border-top:1px solid #e6e4e8;" />

    <p style="margin:0 0 14px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PS &middot; If this landed in Promotions or Spam, drag it to Primary or add <strong style="color:#1a1218;">hello@rightoffer.in</strong> to your contacts so the next one comes straight through.
    </p>
    <p style="margin:0;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PPS &middot; Don&rsquo;t want these? <a href="${escape(unsubscribeUrl)}" style="color:#6b6571;">Unsubscribe here</a> and I&rsquo;ll stop.
    </p>
  </div>
</body></html>`;
}

function renderReminderText({
  firstName,
  vehicleLabel,
  expiryDate,
  daysUntilExpiry,
  reviewUrl,
  unsubscribeUrl,
  previousAudit,
}: Omit<ReminderArgs, "to">): string {
  const dayWord = daysUntilExpiry === 1 ? "day" : "days";
  return [
    `· RightOffer · Renewal reminder ·`,
    ``,
    `Hi ${firstName},`,
    ``,
    `Quick note — your ${vehicleLabel} insurance is up for renewal on ${expiryDate}, which is ${daysUntilExpiry} ${dayWord} away.`,
    ``,
    ...(previousAudit ? renderPreviousAuditText(previousAudit) : []),
    `When your renewal quote arrives, drop it back here and I'll re-run the audit on the new cover — what changed, what's worth keeping, and what to ask your insurer for.`,
    ``,
    reviewUrl,
    ``,
    `Under two minutes. Free. No sales calls.`,
    ``,
    `— Aryan`,
    ``,
    `———`,
    ``,
    `PS · If this landed in Promotions or Spam, drag it to Primary or add hello@rightoffer.in to your contacts so the next one comes straight through.`,
    ``,
    `PPS · Don't want these? Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}

/** Render the "what your last audit found" block as an HTML island
 *  matching the surrounding editorial type (Georgia body + Menlo
 *  mono kicker + plum italic accent). Spaced as its own paragraph
 *  so it slots into the existing reminder flow cleanly. */
function renderPreviousAuditHtml(snap: PreviousAuditSnapshot): string {
  const gapsList = snap.topGapTitles
    .slice(0, 3)
    .map(
      (g) =>
        `<li style="margin:0 0 4px;">${escape(g)}</li>`
    )
    .join("");
  const atRiskLine =
    snap.atRiskInr && snap.atRiskCount > 0
      ? `<p style="margin:0 0 10px;"><strong style="color:#1a1218;">${escape(
          snap.atRiskInr
        )}</strong> at risk across ${snap.atRiskCount} ${
          snap.atRiskCount === 1 ? "gap" : "gaps"
        } in the current cover.</p>`
      : "";
  const gapsBlock = gapsList
    ? `<p style="margin:0 0 6px;">Top items worth re-checking on the new policy:</p>
       <ul style="margin:0 0 14px 22px;padding:0;color:#1a1218;">${gapsList}</ul>`
    : "";
  return `<div style="margin:0 0 22px;padding:14px 16px;border-left:3px solid #3a1e3d;background:#f7f4f7;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3a1e3d;font-weight:700;margin:0 0 8px;">
      &middot; What last year&rsquo;s audit found &middot;
    </div>
    <p style="margin:0 0 10px;font-style:italic;color:#3a1e3d;">${escape(
      snap.verdictLabel
    )}</p>
    ${atRiskLine}
    ${gapsBlock}
    <p style="margin:0;font-size:13px;color:#6b6571;"><a href="${escape(
      snap.reportUrl
    )}" style="color:#3a1e3d;">View your saved audit &rarr;</a></p>
  </div>`;
}

function renderPreviousAuditText(snap: PreviousAuditSnapshot): string[] {
  const lines: string[] = [
    `· What last year's audit found ·`,
    snap.verdictLabel,
  ];
  if (snap.atRiskInr && snap.atRiskCount > 0) {
    lines.push(
      `${snap.atRiskInr} at risk across ${snap.atRiskCount} ${
        snap.atRiskCount === 1 ? "gap" : "gaps"
      } in the current cover.`
    );
  }
  if (snap.topGapTitles.length > 0) {
    lines.push(``, `Top items worth re-checking on the new policy:`);
    for (const title of snap.topGapTitles.slice(0, 3)) {
      lines.push(`  - ${title}`);
    }
  }
  lines.push(``, `Saved audit: ${snap.reportUrl}`, ``);
  return lines;
}

// ----------------------------------------------------------------------------
// Annual re-audit (12-month anniversary) email
// ----------------------------------------------------------------------------

interface AnniversaryArgs {
  to: string;
  firstName: string;
  vehicleLabel: string;
  /** Pre-formatted date the original upload was made, e.g. "15 Feb 2026". */
  originalAuditDate: string;
  /** Where customers go to start the fresh review. */
  reviewUrl: string;
  /** One-click unsubscribe URL (signed token, sub id). */
  unsubscribeUrl: string;
  /** Optional carry-forward — same shape as the renewal-reminder. */
  previousAudit?: PreviousAuditSnapshot;
}

/**
 * Annual anniversary nudge — sent ~12 months after the customer
 * uploaded their policy, regardless of policy-expiry timing. Acts as
 * a belt-and-braces reminder for customers whose parsed policy-expiry
 * date is unreliable or who never opted into renewal reminders.
 *
 * Distinct from renewal-reminder so Gmail's classifier learns the
 * two streams separately and so the copy can sit further from the
 * expiry-date frame ("it's been a year" rather than "you have N days").
 */
export async function sendAnniversaryAuditEmail({
  to,
  firstName,
  vehicleLabel,
  originalAuditDate,
  reviewUrl,
  unsubscribeUrl,
  previousAudit,
}: AnniversaryArgs): Promise<void> {
  const subject = `${vehicleLabel} insurance — it's been a year`;
  const html = renderAnniversaryHtml({
    firstName,
    vehicleLabel,
    originalAuditDate,
    reviewUrl,
    unsubscribeUrl,
    previousAudit,
  });
  const text = renderAnniversaryText({
    firstName,
    vehicleLabel,
    originalAuditDate,
    reviewUrl,
    unsubscribeUrl,
    previousAudit,
  });

  const { error } = await client().emails.send({
    from: REMINDER_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) {
    throw new Error(`Resend (anniversary) failed: ${error.message}`);
  }
}

function renderAnniversaryHtml({
  firstName,
  vehicleLabel,
  originalAuditDate,
  reviewUrl,
  unsubscribeUrl,
  previousAudit,
}: Omit<AnniversaryArgs, "to">): string {
  const auditBlock = previousAudit
    ? renderPreviousAuditHtml(previousAudit)
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    It's been a year since your ${escape(vehicleLabel)} audit. Time for a fresh look.
  </div>
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Annual re-audit &middot;
    </div>

    <p style="margin:0 0 18px;">Hi ${escape(firstName)},</p>

    <p style="margin:0 0 18px;">It&rsquo;s been a year since I last read your <em style="font-style:italic;color:#3a1e3d;">${escape(
      vehicleLabel
    )}</em> policy &mdash; the original audit was ${escape(
      originalAuditDate
    )}. A lot can shift in twelve months: insurer terms, your driving pattern, the market.</p>

    ${auditBlock}

    <p style="margin:0 0 18px;">If you&rsquo;ve renewed since (or are about to), drop the latest policy and I&rsquo;ll run a fresh audit. Same as last time &mdash; free, two minutes, no sales calls.</p>

    <p style="margin:0 0 18px;"><a href="${escape(
      reviewUrl
    )}" style="color:#3a1e3d;">${escape(reviewUrl)}</a></p>

    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>

    <hr style="margin:36px 0 22px;border:none;border-top:1px solid #e6e4e8;" />

    <p style="margin:0 0 14px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PS &middot; If this landed in Promotions or Spam, drag it to Primary or add <strong style="color:#1a1218;">hello@rightoffer.in</strong> to your contacts.
    </p>
    <p style="margin:0;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PPS &middot; Don&rsquo;t want these? <a href="${escape(
        unsubscribeUrl
      )}" style="color:#6b6571;">Unsubscribe here</a> and I&rsquo;ll stop.
    </p>
  </div>
</body></html>`;
}

function renderAnniversaryText({
  firstName,
  vehicleLabel,
  originalAuditDate,
  reviewUrl,
  unsubscribeUrl,
  previousAudit,
}: Omit<AnniversaryArgs, "to">): string {
  return [
    `· RightOffer · Annual re-audit ·`,
    ``,
    `Hi ${firstName},`,
    ``,
    `It's been a year since I last read your ${vehicleLabel} policy — the original audit was ${originalAuditDate}. A lot can shift in twelve months: insurer terms, your driving pattern, the market.`,
    ``,
    ...(previousAudit ? renderPreviousAuditText(previousAudit) : []),
    `If you've renewed since (or are about to), drop the latest policy and I'll run a fresh audit. Same as last time — free, two minutes, no sales calls.`,
    ``,
    reviewUrl,
    ``,
    `— Aryan`,
    ``,
    `———`,
    ``,
    `PS · If this landed in Promotions or Spam, drag it to Primary or add hello@rightoffer.in to your contacts.`,
    ``,
    `PPS · Don't want these? Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}

// ----------------------------------------------------------------------------
// Inbound-forward reply (K6) — customer forwarded a policy to review@,
// the audit pipeline ran in the background, this is the editorial reply
// that closes the loop with the PDF attached and a magic-link to view.
//
// Key UX difference from sendReportEmail:
//   - Subject acknowledges the forward they just did
//   - Body opens with "Just read your <vehicle> policy" — Aryan-perspective
//   - The "view on web" link is a magic-link that auto-signs them in
//     (no OTP needed; the forward IS the verification)
//   - DPDP consent line included since this is their first inbound contact
//   - PDF attached
// ----------------------------------------------------------------------------

interface InboundReplyArgs {
  to: string;
  firstName?: string;
  vehicleLabel: string;
  /** Magic-link URL — auto-signs the customer in and lands them on
   *  /report/[id]. From buildAuditMagicLinkUrl. */
  magicLinkUrl: string;
  /** Pre-rendered audit PDF — attached to the email. */
  pdf: Buffer;
  /** Whether this is the customer's first audit with us. When true,
   *  the reply includes the DPDP consent line. Subsequent audits skip
   *  the line to avoid every reply reading like a fresh-onboarding
   *  email. */
  includeDpdpConsentLine: boolean;
}

export async function sendInboundAuditReply({
  to,
  firstName,
  vehicleLabel,
  magicLinkUrl,
  pdf,
  includeDpdpConsentLine,
}: InboundReplyArgs): Promise<void> {
  const subject = `${vehicleLabel} audit ready`;

  const html = renderInboundReplyHtml({
    firstName,
    vehicleLabel,
    magicLinkUrl,
    includeDpdpConsentLine,
  });
  const text = renderInboundReplyText({
    firstName,
    vehicleLabel,
    magicLinkUrl,
    includeDpdpConsentLine,
  });

  const { error } = await client().emails.send({
    from: INBOUND_REPLY_FROM,
    // Reply-To stays hello@ so a "thanks Aryan" reply lands in the
    // human mailbox, NOT in the review@ webhook (which would try to
    // audit the thank-you as if it were a policy).
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: "rightoffer-motor-insurance-review.pdf",
        content: pdf,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend (inbound-reply) failed: ${error.message}`);
  }
}

function renderInboundReplyHtml({
  firstName,
  vehicleLabel,
  magicLinkUrl,
  includeDpdpConsentLine,
}: Omit<InboundReplyArgs, "to" | "pdf">): string {
  const greeting = firstName ? `Hi ${escape(firstName)},` : "Hi there,";
  const dpdpLine = includeDpdpConsentLine
    ? `<p style="margin:0 0 14px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      &middot; By forwarding to RightOffer you&rsquo;ve consented to us processing this document. Reply with the word DELETE to remove your data.
    </p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Your ${escape(vehicleLabel)} audit is attached, with a one-click link to view it on the web.
  </div>
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Audit ready &middot;
    </div>

    <p style="margin:0 0 18px;">${greeting}</p>

    <p style="margin:0 0 18px;">Thanks for forwarding your policy. I just read every line of your <em style="font-style:italic;color:#3a1e3d;">${escape(vehicleLabel)}</em> cover &mdash; the audit is attached as a PDF, and you can also view it on the web with one click below. No password needed; the link signs you in.</p>

    <p style="margin:0 0 18px;"><a href="${escape(magicLinkUrl)}" style="color:#3a1e3d;">View your full audit &rarr;</a></p>

    <p style="margin:0 0 18px;font-style:italic;color:#6b6571;">If you have a renewal quote, just forward it here next &mdash; I&rsquo;ll re-read it the same way.</p>

    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>

    <hr style="margin:36px 0 22px;border:none;border-top:1px solid #e6e4e8;" />

    ${dpdpLine}
    <p style="margin:0 0 14px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PS &middot; If this landed in Promotions or Spam, drag it to Primary or add <strong style="color:#1a1218;">review@rightoffer.in</strong> to your contacts so future audits arrive cleanly.
    </p>
    <p style="margin:0;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PPS &middot; The link above is valid for seven days. If it expires, just forward your policy again and I&rsquo;ll send a fresh one.
    </p>
  </div>
</body></html>`;
}

// ----------------------------------------------------------------------------
// Inbound-forward MULTI-AUDIT reply (K11) — sent when a forward yields
// 2+ audited PDFs. One consolidated email per forward with all audit
// PDFs attached (descriptively named), one magic-link landing on the
// /reports tabbed view so the customer can switch between docs side-
// by-side. Body content adapts to the doc landscape.
// ----------------------------------------------------------------------------

export interface InboundMultiAuditAttachment {
  /** Vehicle make+model — used in the body line for this audit. */
  vehicleLabel: string;
  /** Whether this audit is for a bound policy or an unbound quote. */
  documentType: "policy" | "quote";
  /** Insurer name (e.g. "Tata AIG") — used for filename + body line. */
  insurerName: string;
  /** OD period end year (e.g. 2024) — used for filename disambiguation
   *  when multiple docs share the same insurer + documentType. */
  yearLabel: string;
}

/** Audit-flavoured comparator summary for inline rendering in the
 *  multi-audit reply. Computed by the caller (the inbound webhook
 *  has access to the parsed policies + reports); we just render. */
export interface InboundComparatorSummary {
  /** "Audi A6" — used in the section heading. */
  vehicleLabel: string;
  /** Required add-on names, in display order. */
  requiredAddOns: string[];
  /** Optional add-on names, in display order. */
  optionalAddOns: string[];
  /** ~₹2,400/yr — pre-formatted INR for the required-addons-total. */
  requiredAddOnsPremiumLabel: string;
  /** Recommended IDV, pre-formatted (e.g. "₹8.5L"). */
  idvLabel: string;
  /** Per-doc scores, in display order. */
  scores: Array<{
    /** "Policy" or "Renewal quote" — display label for this doc. */
    roleLabel: string;
    /** "Tata AIG" — insurer name. */
    insurerName: string;
    /** "2024" — year for disambiguation. */
    yearLabel: string;
    /** "₹14,500" — pre-formatted premium. */
    premiumLabel: string;
    /** Add-on names this doc is missing vs RCP. */
    missingRequired: string[];
    /** True when this doc covers everything required. */
    isRcpComplete: boolean;
  }>;
  /** Plain-English verdict shown after the scores table. */
  verdictHeadline: string;
  verdictBody: string;
}

/** A document from the customer's forward that we couldn't process
 *  (rejected by the classifier, or unreadable scan). Surfaced in the
 *  reply body as a "couldn't process" bullet list so the customer
 *  isn't left guessing why fewer docs came back than they sent. */
export interface ExcludedDocSummary {
  filename: string;
  reason: string;
}

interface InboundMultiReplyArgs {
  to: string;
  firstName?: string;
  /** All audited docs from this forward, in arrival order. Metadata
   *  + individual-report magic-links. No PDF buffers — one master
   *  PDF replaces N per-doc attachments. */
  audits: InboundMultiAuditAttachment[];
  /** Magic-link to the master /reports comparison view. */
  magicLinkUrl: string;
  /** The single master PDF — comparator + annexures inline. Replaces
   *  the previous "N per-doc PDFs" pattern. */
  masterPdf: Buffer;
  /** Filename for the master PDF, descriptively built from the
   *  vehicle label. e.g. "Audi A6 — comparison.pdf". */
  masterPdfFilename: string;
  includeDpdpConsentLine: boolean;
  /** When present, the email body renders a "Side-by-side" section
   *  with the comparator data. Omitted when comparator computation
   *  failed; the email still ships with the master PDF + magic-link. */
  comparator?: InboundComparatorSummary;
  /** Per-doc exclusion info — docs from the same forward we couldn't
   *  audit. Rendered as a "Couldn't process" bullet list. Empty
   *  array (or omitted) when every doc made it through. */
  excludedDocs?: ExcludedDocSummary[];
}

export async function sendInboundMultiAuditReply({
  to,
  firstName,
  audits,
  magicLinkUrl,
  masterPdf,
  masterPdfFilename,
  includeDpdpConsentLine,
  comparator,
  excludedDocs,
}: InboundMultiReplyArgs): Promise<void> {
  if (audits.length < 2) {
    throw new Error(
      "sendInboundMultiAuditReply requires 2+ audits. Use sendInboundAuditReply for single."
    );
  }

  // Subject summarises the doc landscape briefly.
  const subject = buildMultiAuditSubject(audits);

  const html = renderInboundMultiReplyHtml({
    firstName,
    audits,
    magicLinkUrl,
    includeDpdpConsentLine,
    comparator,
    excludedDocs,
  });
  const text = renderInboundMultiReplyText({
    firstName,
    audits,
    magicLinkUrl,
    includeDpdpConsentLine,
    comparator,
    excludedDocs,
  });

  const { error } = await client().emails.send({
    from: INBOUND_REPLY_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: masterPdfFilename,
        content: masterPdf,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend (inbound-multi) failed: ${error.message}`);
  }
}

/** Subject reflects what the customer forwarded.
 *  Common patterns:
 *    - "Audi A6 policy + renewal quote audits ready"  (1 policy + 1 quote, same vehicle)
 *    - "Audi A6 audits ready (3 docs)"                (mixed, same vehicle)
 *    - "Your 3 audits are ready"                       (mixed vehicles)
 */
function buildMultiAuditSubject(
  audits: InboundMultiAuditAttachment[]
): string {
  // Group by vehicle — if all same, mention it; otherwise stay generic.
  const vehicles = new Set(audits.map((a) => a.vehicleLabel));
  const singleVehicle = vehicles.size === 1;
  const sample = audits[0];

  if (!singleVehicle) {
    return `Your ${audits.length} audits are ready`;
  }

  const policies = audits.filter((a) => a.documentType === "policy").length;
  const quotes = audits.filter((a) => a.documentType === "quote").length;

  // Classic "policy + renewal quote" pair
  if (policies === 1 && quotes === 1) {
    return `${sample.vehicleLabel} policy + renewal quote audits ready`;
  }
  // All quotes
  if (policies === 0 && quotes >= 2) {
    return `${sample.vehicleLabel} quote comparison ready (${quotes} quotes)`;
  }
  // Multiple policies (old + new etc.)
  if (policies >= 2 && quotes === 0) {
    return `${sample.vehicleLabel} policy comparison ready`;
  }
  // Anything mixed
  return `${sample.vehicleLabel} audits ready (${audits.length} docs)`;
}

/** Descriptive master-PDF filename built from the vehicle label.
 *  e.g. "Audi A6 - comparison.pdf". Sanitised to letters/digits/spaces/
 *  hyphens only. Used by the inbound webhook when building the
 *  master-PDF attachment. */
export function buildMasterPdfFilename(vehicleLabel: string): string {
  const vehicle = sanitizeForFilename(vehicleLabel) || "Vehicle";
  return `${vehicle} - comparison.pdf`;
}

function sanitizeForFilename(s: string): string {
  return (s ?? "")
    .replace(/[^A-Za-z0-9 \-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** "Couldn't process" section — surfaces docs the customer forwarded
 *  but we couldn't audit (wrong vehicle class, scanned image, non-
 *  motor PDF). Lists each by filename with a short, plain reason so
 *  the customer isn't left wondering why fewer audits came back than
 *  docs they sent.
 *
 *  Returns empty string when there's nothing to surface. */
function renderExcludedDocsHtml(
  excluded: ExcludedDocSummary[] | undefined
): string {
  if (!excluded || excluded.length === 0) return "";
  const items = excluded
    .map(
      (d) =>
        `<li style="margin:0 0 4px;">
          <strong style="color:#1a1218;">${escape(d.filename)}</strong> &mdash;
          <span style="color:#6b6571;">${escape(d.reason)}</span>
        </li>`
    )
    .join("");
  return `<div style="margin:0 0 22px;padding:14px 16px;border-left:3px solid #b78611;background:#fffaf0;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#b78611;font-weight:700;margin:0 0 8px;">
      &middot; Couldn&rsquo;t process &middot;
    </div>
    <p style="margin:0 0 8px;font-size:14.5px;">
      ${
        excluded.length === 1
          ? "One of the attachments didn't make it through the audit:"
          : `${excluded.length} of the attachments didn't make it through the audit:`
      }
    </p>
    <ul style="margin:0 0 6px 22px;padding:0;color:#1a1218;font-size:14px;">${items}</ul>
    <p style="margin:6px 0 0;font-size:13px;font-style:italic;color:#6b6571;">If any of these should have been included, try forwarding again or upload directly at <a href="https://rightoffer.in/upload" style="color:#3a1e3d;">rightoffer.in/upload</a>.</p>
  </div>`;
}

function renderExcludedDocsText(
  excluded: ExcludedDocSummary[] | undefined
): string[] {
  if (!excluded || excluded.length === 0) return [];
  const lines: string[] = [
    ``,
    `· Couldn't process ·`,
    excluded.length === 1
      ? `One of the attachments didn't make it through the audit:`
      : `${excluded.length} of the attachments didn't make it through the audit:`,
  ];
  for (const d of excluded) {
    lines.push(`  · ${d.filename} — ${d.reason}`);
  }
  lines.push(
    `If any of these should have been included, try forwarding again or upload directly at https://rightoffer.in/upload.`
  );
  return lines;
}

/** Comparator section, inline in the multi-audit reply. Mono kicker
 *  + serif body matching the rest of the editorial template. Returns
 *  empty string when no comparator data was passed in. */
function renderComparatorSectionHtml(
  comparator: InboundComparatorSummary | undefined
): string {
  if (!comparator) return "";
  const required = comparator.requiredAddOns.length
    ? comparator.requiredAddOns.map(escape).join(", ")
    : "None — your existing policy already covers what's recommended";
  const scoresRows = comparator.scores
    .map((s) => {
      const missing = s.isRcpComplete
        ? `<span style="color:#4a7a3f;">covers everything recommended</span>`
        : `missing ${escape(s.missingRequired.join(", "))}`;
      return `<tr>
        <td style="padding:4px 8px 4px 0;vertical-align:top;"><strong>${escape(s.roleLabel)}</strong></td>
        <td style="padding:4px 8px 4px 0;vertical-align:top;">${escape(s.insurerName)}${s.yearLabel ? ` &middot; ${escape(s.yearLabel)}` : ""}</td>
        <td style="padding:4px 8px 4px 0;vertical-align:top;text-align:right;">${escape(s.premiumLabel)}</td>
        <td style="padding:4px 0;vertical-align:top;font-style:italic;color:#6b6571;">${missing}</td>
      </tr>`;
    })
    .join("");
  return `<div style="margin:24px 0 22px;padding:14px 16px;border-left:3px solid #3a1e3d;background:#f7f4f7;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3a1e3d;font-weight:700;margin:0 0 12px;">
      &middot; Side-by-side &middot;
    </div>
    <p style="margin:0 0 8px;font-size:14.5px;"><strong>Recommended cover for your ${escape(comparator.vehicleLabel)}:</strong></p>
    <p style="margin:0 0 6px;font-size:14px;color:#1a1218;">Required add-ons (~${escape(comparator.requiredAddOnsPremiumLabel)}/yr): ${required}</p>
    ${
      comparator.optionalAddOns.length
        ? `<p style="margin:0 0 12px;font-size:14px;color:#6b6571;">Optional: ${escape(comparator.optionalAddOns.join(", "))}</p>`
        : ""
    }
    <p style="margin:0 0 12px;font-size:14px;color:#6b6571;">Recommended IDV: ${escape(comparator.idvLabel)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:6px 0 14px;">${scoresRows}</table>
    <p style="margin:8px 0 4px;font-size:14.5px;font-style:italic;color:#3a1e3d;"><strong>${escape(comparator.verdictHeadline)}</strong></p>
    <p style="margin:0;font-size:14px;color:#1a1218;">${escape(comparator.verdictBody)}</p>
  </div>`;
}

function renderComparatorSectionText(
  comparator: InboundComparatorSummary | undefined
): string[] {
  if (!comparator) return [];
  const lines: string[] = [
    ``,
    `· Side-by-side ·`,
    ``,
    `Recommended cover for your ${comparator.vehicleLabel}:`,
    `  Required add-ons (~${comparator.requiredAddOnsPremiumLabel}/yr): ${
      comparator.requiredAddOns.length
        ? comparator.requiredAddOns.join(", ")
        : "None — your existing policy already covers what's recommended"
    }`,
  ];
  if (comparator.optionalAddOns.length) {
    lines.push(`  Optional: ${comparator.optionalAddOns.join(", ")}`);
  }
  lines.push(`  Recommended IDV: ${comparator.idvLabel}`);
  lines.push(``);
  for (const s of comparator.scores) {
    const missing = s.isRcpComplete
      ? "covers everything recommended"
      : `missing ${s.missingRequired.join(", ")}`;
    const yearBit = s.yearLabel ? ` · ${s.yearLabel}` : "";
    lines.push(
      `  ${s.roleLabel} · ${s.insurerName}${yearBit} · ${s.premiumLabel} · ${missing}`
    );
  }
  lines.push(``, `Verdict: ${comparator.verdictHeadline}`);
  lines.push(comparator.verdictBody);
  return lines;
}

function renderInboundMultiReplyHtml({
  firstName,
  audits,
  magicLinkUrl,
  includeDpdpConsentLine,
  comparator,
  excludedDocs,
}: Omit<
  InboundMultiReplyArgs,
  "to" | "masterPdf" | "masterPdfFilename"
>): string {
  const greeting = firstName ? `Hi ${escape(firstName)},` : "Hi there,";
  const totalSent = audits.length + (excludedDocs?.length ?? 0);
  // Opener pivots straight to the button — the comparator is the
  // proof below it, not a wall the customer has to scroll past first.
  const opener = `Thanks for forwarding ${
    totalSent === 2 ? "both documents" : `all ${totalSent} documents`
  }. I read ${audits.length === 1 ? "one of them" : `${audits.length} of them`} and put together a side-by-side comparison. The full audit is attached as a PDF — and you can open the interactive web version with the button below (no password needed, the link signs you in).`;

  const excludedSection = renderExcludedDocsHtml(excludedDocs);

  // List items — one per audit, metadata only.
  // No per-doc magic-links: the customer follows the SINGLE master
  // link below, which lands on /reports with a tab per document. One
  // entry point keeps the email clean and the journey simple.
  const items = audits
    .map((a) => {
      const role =
        a.documentType === "quote"
          ? "Renewal quote"
          : "Policy";
      const yearBit = a.yearLabel ? ` &middot; ${escape(a.yearLabel)}` : "";
      return `<li style="margin:0 0 8px;">
        <strong style="color:#1a1218;">${escape(role)}</strong> &middot;
        ${escape(a.vehicleLabel)} &middot; ${escape(a.insurerName)}${yearBit}
      </li>`;
    })
    .join("");

  // Real button — bulletproof table-cell pattern with bg colour on
  // the <td> (works in Outlook/Gmail/Apple Mail). The plain-text link
  // version was getting absorbed into the surrounding prose and
  // collapsed under Gmail's "..." trimmer.
  const ctaButton = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 8px;">
      <tr>
        <td style="background-color:#3a1e3d;border-radius:8px;padding:14px 26px;text-align:center;">
          <a href="${escape(magicLinkUrl)}" style="color:#ffffff;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;display:inline-block;line-height:1;">
            Open all audits side-by-side &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      Link valid 7 days. If it expires, forward your documents again and I&rsquo;ll send a fresh one.
    </p>`;

  // Small-print footer — all sits ABOVE the signature so Gmail has
  // nothing to trim under "— Aryan" (which is the last line of the
  // message). No <hr/>, no PS/PPS — those patterns are exactly what
  // trigger the "..." trimmer in Gmail.
  const dpdpLine = includeDpdpConsentLine
    ? `<p style="margin:0 0 8px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      &middot; By forwarding to RightOffer you&rsquo;ve consented to us processing these documents. Reply with the word DELETE to remove your data.
    </p>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${audits.length} audits attached, plus a side-by-side comparison view at the link below.
  </div>
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Audits ready &middot;
    </div>

    <p style="margin:0 0 18px;">${greeting}</p>

    <p style="margin:0 0 18px;">${escape(opener)}</p>

    <p style="margin:0 0 6px;">What you forwarded:</p>
    <ul style="margin:0 0 18px 22px;padding:0;color:#1a1218;">${items}</ul>

    ${excludedSection}

    ${ctaButton}

    ${renderComparatorSectionHtml(comparator)}

    ${dpdpLine}
    <p style="margin:0 0 22px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      If this landed in Promotions or Spam, drag it to Primary or add <strong style="color:#1a1218;">review@rightoffer.in</strong> to your contacts so future audits arrive cleanly.
    </p>

    <p style="margin:0;font-style:italic;">&mdash; Aryan</p>
  </div>
</body></html>`;
}

function renderInboundMultiReplyText({
  firstName,
  audits,
  magicLinkUrl,
  includeDpdpConsentLine,
  comparator,
  excludedDocs,
}: Omit<
  InboundMultiReplyArgs,
  "to" | "masterPdf" | "masterPdfFilename"
>): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const totalSent = audits.length + (excludedDocs?.length ?? 0);
  const lines = [
    `· RightOffer · Audits ready ·`,
    ``,
    greeting,
    ``,
    `Thanks for forwarding ${
      totalSent === 2 ? "both documents" : `all ${totalSent} documents`
    }. I read ${audits.length === 1 ? "one of them" : `${audits.length} of them`} and put together a side-by-side comparison. The full audit is attached as a PDF — and you can open the interactive web version at the link below (no password needed, the link signs you in).`,
    ``,
    `What you forwarded:`,
  ];
  for (const a of audits) {
    const role = a.documentType === "quote" ? "Renewal quote" : "Policy";
    const yearBit = a.yearLabel ? ` · ${a.yearLabel}` : "";
    lines.push(
      `  · ${role} · ${a.vehicleLabel} · ${a.insurerName}${yearBit}`
    );
  }
  // Excluded docs, if any.
  lines.push(...renderExcludedDocsText(excludedDocs));
  // CTA + validity note — moved ABOVE the comparator so the action is
  // immediately visible and not buried under the inline summary.
  lines.push(
    ``,
    `→ Open all audits side-by-side: ${magicLinkUrl}`,
    `  Link valid 7 days. If it expires, forward your documents again and I'll send a fresh one.`
  );
  // Comparator summary, if provided.
  lines.push(...renderComparatorSectionText(comparator));
  // Footer small-print — sits ABOVE the signature so "— Aryan" is the
  // last line of the message and Gmail has nothing to clip below it.
  lines.push(``);
  if (includeDpdpConsentLine) {
    lines.push(
      `· By forwarding to RightOffer you've consented to us processing these documents. Reply with the word DELETE to remove your data.`
    );
  }
  lines.push(
    `If this landed in Promotions or Spam, drag it to Primary or add review@rightoffer.in to your contacts so future audits arrive cleanly.`,
    ``,
    `— Aryan`
  );
  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// Rate-limit reply — sent when a customer exceeds the per-sender
// forward limit. Editorial, non-punitive — explains the window and
// invites them to try again later or use the web upload.
// ----------------------------------------------------------------------------

interface RateLimitReplyArgs {
  to: string;
  /** Pre-formatted summary the email body can reference. */
  window: "hour" | "day";
}

export async function sendRateLimitReplyEmail({
  to,
  window,
}: RateLimitReplyArgs): Promise<void> {
  const subject = "About what you forwarded — try again shortly";
  const windowLabel = window === "hour" ? "hour" : "day";

  const html = `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Review desk &middot;
    </div>
    <p style="margin:0 0 18px;">Hi,</p>
    <p style="margin:0 0 18px;">Thanks for forwarding &mdash; you&rsquo;ve sent us a few documents in a short window and we&rsquo;ve hit a small rate limit. Just a guardrail against accidental forward-loops; nothing to worry about.</p>
    <p style="margin:0 0 18px;">Wait an ${escape(windowLabel)} and forward again, and I&rsquo;ll read it then. Or skip the queue entirely by uploading directly at <a href="https://rightoffer.in/upload" style="color:#3a1e3d;">rightoffer.in/upload</a>.</p>
    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>
  </div>
</body></html>`;

  const text = [
    `· RightOffer · Review desk ·`,
    ``,
    `Hi,`,
    ``,
    `Thanks for forwarding — you've sent us a few documents in a short window and we've hit a small rate limit. Just a guardrail against accidental forward-loops; nothing to worry about.`,
    ``,
    `Wait an ${windowLabel} and forward again, and I'll read it then. Or skip the queue entirely by uploading directly at https://rightoffer.in/upload.`,
    ``,
    `— Aryan`,
  ].join("\n");

  const { error } = await client().emails.send({
    from: INBOUND_REPLY_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    throw new Error(`Resend (rate-limit) failed: ${error.message}`);
  }
}

// ----------------------------------------------------------------------------
// Holding reply — sent when the audit pipeline goes into retry territory
// (transient LLM / infra failure on the first attempt). Tells the
// customer their forward landed, the audit is taking a bit longer than
// usual, and the real audit will arrive when it's ready. Never asks them
// to do anything — the system retries on their behalf.
// ----------------------------------------------------------------------------

interface HoldingReplyArgs {
  to: string;
}

export async function sendHoldingReplyEmail({
  to,
}: HoldingReplyArgs): Promise<void> {
  const subject = "We've received your documents — audit on its way";

  const html = `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Review desk &middot;
    </div>
    <p style="margin:0 0 18px;">Hi,</p>
    <p style="margin:0 0 18px;">Thanks for forwarding your documents &mdash; they&rsquo;ve landed safely and the audit is being put together.</p>
    <p style="margin:0 0 18px;">Usually this lands in your inbox within a couple of minutes. We&rsquo;re taking a bit longer on this one &mdash; nothing to worry about, just a busy moment on our side. You don&rsquo;t need to do anything; the audit will arrive when it&rsquo;s ready.</p>
    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>
  </div>
</body></html>`;

  const text = [
    `· RightOffer · Review desk ·`,
    ``,
    `Hi,`,
    ``,
    `Thanks for forwarding your documents — they've landed safely and the audit is being put together.`,
    ``,
    `Usually this lands in your inbox within a couple of minutes. We're taking a bit longer on this one — nothing to worry about, just a busy moment on our side. You don't need to do anything; the audit will arrive when it's ready.`,
    ``,
    `— Aryan`,
  ].join("\n");

  const { error } = await client().emails.send({
    from: INBOUND_REPLY_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    throw new Error(`Resend (holding-reply) failed: ${error.message}`);
  }
}

// ----------------------------------------------------------------------------
// Permanent-failure reply — sent when the audit pipeline has exhausted
// all queue retries (rare, but real for hard infra issues). The customer
// gets a calm, human-toned message saying our team's on it; the founder
// gets paged separately via Sentry / log alert so the follow-up is real.
// ----------------------------------------------------------------------------

interface PermanentFailureReplyArgs {
  to: string;
}

export async function sendPermanentFailureReplyEmail({
  to,
}: PermanentFailureReplyArgs): Promise<void> {
  const subject = "About your forward — we're looking into it";

  const html = `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Review desk &middot;
    </div>
    <p style="margin:0 0 18px;">Hi,</p>
    <p style="margin:0 0 18px;">We received the documents you forwarded but ran into a snag we couldn&rsquo;t recover from on our side. Nothing to do with what you sent &mdash; this is on us.</p>
    <p style="margin:0 0 18px;">Our team has been notified and we&rsquo;ll follow up with you directly within 24 hours, either with the audit or with a clear next step. You don&rsquo;t need to forward anything again.</p>
    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>
  </div>
</body></html>`;

  const text = [
    `· RightOffer · Review desk ·`,
    ``,
    `Hi,`,
    ``,
    `We received the documents you forwarded but ran into a snag we couldn't recover from on our side. Nothing to do with what you sent — this is on us.`,
    ``,
    `Our team has been notified and we'll follow up with you directly within 24 hours, either with the audit or with a clear next step. You don't need to forward anything again.`,
    ``,
    `— Aryan`,
  ].join("\n");

  const { error } = await client().emails.send({
    from: INBOUND_REPLY_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    throw new Error(`Resend (permanent-failure-reply) failed: ${error.message}`);
  }
}

// ----------------------------------------------------------------------------
// Inbound-forward NO-MATCH reply (K5) — sent when a customer forwarded
// something to review@ but none of the attachments qualify as a motor
// policy or quote. Same editorial voice as the success reply; different
// content: courteously explains what we couldn't do and what to try next.
// No PDF attachment.
// ----------------------------------------------------------------------------

/** Why the forward didn't yield an audit. Drives the opening line of
 *  the polite reply so it can be specific where possible. */
export type InboundNoMatchReason =
  | { kind: "no-pdf" }
  | { kind: "not-a-policy" }
  | { kind: "wrong-vehicle-class"; vehicleClass: string }
  | { kind: "scanned-image" };

interface InboundNoMatchArgs {
  to: string;
  firstName?: string;
  reason: InboundNoMatchReason;
  includeDpdpConsentLine: boolean;
}

export async function sendInboundNoMatchReply({
  to,
  firstName,
  reason,
  includeDpdpConsentLine,
}: InboundNoMatchArgs): Promise<void> {
  // Subject deliberately non-alarming and non-spammy. No exclamation,
  // no "OOPS", no "ERROR". The customer did nothing wrong — we just
  // couldn't help with what they sent.
  const subject = "About what you forwarded";

  const html = renderInboundNoMatchHtml({
    firstName,
    reason,
    includeDpdpConsentLine,
  });
  const text = renderInboundNoMatchText({
    firstName,
    reason,
    includeDpdpConsentLine,
  });

  const { error } = await client().emails.send({
    from: INBOUND_REPLY_FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend (inbound-no-match) failed: ${error.message}`);
  }
}

/** Editorial copy for each non-match reason. Single source of truth so
 *  HTML + text renderers stay in sync. */
function noMatchOpener(reason: InboundNoMatchReason): string {
  switch (reason.kind) {
    case "no-pdf":
      return "Thanks for sending that across — but I couldn't find any PDF attachment in what you forwarded. If you have your policy or renewal quote as a file, try forwarding the email it arrived in (the one from your insurer with the PDF attached).";
    case "not-a-policy":
      return "Thanks for forwarding that. I had a careful look, but what you sent doesn't seem to be a motor insurance policy or renewal quote. If you intended to send one and it's still in your inbox, try forwarding the original insurer email.";
    case "wrong-vehicle-class":
      return `Thanks for forwarding that. What you sent looks like a ${reason.vehicleClass} policy — we only review private four-wheeler insurance right now. If you have a car policy, send that across and I'll read it the same way.`;
    case "scanned-image":
      return "Thanks for forwarding that. The PDF looks like a scanned image, which I can't read yet — I need a text-PDF that your insurer typically issues by email or via their app. Try pulling the original digital copy rather than a scan and forward it again.";
  }
}

function renderInboundNoMatchHtml({
  firstName,
  reason,
  includeDpdpConsentLine,
}: Omit<InboundNoMatchArgs, "to">): string {
  const greeting = firstName ? `Hi ${escape(firstName)},` : "Hi there,";
  const opener = escape(noMatchOpener(reason));
  const dpdpLine = includeDpdpConsentLine
    ? `<p style="margin:0 0 14px;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      &middot; By forwarding to RightOffer you&rsquo;ve consented to us processing this document. Reply with the word DELETE to remove your data.
    </p>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1218;">
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Couldn't find a motor policy or quote in your forward. Try forwarding the original insurer email.
  </div>
  <div style="max-width:560px;">
    <div style="font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b9d80;font-weight:700;margin:0 0 22px;">
      &middot; RightOffer &middot; Review desk &middot;
    </div>

    <p style="margin:0 0 18px;">${greeting}</p>

    <p style="margin:0 0 18px;">${opener}</p>

    <p style="margin:0 0 18px;">You can also drop the policy directly at <a href="https://rightoffer.in/upload" style="color:#3a1e3d;">rightoffer.in/upload</a> if forwarding is awkward &mdash; same audit, same Aryan.</p>

    <p style="margin:28px 0 0;font-style:italic;">&mdash; Aryan</p>

    <hr style="margin:36px 0 22px;border:none;border-top:1px solid #e6e4e8;" />

    ${dpdpLine}
    <p style="margin:0;font-family:Menlo,Consolas,'SF Mono',monospace;font-size:11px;color:#6b6571;line-height:1.6;">
      PS &middot; If this landed in Promotions or Spam, drag it to Primary or add <strong style="color:#1a1218;">review@rightoffer.in</strong> to your contacts so future replies arrive cleanly.
    </p>
  </div>
</body></html>`;
}

function renderInboundNoMatchText({
  firstName,
  reason,
  includeDpdpConsentLine,
}: Omit<InboundNoMatchArgs, "to">): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  return [
    `· RightOffer · Review desk ·`,
    ``,
    greeting,
    ``,
    noMatchOpener(reason),
    ``,
    `You can also drop the policy directly at https://rightoffer.in/upload if forwarding is awkward — same audit, same Aryan.`,
    ``,
    `— Aryan`,
    ``,
    `———`,
    ``,
    ...(includeDpdpConsentLine
      ? [
          `· By forwarding to RightOffer you've consented to us processing this document. Reply with the word DELETE to remove your data.`,
          ``,
        ]
      : []),
    `PS · If this landed in Promotions or Spam, drag it to Primary or add review@rightoffer.in to your contacts.`,
  ].join("\n");
}

function renderInboundReplyText({
  firstName,
  vehicleLabel,
  magicLinkUrl,
  includeDpdpConsentLine,
}: Omit<InboundReplyArgs, "to" | "pdf">): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  return [
    `· RightOffer · Audit ready ·`,
    ``,
    greeting,
    ``,
    `Thanks for forwarding your policy. I just read every line of your ${vehicleLabel} cover — the audit is attached as a PDF, and you can also view it on the web with one click below. No password needed; the link signs you in.`,
    ``,
    `View your full audit: ${magicLinkUrl}`,
    ``,
    `If you have a renewal quote, just forward it here next — I'll re-read it the same way.`,
    ``,
    `— Aryan`,
    ``,
    `———`,
    ``,
    ...(includeDpdpConsentLine
      ? [
          `· By forwarding to RightOffer you've consented to us processing this document. Reply with the word DELETE to remove your data.`,
          ``,
        ]
      : []),
    `PS · If this landed in Promotions or Spam, drag it to Primary or add review@rightoffer.in to your contacts.`,
    ``,
    `PPS · The link above is valid for seven days. If it expires, just forward your policy again and I'll send a fresh one.`,
  ].join("\n");
}
