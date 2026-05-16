/* eslint-disable react/no-unescaped-entities */
/**
 * /privacy — RightOffer privacy policy (V1 draft).
 *
 * Generic Indian-context copy aligned with the Digital Personal Data
 * Protection Act, 2023 (DPDP Act). Marked as a draft at the top — the
 * final policy will be reviewed by counsel before public launch.
 *
 * Layout: Reading Room editorial typography but minimal — no sketches,
 * no carousels. Long-form readable prose with mono section markers.
 *
 * ESLint's `react/no-unescaped-entities` rule is disabled at the top of
 * this file because the prose contains many straight quotes that read
 * naturally in source — escaping each one would make the policy harder
 * to maintain. The browser renders them correctly either way.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How RightOffer collects, uses, stores, and shares your personal information when you use our motor insurance review service. Compliant with India's DPDP Act, 2023.",
};

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-8">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
          · Reading Room ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
          Privacy <span className="italic text-brand-plum">Policy</span>
        </h1>
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
          Last updated · {updated}
          <span className="text-brand-plum"> · Draft </span>
          (pending legal review)
        </p>
      </header>

      <div className="space-y-8 leading-[1.7] text-[16.5px]">
        <Section number="i." title="What this policy covers">
          This policy describes how <strong>RightOffer Reviews Private
          Limited</strong> ("we", "us", "RightOffer") collects, uses,
          stores, and shares your personal information when you use{" "}
          <Link
            href="/"
            className="italic text-brand-plum hover:underline"
          >
            rightoffer.in
          </Link>{" "}
          and the related motor insurance review service. We operate from
          India and process personal data in accordance with the{" "}
          <em className="italic">Digital Personal Data Protection Act,
          2023</em> (the "DPDP Act").
        </Section>

        <Section number="ii." title="What we collect">
          We collect only what we need to read your policy and deliver a
          review:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Your motor insurance document">
              uploaded as a PDF. Stored encrypted; only our parser reads
              its contents.
            </Item>
            <Item label="Email address and (optionally) WhatsApp number">
              used to deliver your review and a sign-in link. Never sold
              or shared.
            </Item>
            <Item label="Vehicle details">
              make, model, year, registration number, IDV. Extracted from
              the document; used to anchor your review.
            </Item>
            <Item label="Basic usage data">
              pages visited, time spent, anonymised event logs. Used to
              improve the product.
            </Item>
          </ul>
        </Section>

        <Section number="iii." title="What we don't collect">
          We do not collect: your government ID numbers (PAN, Aadhaar),
          your bank account details, your credit-card information, your
          income, your medical history, your location beyond city/PIN,
          or any biometric data. The review service does not require any
          of these and we will never ask for them.
        </Section>

        <Section number="iv." title="How we use your data">
          We use your data exclusively to:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Generate and deliver your policy review">
              including the recommendations, gap analysis, and renewal
              quotes that appear in your report.
            </Item>
            <Item label="Send delivery notifications">
              the review itself, magic sign-in links, and (only if you
              opt in) renewal reminders.
            </Item>
            <Item label="Improve the parser and product">
              aggregated and anonymised — we never sell or share
              personally-identifying data with third parties.
            </Item>
          </ul>
          We do <strong>not</strong> use your data to make sales calls,
          push insurance products to you, or share with insurers without
          your explicit consent.
        </Section>

        <Section number="v." title="Who we share with">
          We share your data only with infrastructure providers that help
          us run the service — under strict contractual confidentiality
          obligations:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Hosting and database">
              Vercel (USA) and Upstash (Singapore region) for serving the
              site and storing your account.
            </Item>
            <Item label="Email delivery">
              Resend, for transactional messages.
            </Item>
            <Item label="Parsing">
              OpenAI / Anthropic APIs to extract structured data from
              your policy. Documents are sent without identifying you to
              the AI provider; outputs are stored in our database only.
            </Item>
          </ul>
          Where any provider is outside India, we ensure adequate data
          protection by contract. If we ever change providers we will
          update this list.
        </Section>

        <Section number="vi." title="Your rights under the DPDP Act">
          You have the right to:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Access">
              request a copy of all personal data we hold about you.
            </Item>
            <Item label="Correct">
              update inaccurate or out-of-date personal data.
            </Item>
            <Item label="Erase">
              ask us to delete your account and all uploaded documents.
              We will delete within 30 days unless retention is required
              by law (e.g. tax or fraud-investigation purposes).
            </Item>
            <Item label="Withdraw consent">
              for marketing emails, WhatsApp delivery, or any optional
              data use.
            </Item>
            <Item label="Grievance">
              raise a complaint about how we handle your data.
            </Item>
          </ul>
          To exercise any of these, email{" "}
          <a
            href="mailto:hello@rightoffer.in"
            className="italic text-brand-plum hover:underline"
          >
            hello@rightoffer.in
          </a>{" "}
          with the subject line "Data request". We aim to respond within
          7 working days.
        </Section>

        <Section number="vii." title="How long we keep data">
          Uploaded policy documents are retained for{" "}
          <strong>12 months</strong> from upload, after which they're
          automatically purged. Account data (email, vehicle history) is
          retained for as long as the account is active, plus 12 months
          after closure for fraud and audit purposes. You can request
          earlier deletion at any time.
        </Section>

        <Section number="viii." title="Security">
          Documents are encrypted in transit (TLS 1.2+) and at rest. Our
          databases sit behind authenticated APIs. We follow industry
          best practices for access controls, secret rotation, and
          incident response. In the event of a personal-data breach
          affecting you, we will notify you and the Data Protection Board
          within the timelines required by the DPDP Act.
        </Section>

        <Section number="ix." title="Cookies">
          We use a small number of first-party cookies for sign-in
          sessions and basic product analytics. We do not run third-party
          ad-tracking cookies, retargeting pixels, or behavioural
          profiling.
        </Section>

        <Section number="x." title="Changes to this policy">
          If we make material changes to this policy we will email
          existing users and post a notice at the top of this page for
          30 days. Continued use of the service after a notice period
          implies acceptance.
        </Section>

        <Section number="xi." title="Contact">
          For any privacy question, write to{" "}
          <a
            href="mailto:hello@rightoffer.in"
            className="italic text-brand-plum hover:underline"
          >
            hello@rightoffer.in
          </a>
          . Our (designated grievance officer's) name and contact will be
          added here once incorporated; until then, all queries land in
          the founder's inbox and are answered personally.
        </Section>
      </div>

      <footer className="mt-12 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link
          href="/"
          className="text-brand-plum hover:underline"
        >
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-serif italic font-medium text-[22px] text-brand-plum tracking-[-0.01em]">
          {number}
        </span>
        <h2 className="font-serif font-semibold text-xl md:text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
          {title}
        </h2>
      </div>
      <div className="text-brand-slate text-[16px] leading-[1.7]">
        {children}
      </div>
    </section>
  );
}

function Item({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="pl-4 border-l-2 border-brand-sage/40">
      <strong className="font-serif font-semibold text-brand-charcoal">
        {label}
      </strong>{" "}
      — {children}
    </li>
  );
}
