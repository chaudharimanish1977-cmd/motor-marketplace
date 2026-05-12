/**
 * Seed Vercel KV from the local data/db/*.json files.
 *
 * Usage:
 *   1. Provision Vercel KV (Upstash Redis) on the Vercel dashboard.
 *   2. Pull the env vars locally:    npx vercel env pull .env.local
 *   3. Run this script:              npx tsx scripts/seed-kv.ts
 *
 * Idempotent — re-running overwrites the KV value with the local file contents.
 * Use the --dry-run flag to inspect what would be uploaded without writing.
 */

import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";
import { kv } from "@vercel/kv";

config({ path: ".env.local" });

const DB_DIR = path.join(process.cwd(), "data", "db");
const KV_KEY_PREFIX = "mm:";

const TABLES = [
  "users",
  "parsed_policies",
  "reports",
  "rfqs",
  "bids",
  "transactions",
  "renewal_schedules",
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.KV_REST_API_URL) {
    console.error(
      "ERROR: KV_REST_API_URL is not set. Run `npx vercel env pull .env.local` after provisioning KV."
    );
    process.exit(1);
  }

  console.log(
    `Seeding KV at ${process.env.KV_REST_API_URL.slice(0, 40)}...${
      dryRun ? " [DRY RUN]" : ""
    }`
  );

  let totalRows = 0;
  for (const table of TABLES) {
    const file = path.join(DB_DIR, `${table}.json`);
    let rows: unknown[] = [];
    try {
      const data = await fs.readFile(file, "utf-8");
      rows = JSON.parse(data);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "ENOENT"
      ) {
        console.log(`  ${table.padEnd(20)} — no local file, skipping`);
        continue;
      }
      throw err;
    }

    const key = KV_KEY_PREFIX + table;
    if (!dryRun) {
      await kv.set(key, rows);
    }
    console.log(
      `  ${table.padEnd(20)} → ${key.padEnd(28)} (${rows.length} rows)`
    );
    totalRows += rows.length;
  }

  console.log(
    `\nDone. ${totalRows} rows ${dryRun ? "would be" : ""} written across ${TABLES.length} tables.`
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
