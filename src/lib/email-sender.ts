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

    <p style="margin:0 0 18px;font-style:italic;color:#6b6571;">Spot something off, or just have a question? Reply to this email — a real human reads every one.</p>

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
    `Spot something off, or just have a question? Reply to this email — a real human reads every one.`,
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
  });
  const text = renderReminderText({
    firstName,
    vehicleLabel,
    expiryDate,
    daysUntilExpiry,
    reviewUrl,
    unsubscribeUrl,
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
}: Omit<ReminderArgs, "to">): string {
  const dayWord = daysUntilExpiry === 1 ? "day" : "days";

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

    <p style="margin:0 0 18px;">When your renewal quote arrives, drop it back here and I&rsquo;ll review this year&rsquo;s cover &mdash; the gaps, what&rsquo;s worth keeping, and what to ask your insurer for.</p>

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
}: Omit<ReminderArgs, "to">): string {
  const dayWord = daysUntilExpiry === 1 ? "day" : "days";
  return [
    `· RightOffer · Renewal reminder ·`,
    ``,
    `Hi ${firstName},`,
    ``,
    `Quick note — your ${vehicleLabel} insurance is up for renewal on ${expiryDate}, which is ${daysUntilExpiry} ${dayWord} away.`,
    ``,
    `When your renewal quote arrives, drop it back here and I'll review this year's cover — the gaps, what's worth keeping, and what to ask your insurer for.`,
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
