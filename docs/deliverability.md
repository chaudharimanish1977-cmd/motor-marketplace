# Email deliverability — rightoffer.in posture

Operational checklist for the email side of RightOffer. Covers what should
be in place at GoDaddy (DNS) and Resend (outbound) so audit emails land in
the customer's Primary tab and the inbound forward webhook keeps working.

Run through this whenever:
- A customer reports an email landing in Promotions / Spam.
- Gmail / Outlook bounce a message with a 550 / 5.7.x code.
- We add a new outbound sender address.
- We change inbound MX (e.g. switch off Postmark Inbound).

## Quick health checks

Run these from any machine — they hit public DNS, no credentials needed.

```bash
# MX record — must point at Postmark Inbound (or whoever owns review@)
dig +short MX rightoffer.in

# SPF record — must list resend.com AND the inbound MX provider
dig +short TXT rightoffer.in | grep -i spf

# DKIM record — Resend provisions selector resend._domainkey
dig +short TXT resend._domainkey.rightoffer.in

# DMARC record — must exist with at least p=none + rua reporting
dig +short TXT _dmarc.rightoffer.in
```

Quick visual check: <https://mxtoolbox.com/SuperTool.aspx?action=mx&run=toolpage&domain=rightoffer.in>

Send a test from `hello@rightoffer.in` to:
- `check-auth@verifier.port25.com` — replies with a full SPF / DKIM / DMARC
  pass-fail report
- Your own gmail — open the message, **Show original** — verify
  `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.

## Expected DNS records at GoDaddy

### MX — inbound forwarding

Whoever owns `review@rightoffer.in` (Postmark Inbound) needs the MX. Today
we're on Postmark, so:

```
Type: MX
Host: @
Value: inbound-smtp.postmarkapp.com.   (verify against Postmark dashboard)
Priority: 10
TTL: 3600
```

If we ever switch off Postmark Inbound, this MX changes. Update before
flipping the inbound webhook over.

### SPF — outbound authentication

One SPF record only — duplicates fail SPF entirely.

```
Type: TXT
Host: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

If we add another outbound sender (e.g. AWS SES Mumbai for transactional in
V1), update this to include both:

```
v=spf1 include:_spf.resend.com include:amazonses.com ~all
```

### DKIM — outbound signing (Resend selector)

Resend provisions a selector at `resend._domainkey`. Pull the exact value
from the Resend dashboard → Domains → rightoffer.in → DNS records — it's a
long string ending in `p=...`. Reference shape:

```
Type: TXT
Host: resend._domainkey
Value: v=DKIM1; k=rsa; p=<long-public-key-from-Resend-dashboard>
TTL: 3600
```

When V1 adds AWS SES Mumbai, SES will publish *three* CNAME records (not
TXT) at `<selector>._domainkey`. Add all three exactly as the SES console
shows.

### DMARC — policy + reporting

Required for Gmail bulk-sender compliance (Feb 2024 changes). Start with
`p=none` to collect reports without enforcement; tighten to `p=quarantine`
after two weeks of clean reports.

```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@rightoffer.in; ruf=mailto:dmarc@rightoffer.in; pct=100; adkim=s; aspf=s; fo=1
TTL: 3600
```

Once reports come in clean for ~2 weeks:

```
v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@rightoffer.in; adkim=s; aspf=s
```

Eventually:

```
v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@rightoffer.in; adkim=s; aspf=s
```

**Important:** stay at `p=none` until DMARC reports confirm SPF + DKIM pass
on **100% of outbound mail across every sending source** (Resend + any
future SES / Mailgun / etc.). Jumping to `p=reject` while a single sender
fails alignment will black-hole legitimate mail.

DMARC reports are XML; route `dmarc@rightoffer.in` to a parser like
<https://dmarcian.com> or <https://postmarkapp.com/dmarc> (free tier).

### MTA-STS + TLS-RPT — optional but cheap

Reduces opportunistic-TLS downgrade and gives inbound mail providers a
formal signal we expect TLS.

```
Type: CNAME
Host: mta-sts
Value: <hosted-mta-sts-target>   (or self-host the policy file)

Type: TXT
Host: _mta-sts
Value: v=STSv1; id=2026010101;
```

Skip for V1 unless we see TLS-downgrade-related delivery issues.

