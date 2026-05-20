/* eslint-disable react/no-unescaped-entities */
/**
 * /privacy — RightOffer privacy policy (V1 draft).
 *
 * Generic Indian-context copy aligned with the Digital Personal Data
 * Protection Act, 2023 (DPDP Act). Marked as a draft at the top — the
 * final policy will be reviewed by counsel before public launch.
 *
 * Layout: editorial typography but minimal — no sketches,
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
          · RightOffer · Privacy ·
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
              the PDF of your policy or renewal quote — sent to us
              either by uploading it directly at{" "}
              <Link
                href="/upload"
                className="italic text-brand-plum hover:underline"
              >
                rightoffer.in/upload
              </Link>{" "}
              or by forwarding the email containing it to{" "}
              <a
                href="mailto:review@rightoffer.in"
                className="italic text-brand-plum hover:underline"
              >
                review@rightoffer.in
              </a>
              . Either action is treated as your affirmative consent to
              process the document. Stored encrypted; only our parser
              reads its contents.
            </Item>
            <Item label="Email address and (optionally) WhatsApp number">
              used to deliver your review and a sign-in link. Never sold.
            </Item>
            <Item label="Name and profile information from Google or Apple">
              if you choose to sign in via those providers, we receive
              your verified email and name. We do not access your contacts,
              calendar, files, or anything else from those accounts.
            </Item>
            <Item label="Vehicle details">
              make, model, variant, year, registration number, IDV, NCB,
              premium breakdown, add-ons, policy period, insurer, owner
              name and address. Extracted from the document you upload;
              used to anchor your review.
            </Item>
            <Item label="Your answers to optional product questions">
              past claims, parking habits, renewal priorities, and similar
              context — collected only when you choose to answer them
              during the review flow.
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
              context that appear in your report.
            </Item>
            <Item label="Send delivery notifications">
              the review itself, sign-in codes and magic-link sign-in
              emails, and (only if you opt in) renewal reminders ~45
              days before your policy expires.
            </Item>
            <Item label="Improve the parser and product">
              aggregated and anonymised. We never sell or share
              personally-identifying data with third parties.
            </Item>
            <Item label="Match you with insurer partners — coming soon">
              when our renewal marketplace launches, we will ask for
              your explicit, granular consent before sharing your policy
              context with any insurer partner. The audit you receive
              today does not depend on this and we do not share your
              data with insurers today.
            </Item>
          </ul>
          We do <strong>not</strong> use your data to make sales calls,
          push insurance products to you, or share with insurers without
          your explicit consent.
        </Section>

        <Section number="iv-a." title="What we'll ask you separately for">
          As we expand our services, we may want to use your existing
          data for new purposes. We will always ask you for separate,
          explicit consent before doing so:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Additional insurance verticals (e.g. health)">
              when we launch a new vertical, we'll surface a fresh
              consent screen specific to it before processing any new
              data type.
            </Item>
            <Item label="Broader financial services improvements">
              we may build adjacent services in lending or investments
              over time. Any use of your data to power those services
              will require your further, explicit consent at the time
              such service launches.
            </Item>
            <Item label="Anonymised aggregate insights for partners">
              we may share aggregate statistics (e.g. "X% of Audi A6
              policies in Delhi miss engine-protection cover") with
              insurer partners, regulators, or researchers. This data
              is anonymised and never traceable back to you.
            </Item>
          </ul>
        </Section>

        <Section number="v." title="Who we share with">
          We share your data only with infrastructure providers that help
          us run the service — under strict contractual confidentiality
          obligations:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Hosting and database">
              Vercel and Upstash for serving the site and storing your
              account.
            </Item>
            <Item label="Email delivery">
              Resend, for transactional outbound messages (your review,
              sign-in codes, renewal reminders, and replies when you
              forward a policy to us).
            </Item>
            <Item label="Inbound email processing">
              Postmark, for receiving emails forwarded to{" "}
              <a
                href="mailto:review@rightoffer.in"
                className="italic text-brand-plum hover:underline"
              >
                review@rightoffer.in
              </a>
              . Postmark parses the email and hands the attachment to our
              servers; it does not retain the document long-term.
            </Item>
            <Item label="Sign-in via Google or Apple">
              only when you choose to use those providers; we receive
              your verified email and name from them. We do not push
              data the other way.
            </Item>
            <Item label="AI parsing and review generation">
              Anthropic (Claude) to extract structured data from your
              policy and to compose the editorial review. Documents are
              sent without sales calls / marketing data; outputs are
              stored in our database only.
            </Item>
          </ul>
          We work to keep your personal data on servers located in India.
          Where a sub-processor cannot offer Indian-region availability
          today (notably the AI provider used for parsing), we ensure
          adequate data protection by contract and we will move to
          Indian-region availability for that sub-processor as soon as
          it becomes available. We will never sell, license, or rent
          your personal data to anyone.
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
            <Item label="Port (export)">
              download a structured copy of your data — your audit, your
              uploaded policy details, and your account record — as
              machine-readable JSON. Use the export button in your /me
              portal, or write to us if you don't have an account active.
            </Item>
            <Item label="Withdraw consent">
              for renewal reminders, optional data use, or any
              forward-looking purpose. Withdrawing consent does not
              affect the lawfulness of what we did before withdrawal.
            </Item>
            <Item label="Grievance">
              raise a complaint about how we handle your data.
            </Item>
          </ul>
          Easiest route — open your{" "}
          <Link
            href="/me"
            className="italic text-brand-plum hover:underline"
          >
            /me portal
          </Link>
          's Data &amp; Consent section, where you can export and delete
          your data directly. Or email{" "}
          <a
            href="mailto:grievance@rightoffer.in"
            className="italic text-brand-plum hover:underline"
          >
            grievance@rightoffer.in
          </a>{" "}
          with the subject line "Data request". We aim to respond within
          7 working days.
        </Section>

        <Section number="vii." title="How long we keep data">
          Uploaded policy documents and your audit are retained for{" "}
          <strong>24 months</strong> from your last interaction, after
          which they are automatically purged. Account data (email,
          vehicle history) is retained for as long as the account is
          active, plus 12 months after closure for fraud and audit
          purposes. Anonymised aggregate data — which is no longer
          personal — may be retained indefinitely for product and
          regulatory research. You can request earlier deletion at any
          time, and exercising your right to erase will purge everything
          we are not legally required to keep.
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

        <Section number="xi." title="Contact + Grievance Officer">
          For any privacy question or to exercise your DPDP rights, write
          to{" "}
          <a
            href="mailto:grievance@rightoffer.in"
            className="italic text-brand-plum hover:underline"
          >
            grievance@rightoffer.in
          </a>
          .
          <br />
          <br />
          Our designated Grievance Officer's name and direct contact will
          be added here on completion of company incorporation. Until
          then, all queries land in the founder's inbox and are answered
          personally — within 7 working days for any DPDP request.
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
