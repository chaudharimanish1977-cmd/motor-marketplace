/**
 * /how-it-works/engineer — technical / architecture view.
 *
 * Counterpart to /how-it-works (English customer narrative). Shows the
 * actual machinery — full system architecture, all customer-journey
 * paths (Phase 1 + marketplace) on one flowchart, the data validation
 * pipeline, and a current-vs-future stack table. Built for investors
 * doing technical due diligence and engineers joining the team.
 *
 * Demo-gated, same as the customer view. Linked from /investor +
 * round-trip from /how-it-works.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isMarketplaceEnabled } from "@/lib/feature-flags";
import { BrandBlobs } from "@/components/brand-blobs";
import { MermaidDiagram } from "@/components/mermaid-diagram";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "How RightOffer works — engineer view",
  robots: { index: false, follow: false },
};

// ============================================================================
// Diagrams
// ============================================================================

const SYSTEM_ARCHITECTURE = `flowchart TB
    Customer([Customer])

    subgraph Entry["Entry points"]
      direction LR
      Web["/upload (web)"]
      Email["review@rightoffer.in"]
    end

    Customer -->|Web upload| Web
    Customer -->|Email forward| Email

    Email --> Postmark["Postmark Inbound<br/>signature-verified"]
    Postmark --> InboundAPI["/api/inbound/email<br/>(Next.js route)"]

    InboundAPI --> QStash["Upstash QStash<br/>durable queue"]
    QStash --> Worker["/api/jobs/audit-forward<br/>(worker)"]

    Web --> Parse["/api/parse<br/>(direct sync path)"]

    Worker --> Pipeline["Audit pipeline"]
    Parse --> Pipeline

    subgraph Pipeline["Audit pipeline (src/lib/audit-pipeline.ts)"]
      direction TB
      Extract["PDF text extract<br/>pdf-parse"]
      Classify["Doc + vehicle classifier<br/>Anthropic Claude"]
      ParseLLM["Structured field parse<br/>Anthropic Claude"]
      Generate["Report generator<br/>Anthropic Claude"]
      Extract --> Classify --> ParseLLM --> Generate
    end

    Pipeline --> KV[("Upstash KV<br/>ParsedPolicy, PolicyReport,<br/>User, RenewalSubscription,<br/>ShareToken")]
    Pipeline --> Blob[("Vercel Blob<br/>original PDFs<br/>+ generated PDFs")]

    KV --> Render["Puppeteer + Chromium<br/>PDF render (master report)"]
    Render --> Resend["Resend<br/>transactional outbound"]
    Resend --> Customer

    KV --> Cron["Vercel Cron<br/>renewal-reminders, annual-reaudit,<br/>admin-dashboard"]
    Cron --> Resend

    Pipeline -.->|errors| Sentry["Sentry<br/>error tracking"]
    Worker -.->|errors| Sentry
    InboundAPI -.->|errors| Sentry

    classDef edge fill:#f7f4f7,stroke:#3a1e3d,stroke-width:2px
    classDef store fill:#eef2ec,stroke:#8b9d80,stroke-width:2px
    classDef ext fill:#fafafa,stroke:#6b6571,stroke-width:1.5px
    class Web,Email,InboundAPI,Parse,Worker edge
    class KV,Blob store
    class Postmark,QStash,Resend,Sentry ext`;

const CUSTOMER_JOURNEY = `flowchart LR
    Start([Customer])

    Start --> Channel{Channel}
    Channel -->|Web| Upload["/upload"]
    Channel -->|Email| Forward["Forward to<br/>review@rightoffer.in"]

    Upload --> Pipe[Parse + Audit pipeline]
    Forward --> Pipe

    Pipe --> Class{Doc class}
    Class -->|2-wheeler<br/>commercial| Reject1["Polite reject reply"]
    Class -->|Scanned image| Reject2["Couldn't-read reply"]
    Class -->|Policy / Quote| Report["/report/[id]<br/>+ PDF email"]

    Report --> Verify{Verified?}
    Verify -->|No| Gate["OTP gate or<br/>Google OAuth"]
    Gate --> Sub
    Verify -->|Yes| Sub[In-report renewal chip]
    Report -->|Email magic link| Sub

    Sub --> Active[("Active<br/>RenewalSubscription")]
    Active --> CronTick["Daily cron 10:00 IST"]
    CronTick --> Check{60 / 30 / 7 days<br/>before expiry?}
    Check -->|Yes| Remind["Reminder email"]
    Check -->|No| Wait[Wait next tick]

    Remind --> Returns[Customer forwards<br/>renewal quote]
    Returns --> Pipe

    Report -.->|Phase 2: MARKETPLACE CTA| Bundle["/bid/[id]<br/>Bundle Builder"]
    Bundle --> Auction["Bid orchestrator<br/>(3-tier sourcing)"]
    Auction --> Tiers[Basic / Recommended /<br/>Super Cover bids]
    Tiers --> Offer["/offer/[bidId]<br/>Customize + Buy"]
    Offer --> Checkout["/checkout<br/>3-screen KYC + payment"]
    Checkout --> Policy["/policy/[id]<br/>policy issued"]
    Policy --> RenewCal["/renewals/[id]<br/>renewal calendar"]
    RenewCal -.->|next year| Returns

    classDef start fill:#3a1e3d,stroke:#3a1e3d,color:#ffffff,stroke-width:2px
    classDef reject fill:#fef2f2,stroke:#dc2626,stroke-width:1.5px
    classDef mp fill:#eef2ec,stroke:#8b9d80,stroke-width:2px
    class Start start
    class Reject1,Reject2 reject
    class Bundle,Auction,Tiers,Offer,Checkout,Policy,RenewCal mp`;

const VALIDATION_PIPELINE = `flowchart TB
    In[Inbound PDF]

    In --> Size{Size ≤ 10 MB?}
    Size -->|No| RejSize["Reject:<br/>file too large"]
    Size -->|Yes| Extract[Extract text]

    Extract --> Chars{≥ 200 chars?}
    Chars -->|No| Scanned["Reject:<br/>scanned image"]
    Chars -->|Yes| DocClass[Document classifier<br/>policy / quote / reject]

    DocClass --> Vehicle{Vehicle class}
    Vehicle -->|2-wheeler| Rej2W["Reject:<br/>not supported in V1"]
    Vehicle -->|Commercial| RejCV["Reject:<br/>commercial outside scope"]
    Vehicle -->|Private 4-wheeler| Parse[Parse structured fields]

    Parse --> Conf{Parse confidence}
    Conf -->|Low| Flag["Save with<br/>low-confidence flag"]
    Conf -->|Medium / High| Save[Save ParsedPolicy]

    Save --> Rate{Per-sender<br/>rate limit}
    Rate -->|> 5/hr or > 20/day| Throttle["Skip downstream<br/>(courteous reply)"]
    Rate -->|OK| Spam{Spam domain?}
    Spam -->|Yes| BlockSpam["Drop silently"]
    Spam -->|No| DPDP{DPDP consent<br/>given?}

    DPDP -->|No, web flow| Stamp1["Stamp at upload<br/>(consent line shown)"]
    DPDP -->|No, email flow| Stamp2["Stamp via affirmative<br/>forward action"]
    DPDP -->|Yes| Audit[Generate audit report]

    Stamp1 --> Audit
    Stamp2 --> Audit

    Audit --> Magic{Magic-link click?}
    Magic -->|Yes| Verify{HMAC valid<br/>+ not expired?}
    Verify -->|No| BlockToken["404 — generic<br/>'link expired' page"]
    Verify -->|Yes| Session[Set ro-session cookie]
    Magic -->|No| Done[Report + PDF email out]

    Session --> Done

    classDef reject fill:#fef2f2,stroke:#dc2626,stroke-width:1.5px
    classDef gate fill:#fff7ed,stroke:#ea580c,stroke-width:1.5px
    classDef ok fill:#eef2ec,stroke:#8b9d80,stroke-width:2px
    class RejSize,Scanned,Rej2W,RejCV,Throttle,BlockSpam,BlockToken reject
    class Size,Chars,Vehicle,Conf,Rate,Spam,DPDP,Magic,Verify gate
    class Save,Audit,Session,Done ok`;

// ============================================================================
// Current vs future stack
// ============================================================================

interface StackRow {
  layer: string;
  current: string;
  future: string;
}

const STACK_TABLE: StackRow[] = [
  {
    layer: "Hosting / Edge",
    current: "Vercel (global edge)",
    future: "Vercel + AWS Mumbai (multi-region failover)",
  },
  {
    layer: "Compute",
    current: "Next.js serverless functions",
    future: "Same + dedicated workers on ECS Mumbai",
  },
  {
    layer: "Primary database",
    current: "Upstash KV (Redis-compatible)",
    future: "Postgres on AWS RDS Mumbai (multi-AZ)",
  },
  {
    layer: "Document storage",
    current: "Vercel Blob (S3-compatible)",
    future: "AWS S3 Mumbai (lifecycle + glacier)",
  },
  {
    layer: "AI parse / generate",
    current: "Anthropic Claude (US region)",
    future: "Bedrock Mumbai / Azure OpenAI India when GA",
  },
  {
    layer: "OCR (scanned PDFs)",
    current: "None — text-only PDFs",
    future: "AWS Textract Mumbai",
  },
  {
    layer: "Outbound email",
    current: "Resend",
    future: "AWS SES Mumbai (residency + cost)",
  },
  {
    layer: "Inbound email",
    current: "Postmark Inbound",
    future: "AWS SES Inbound Mumbai",
  },
  {
    layer: "Auth",
    current: "NextAuth (Google/Apple OAuth) + HMAC magic-link tokens",
    future: "Same + Auth0 / Cognito enterprise SSO option",
  },
  {
    layer: "Queue / async",
    current: "Upstash QStash (HTTP-based)",
    future: "BullMQ on managed Redis (lower per-job cost at scale)",
  },
  {
    layer: "Scheduler / cron",
    current: "Vercel Cron",
    future: "AWS EventBridge + Lambda (more granular)",
  },
  {
    layer: "Error tracking",
    current: "Sentry @sentry/nextjs",
    future: "Sentry + AWS CloudWatch (infra layer)",
  },
  {
    layer: "Product analytics",
    current: "(deferred — H1 in launch checklist)",
    future: "PostHog self-hosted on Indian region",
  },
  {
    layer: "Payment gateway",
    current: "(Phase 2: Razorpay sandbox)",
    future: "Razorpay live + PayU (redundancy)",
  },
  {
    layer: "KYC",
    current: "(Phase 2: 3-screen mock — Aadhaar / PAN / CKYC)",
    future: "Signzy / Hyperverge / Karza (BFSI-grade)",
  },
  {
    layer: "WhatsApp",
    current: "(Phase 1.6: BSP — AiSensy / Gupshup / Interakt)",
    future: "Owned WhatsApp Business Account via Meta",
  },
  {
    layer: "Insurer integration",
    current: "(Phase 2: mocked rate-cards, 5 synthetic insurers)",
    future: "Real API integrations with 5+ insurers via IRDAI broker licence",
  },
  {
    layer: "Observability + APM",
    current: "Vercel logs + Sentry",
    future: "Datadog or Vercel Observability + structured logs to S3",
  },
];

// ============================================================================

export default async function EngineerViewPage() {
  if (!(await isMarketplaceEnabled())) notFound();

  return (
    <>
      <BrandBlobs />
      <article className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 py-10 md:py-16 font-serif text-brand-charcoal">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-brand-plum font-mono uppercase tracking-[0.12em] text-[10.5px] font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Customer view
          </Link>
          <Link
            href="/investor"
            className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-brand-plum font-mono uppercase tracking-[0.12em] text-[10.5px] font-bold"
          >
            Back to demo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Masthead */}
        <header className="mb-12 pb-6 border-b border-brand-light-gray dark:border-slate-700">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
            · Engineer view · Phase 1 + Phase 2 ·
          </div>
          <h1 className="font-serif font-medium text-3xl md:text-[44px] leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
            Simple front.{" "}
            <span className="italic text-brand-plum">Complex back.</span>
          </h1>
          <p className="mt-4 font-serif italic text-[15.5px] md:text-[16.5px] text-brand-slate leading-[1.55] max-w-3xl">
            What the customer sees: a one-page upload and a clean
            audit. What sits behind it: a multi-channel inbound layer,
            a durable queue, four LLM stages, three storage tiers, a
            classifier pipeline that rejects 1,000 ways a PDF can be
            wrong, and a cron lattice keeping renewals in view. Built
            on managed infra today; mapped to AWS Mumbai-region
            equivalents as volume justifies the move.
          </p>
        </header>

        {/* ── 01 System architecture ─────────────────────────────── */}
        <Section
          number="01"
          title="System architecture"
          lead="Every service touching a customer audit, from the moment a PDF crosses the wire to the moment we send the report back."
        >
          <MermaidDiagram
            chart={SYSTEM_ARCHITECTURE}
            caption="Solid arrows = synchronous code paths. Dotted = error / observability side-channel. Storage tier (KV + Blob) sits in the middle: every pipeline write lands there, every read flows from there."
          />
        </Section>

        {/* ── 02 Customer journey ────────────────────────────────── */}
        <Section
          number="02"
          title="Customer journey — Phase 1 + Phase 2"
          lead="One flowchart covering every path. Audit-only flow (Phase 1, live today) on the left + top. Marketplace handoff (Phase 2, dark-launched on demo subdomain) drops out the right side. Renewal loop closes back at the top."
        >
          <MermaidDiagram
            chart={CUSTOMER_JOURNEY}
            caption="Plum boxes = Phase 1 surfaces in production. Sage boxes = Phase 2 marketplace surfaces, hidden by feature flag in prod, visible on demo. Red boxes = rejection paths that send a polite-and-specific email."
          />
        </Section>

        {/* ── 03 Validation pipeline ─────────────────────────────── */}
        <Section
          number="03"
          title="Data validation pipeline"
          lead="Eleven gates a document passes through before it becomes a saved audit. Each gate's reject path produces a specific customer-facing email — no silent failures."
        >
          <MermaidDiagram
            chart={VALIDATION_PIPELINE}
            caption="Amber gates = decision points. Red boxes = explicit rejection with a tailored reply. Sage boxes = success continuation. DPDP consent is captured by the action itself (forward = affirmative consent under the policy at /privacy)."
          />
        </Section>

        {/* ── 04 Stack table ─────────────────────────────────────── */}
        <Section
          number="04"
          title="Current stack — and what scales it up"
          lead="What's live in Phase 1 versus the production-target stack from the V1 spec. The migration is deliberate: ship on managed infra fast, swap to Indian-region AWS once volume + revenue justify the lift."
        >
          <div className="overflow-x-auto rounded-2xl border border-brand-light-gray dark:border-slate-700 bg-white">
            <table className="w-full text-[13.5px] leading-[1.5]">
              <thead className="bg-brand-offwhite border-b-2 border-brand-light-gray dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate w-1/4">
                    Layer
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate">
                    Current · Phase 1
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-slate">
                    Future · scale-up target
                  </th>
                </tr>
              </thead>
              <tbody>
                {STACK_TABLE.map((row, i) => (
                  <tr
                    key={row.layer}
                    className={
                      i % 2 === 1
                        ? "bg-brand-offwhite/50 border-t border-brand-light-gray dark:border-slate-700"
                        : "border-t border-brand-light-gray dark:border-slate-700"
                    }
                  >
                    <td className="px-4 py-3 font-serif font-medium text-brand-charcoal align-top">
                      {row.layer}
                    </td>
                    <td className="px-4 py-3 font-serif text-brand-charcoal align-top">
                      {row.current}
                    </td>
                    <td className="px-4 py-3 font-serif italic text-brand-slate align-top">
                      {row.future}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Closing narrative */}
        <section className="mt-16 pt-8 border-t border-brand-light-gray dark:border-slate-700">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
            · Why this shape ·
          </div>
          <p className="font-serif text-[15px] md:text-[16px] text-brand-charcoal leading-[1.65] max-w-3xl">
            The customer&rsquo;s job is to drop a PDF and read the
            review. Everything else is ours. We chose managed infra
            (Vercel + Upstash + Resend + Postmark + Anthropic) so a
            solo founder can hold the whole stack in their head and
            ship in days, not quarters. The migration path to AWS
            Mumbai is mapped — but only triggered when volume + revenue
            make it the cheaper option. Phase 1 has runway to{" "}
            <span className="italic text-brand-plum">~5,000 audits a day</span>{" "}
            on the current shape; the future stack picks up at scale 10
            and beyond.
          </p>
        </section>

        <footer className="mt-12 pt-6 border-t border-brand-light-gray dark:border-slate-700 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
          <Link
            href="/how-it-works"
            className="text-brand-plum hover:underline"
          >
            ← Customer view
          </Link>
          {" · "}
          <Link
            href="/investor"
            className="text-brand-plum hover:underline"
          >
            Demo home
          </Link>
          {" · "}
          <Link
            href="/admin/dashboard"
            className="text-brand-plum hover:underline"
          >
            Live dashboard
          </Link>
        </footer>
      </article>
    </>
  );
}

function Section({
  number,
  title,
  lead,
  children,
}: {
  number: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-sage">
          · {number} ·
        </span>
        <h2 className="font-serif font-semibold text-xl md:text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
          {title}
        </h2>
      </div>
      <p className="font-serif italic text-[14.5px] text-brand-slate leading-[1.55] max-w-3xl mb-2">
        {lead}
      </p>
      {children}
    </section>
  );
}
