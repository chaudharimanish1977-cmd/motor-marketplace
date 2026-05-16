/* eslint-disable react/no-unescaped-entities */
/**
 * /terms — RightOffer terms of use (V1 draft).
 *
 * Generic Indian-context copy. Marked as draft at the top — final
 * terms will be reviewed by counsel before public launch.
 *
 * Layout: matches /privacy. Reading Room editorial typography but
 * minimal — no sketches, no carousels. Long-form readable prose with
 * mono section markers.
 *
 * `react/no-unescaped-entities` is disabled file-wide so the prose can
 * use straight quotes naturally — see the matching note in
 * src/app/privacy/page.tsx.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that govern your use of RightOffer's motor insurance review service.",
};

export default function TermsPage() {
  const updated = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      <header className="border-b border-brand-charcoal/15 pb-5 mb-8">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
          · Reading Room ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
          Terms of <span className="italic text-brand-plum">Use</span>
        </h1>
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
          Last updated · {updated}
          <span className="text-brand-plum"> · Draft </span>
          (pending legal review)
        </p>
      </header>

      <div className="space-y-8 leading-[1.7] text-[16.5px]">
        <Section number="i." title="What RightOffer is">
          RightOffer is an independent <em className="italic">policy
          review</em> service for Indian motor insurance customers. We
          read your policy, identify gaps, and help you make a more
          informed decision at renewal. We are not an insurer, an
          intermediary appointed by an insurer, or a regulated insurance
          broker. Nothing on this site constitutes regulated insurance
          advice under the Insurance Act, 1938 or IRDAI regulations.
        </Section>

        <Section number="ii." title="Who can use it">
          You must be at least 18 years old and competent to enter into
          a contract under Indian law. The service is intended for
          private (non-commercial) motor insurance customers in India.
          Use of the service for commercial fleet policies or non-Indian
          insurance is outside V1 scope and at your own risk.
        </Section>

        <Section number="iii." title="What you agree to">
          When you use RightOffer you agree to:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Provide accurate information">
              the document you upload must be your own genuine motor
              policy. Don't upload someone else's document without their
              consent.
            </Item>
            <Item label="Use the review responsibly">
              our review is informational. Final purchase decisions —
              including which insurer to renew with, which add-ons to
              buy, and at what premium — are yours alone.
            </Item>
            <Item label="Not abuse the service">
              no scraping, no automated uploads, no attempts to reverse-
              engineer our parser or APIs.
            </Item>
          </ul>
        </Section>

        <Section number="iv." title="The review is advisory, not financial advice">
          We give you{" "}
          <em className="italic">a structured reading of your existing
          policy</em>{" "}
          and pointers on common gaps. We do not:
          <ul className="mt-3 space-y-2 list-none pl-0">
            <Item label="Recommend specific insurance products">
              by name as if we were a broker. Where we surface offers
              from partner insurers, we say so clearly and the choice is
              yours.
            </Item>
            <Item label="Guarantee claim outcomes">
              insurers settle claims under their own contracts and
              regulatory framework. Our review can highlight what looks
              risky; it cannot promise an insurer will pay.
            </Item>
            <Item label="Replace professional advice">
              for complex situations (commercial vehicles, group
              policies, pending claims, legal disputes) please consult a
              licensed broker or your insurer directly.
            </Item>
          </ul>
        </Section>

        <Section number="v." title="Fees">
          The policy review service is currently <strong>free</strong> to
          end users. We do not charge for the report itself.
          <br />
          <br />
          When you choose to renew through a partner insurer surfaced in
          our marketplace, we may earn a commission from that insurer —
          this is disclosed on the offer page itself. The commission
          structure does not affect the review.
        </Section>

        <Section number="vi." title="Intellectual property">
          The RightOffer name, wordmark, illustrations, copy, and the
          structure of the report are our intellectual property. Your
          uploaded document and the personal data in it remain yours;
          we hold them under the terms of our{" "}
          <Link
            href="/privacy"
            className="italic text-brand-plum hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </Section>

        <Section number="vii." title="Liability">
          The service is provided "as is". To the maximum extent
          permitted by Indian law, our total liability for any direct
          loss arising from your use of the service is capped at the
          fees you paid us (which, for V1, is zero). We are not liable
          for indirect, incidental, or consequential losses including
          lost premium savings, claim denials, or future insurance
          costs. Nothing in these terms limits liability for fraud,
          wilful misconduct, or anything that cannot be limited under
          Indian law.
        </Section>

        <Section number="viii." title="Termination">
          You can close your account at any time by emailing{" "}
          <a
            href="mailto:hello@rightoffer.in"
            className="italic text-brand-plum hover:underline"
          >
            hello@rightoffer.in
          </a>
          . We can suspend or terminate accounts that violate these
          terms, on reasonable notice except where immediate action is
          warranted (e.g. fraud, security risk).
        </Section>

        <Section number="ix." title="Changes to these terms">
          We may update these terms from time to time. Material changes
          will be announced by email and via a notice on this page for
          30 days. Continued use after the notice period implies
          acceptance.
        </Section>

        <Section number="x." title="Governing law">
          These terms are governed by Indian law. Any dispute will be
          subject to the exclusive jurisdiction of the courts at
          Bengaluru, Karnataka. If you have a complaint, please contact
          us first at{" "}
          <a
            href="mailto:hello@rightoffer.in"
            className="italic text-brand-plum hover:underline"
          >
            hello@rightoffer.in
          </a>{" "}
          — most issues are resolved within a working week.
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
