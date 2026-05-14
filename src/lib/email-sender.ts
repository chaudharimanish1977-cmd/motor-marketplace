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

const FROM = "RightOffer <hello@rightoffer.in>";
const REPLY_TO = "hello@rightoffer.in";

// OTP emails use a personal-sounding From name so Gmail is more likely to
// classify them as Primary rather than the Updates tab (where heavily-
// branded transactional emails usually land). The mailbox stays the same.
const OTP_FROM = "Aryan at RightOffer <hello@rightoffer.in>";

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
}

export async function sendReportEmail({
  to,
  vehicleLabel,
  reportUrl,
  pdf,
}: SendArgs): Promise<void> {
  const subject = `Your RightOffer policy review — ${vehicleLabel}`;
  const html = renderHtml({ vehicleLabel, reportUrl });
  const text = renderText({ vehicleLabel, reportUrl });

  const { error } = await client().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: "rightoffer-policy-review.pdf",
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
}: {
  vehicleLabel: string;
  reportUrl: string;
}): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8F9FA;font-family:Inter,system-ui,sans-serif;color:#2D3436;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F9FA;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#0A2463,#247BA0);padding:24px;color:#fff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">RightOffer</div>
          <div style="font-size:22px;font-weight:700;margin-top:6px;line-height:1.2;">Your policy review is ready</div>
          <div style="font-size:14px;opacity:0.88;margin-top:4px;">${escape(vehicleLabel)}</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">Hey Buddy,</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
            Thanks for trusting RightOffer with your policy review. Your full report is attached as a PDF you can keep, print, or forward — and the live version is always available at the link below.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${reportUrl}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:14px;font-size:15px;">View report online →</a>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#636e72;line-height:1.55;">
            Have a question about anything in the report? Just reply to this email — a real person reads every one.
          </p>
        </td></tr>
        <tr><td style="padding:18px 24px;background:#F8F9FA;border-top:1px solid #E9ECEF;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#0A2463;margin-bottom:4px;">
            Most people sell insurance. <span style="color:#FF6B35;">We help you decide.</span>
          </div>
          <div style="font-size:10px;color:#636e72;">
            RightOffer · Independent motor insurance reviews · Made for India
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText({
  vehicleLabel,
  reportUrl,
}: {
  vehicleLabel: string;
  reportUrl: string;
}): string {
  return [
    "Hey Buddy,",
    "",
    `Your full RightOffer policy review for ${vehicleLabel} is attached as a PDF.`,
    "",
    `You can also view the live version any time: ${reportUrl}`,
    "",
    "Have a question? Just reply to this email — a real person reads every one.",
    "",
    "— Team RightOffer",
    "Most people sell insurance. We help you decide.",
  ].join("\n");
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
  // the code without the user having to open the email at all.
  const subject = `Your RightOffer code: ${code}`;

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
