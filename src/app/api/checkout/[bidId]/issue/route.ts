import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  findById,
  appendRow,
  findOne,
  Tables,
} from "@/lib/db";
import { generateRenewalSchedule } from "@/lib/renewal-cadence";
import type {
  Bid,
  ParsedPolicy,
  RFQ,
  Transaction,
  RenewalSchedule,
} from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const { bidId } = await params;

    const bid = await findById<Bid>(Tables.BIDS, bidId);
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }
    const rfq = await findById<RFQ>(Tables.RFQS, bid.rfqId);
    if (!rfq) {
      return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    }
    const parsedPolicy = await findById<ParsedPolicy>(
      Tables.PARSED_POLICIES,
      rfq.parsedPolicyId
    );
    if (!parsedPolicy) {
      return NextResponse.json(
        { error: "Parsed policy not found" },
        { status: 404 }
      );
    }

    // Idempotency: if a transaction already exists for this bid, return it
    const existing = await findOne<Transaction>(
      Tables.TRANSACTIONS,
      (t) => t.bidId === bidId
    );
    if (existing) {
      return NextResponse.json({
        transactionId: existing.id,
        status: existing.status,
      });
    }

    // Create the transaction record
    const now = new Date();
    const transaction: Transaction = {
      id: randomUUID(),
      rfqId: rfq.id,
      bidId: bid.id,
      userId: "demo-user", // Mockup — would be real user id in production
      status: "issued",
      policyDocUrl: `/policy/__placeholder__`, // Filled below
      createdAt: now.toISOString(),
      issuedAt: now.toISOString(),
    };
    transaction.policyDocUrl = `/policy/${transaction.id}`;
    await appendRow<Transaction>(Tables.TRANSACTIONS, transaction);

    // Generate the renewal schedule (12 months from issuance)
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);
    expiry.setHours(23, 59, 59);
    const schedule = generateRenewalSchedule(
      parsedPolicy,
      expiry.toISOString()
    );
    await appendRow<RenewalSchedule>(
      Tables.RENEWAL_SCHEDULES,
      schedule
    );

    return NextResponse.json({
      transactionId: transaction.id,
      policyDocUrl: transaction.policyDocUrl,
      renewalScheduleId: schedule.id,
    });
  } catch (err) {
    console.error("[issue] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown error during issuance",
      },
      { status: 500 }
    );
  }
}
