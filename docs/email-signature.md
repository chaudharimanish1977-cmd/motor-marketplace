# Email signature — RightOffer house style

Editorial signature for outbound emails from `hello@rightoffer.in` (or
any other founder / staff inbox replying to customers).

The HTML lives in `email-signature.html`. Paste it into your mail
client's signature settings.

## What it looks like

```
│ Aryan
│ · YOUR RIGHTOFFER ADVISOR ·

r RightOffer CAR

Independent motor insurance review — in two minutes, by email.
Forward your policy to review@rightoffer.in for an audit.
No sign-up. No call-spam.
─────────────────────────────────────────────
RIGHTOFFER.IN · ABOUT · PRIVACY · TERMS
```

Plum left-rule on the byline · italic plum *Aryan* · mono small-caps
sub-byline · inline wordmark (italic plum `r` + small-caps `RightOffer`
+ sage `CAR` pill) · serif copy · mono link row in the footer.

## Install per mail client

### Gmail (web)

1. Open `email-signature.html` in any browser (double-click in Finder)
2. Select all the rendered signature (Cmd/Ctrl+A inside the rendered
   area between the markers — NOT the raw source)
3. Copy (Cmd/Ctrl+C)
4. Gmail → top-right ⚙ → **See all settings** → **General** tab
5. Scroll to **Signature** → **+ Create new** → name it "RightOffer"
6. Paste into the editor (signature retains formatting)
7. Set as default for **new emails** and **on reply / forward**
8. Save at the bottom of the page

### Titan Mail (GoDaddy / hello@rightoffer.in)

1. Sign in at <https://app.titan.email>
2. Settings (gear icon) → **Account** → **Signatures**
3. Click **Add signature** → name it "RightOffer"
4. Switch to **HTML mode** (toggle at the top of the editor)
5. Paste the raw HTML from `email-signature.html` (between the
   SIGNATURE-BEGIN / SIGNATURE-END markers — NOT the comments)
6. Switch back to visual mode to verify it renders cleanly
7. Set as default for the `hello@rightoffer.in` mailbox
8. Save

### Apple Mail (macOS)

1. Open `email-signature.html` in Safari (or any browser)
2. Select the rendered signature (NOT the raw HTML)
3. Copy
4. Mail → **Settings** → **Signatures**
5. Pick `hello@rightoffer.in` in the left column
6. Click **+** to create a new signature, name it "RightOffer"
7. Paste into the editor (right pane)
8. Uncheck **Always match my default message font** so the serif font
   survives
9. Set this signature as the default for the account

### Outlook (desktop or web)

1. Outlook → **File** → **Options** → **Mail** → **Signatures**
2. **New** → name it "RightOffer"
3. Edit in HTML mode (Outlook desktop has an HTML-edit option per
   signature; web client uses a rich-text editor that accepts pasted
   HTML)
4. Paste the HTML
5. Set as default for new messages + replies

## Verifying the signature

Send a test email to your personal Gmail and an Outlook address.
Open the rendered email and check:

- Plum left rule on the byline is visible
- *Aryan* is italic and plum-coloured
- Wordmark inline shows italic *r* + RightOffer small-caps + sage CAR
  pill
- Body copy is serif (Georgia)
- Mono link row in the footer
- All hyperlinks work (rightoffer.in, About, Privacy, Terms,
  mailto:review@rightoffer.in)
- Renders cleanly at desktop AND mobile inbox widths

## Updating

If the signature evolves (e.g. add a phone number, swap CTA, etc.),
edit `email-signature.html` in this repo, copy the new HTML, replace
the signature in every mail client. Don't have one source of truth
out of sync with the others.

## Customisation

The file has a commented-out optional "Sent by Manish Chaudhari,
Founder & CEO" line at the bottom. Uncomment and edit if you want
the signature to identify the actual sender in addition to Aryan.

Most outbound replies should keep the editorial Aryan-only byline —
customers recognise the audit voice. Identify yourself as a person
only when the situation calls for it (escalation, recruiting,
investor reply).