## Resend dashboard checklist

- [ ] Domain `rightoffer.in` shows **Verified** under Domains.
- [ ] DKIM TXT record shows **Verified** (the `resend._domainkey` lookup
      matches Resend's stored value).
- [ ] Default sender is `hello@rightoffer.in` (replies route to it).
- [ ] Reply-To addresses include `review@rightoffer.in` for the inbound
      reply flow.
- [ ] Webhooks tab: outbound bounce + complaint webhooks pointing at
      `/api/inbound/bounce` and `/api/inbound/complaint` if implemented;
      otherwise note as a V1 ticket.
- [ ] Recent activity has no `bounce` / `complaint` rate above ~2% (Gmail
      cuts deliverability hard above 0.3% complaint).

## Postmark Inbound dashboard checklist

- [ ] Inbound stream is **active** and the webhook URL points at
      `https://rightoffer.in/api/inbound/email`.
- [ ] Webhook secret matches `POSTMARK_INBOUND_SECRET` in Vercel env.
- [ ] Recent inbound activity matches test forwards (the founder address
      + the two bypass addresses should show up if you've been testing).
- [ ] Spam threshold + size limits are sane (we accept attachments up to
      ~20 MB per PDF).

## Common bounce codes and what they mean

| Code | Likely cause | Fix |
|---|---|---|
| `550-5.7.26` / `5.7.1` | DMARC alignment failure | Verify SPF + DKIM both pass for outbound sender; check DMARC `aspf=s; adkim=s` isn't too strict if cross-domain sends are needed |
| `550-5.7.0` | Sender reputation | Outbound IP / domain reputation. Slow ramp. Check Gmail Postmaster Tools for the rightoffer.in domain reputation rating. |
| `552` / `554` content | Spammy content / attachment flagged | Re-send without the attachment; investigate what triggered (likely image-heavy or suspicious-URL content). |
| `421` deferred | Mail server temporarily refused | Self-resolves; if persistent, check inbound MX uptime. |
| Gmail "Message blocked" with no SMTP code | Outbound side spam filter | Almost always *sender-side* (sender's gmail account flagged). Test by sending from sender to a different mailbox — if that also fails, the sender account itself is flagged by Google. |

## Gmail Postmaster Tools

Sign in with the apex domain owner's Google Workspace / Gmail account at
<https://postmaster.google.com> and add `rightoffer.in`. Verify via a DNS
TXT record (Google provides the value). Then monitor:

- **Domain reputation** — should sit at *High* or *Medium*. *Low* /
  *Bad* requires reducing send volume and investigating spam complaints.
- **IP reputation** — irrelevant for us (Resend handles outbound IPs).
- **Spam rate** — keep below 0.10%. Anything sustained above 0.3% will
  start hurting Inbox placement.
- **Delivery errors** — sudden jumps usually correlate with content or
  authentication regressions.

Postmaster Tools refreshes daily; useful early-warning channel.

## What we never do (deliverability hygiene)

- Don't send marketing content from `review@rightoffer.in` — it's the
  audit-reply address. Mixing marketing + transactional on the same
  address tanks complaint rate.
- Don't put an unsubscribe link inside the audit reply email itself —
  it's a transactional message. Marketing nudges (renewal cadence in V1)
  get their own list, their own one-click unsubscribe header
  (`List-Unsubscribe: <https://...>, <mailto:...>` + `List-Unsubscribe-Post:
  List-Unsubscribe=One-Click`).
- Don't include images, tracking pixels, or external assets in the
  audit-reply HTML beyond what the template already does — keeps the
  message lightweight and Gmail-friendly.
- Don't rotate sender addresses for the same flow. Pick one,
  authenticate it, send from it.

## Ticket queue

- [ ] **V1:** set up `dmarc@rightoffer.in` mailbox and route to a DMARC
      report parser.
- [ ] **V1:** wire Resend bounce + complaint webhooks to API routes
      (`/api/inbound/bounce`, `/api/inbound/complaint`) so a single
      hard-bounce on a sender immediately marks them
      `deliveryStatus=undeliverable` on the User row.
- [ ] **V1:** add Gmail Postmaster Tools verification TXT to GoDaddy.
- [ ] **Stretch:** MTA-STS + TLS-RPT if delivery issues warrant.
