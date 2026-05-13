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
  const subject = `${code} is your RightOffer OTP`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8F9FA;font-family:Inter,system-ui,sans-serif;color:#2D3436;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F9FA;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="480" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#0A2463,#247BA0);padding:22px 24px;color:#fff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">RightOffer</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px;line-height:1.2;">Verify your email</div>
        </td></tr>
        <tr><td style="padding:28px 24px;text-align:center;">
          <p style="margin:0 0 16px;font-size:14px;color:#636e72;line-height:1.5;">Use this one-time code to get your full policy review by email:</p>
          <div style="display:inline-block;padding:14px 22px;background:#F8F9FA;border-radius:12px;border:2px dashed #0A2463;font-family:'SFMono-Regular',Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:0.4em;color:#0A2463;">
            ${escape(code)}
          </div>
          <p style="margin:18px 0 0;font-size:12px;color:#636e72;line-height:1.55;">
            Valid for 10 minutes. Do not share this code with anyone.
          </p>
        </td></tr>
        <tr><td style="padding:14px 24px;background:#F8F9FA;border-top:1px solid #E9ECEF;font-size:11px;color:#636e72;text-align:center;">
          RightOffer · Independent motor insurance reviews
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `${code} is your RightOffer OTP.`,
    ``,
    `Use this code to verify your email and get your full policy review.`,
    `Valid for 10 minutes. Do not share with anyone.`,
    ``,
    `— Team RightOffer`,
  ].join("\n");

  const { error } = await client().emails.send({
    from: FROM,
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
